/**
 * Renting Knowledge Base Loader
 * Loads data from knowledge_base/renting/data.json into Supabase renting table
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { supabaseAdmin } from '../src/config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to renting knowledge base
const DATA_PATH = join(__dirname, '../../knowledge_base/renting/data.json');

/**
 * Flatten an object into searchable text
 */
function flattenToText(obj, prefix = '') {
  if (obj === null || obj === undefined) return '';
  
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
  
  if (Array.isArray(obj)) {
    return obj.map((item, i) => flattenToText(item, `${prefix}[${i}]`)).join(' ');
  }
  
  if (typeof obj === 'object') {
    return Object.entries(obj)
      .map(([key, value]) => `${key}: ${flattenToText(value, key)}`)
      .join(' ');
  }
  
  return '';
}

/**
 * Transform a platform item to database format
 */
function transformPlatform(platform, category) {
  const contentText = [
    platform.name,
    platform.description,
    flattenToText(platform.features),
    flattenToText(platform.pros),
    flattenToText(platform.cons),
    flattenToText(platform.tips),
    category,
    platform.coverage || '',
    platform.priceRange || '',
  ].filter(Boolean).join(' ');

  return {
    category,
    platform_id: platform.id,
    platform_name: platform.name,
    platform_url: platform.url || null,
    platform_description: platform.description || null,
    platform_data: platform,
    content_text: contentText,
  };
}

/**
 * Transform non-platform data (tips, legal info, etc.)
 */
function transformResource(item, category, resourceId) {
  const contentText = flattenToText(item);

  return {
    category,
    platform_id: resourceId,
    platform_name: resourceId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    platform_url: null,
    platform_description: typeof item === 'string' ? item : null,
    platform_data: item,
    content_text: contentText,
  };
}

/**
 * Load and parse the renting JSON
 */
async function loadRentingData() {
  try {
    const data = await readFile(DATA_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading renting data:', error.message);
    throw error;
  }
}

/**
 * Extract all renting entries from JSON structure
 */
function extractRentingEntries(rentingData) {
  const entries = [];

  // Process platforms categories
  if (rentingData.platforms) {
    for (const [category, platforms] of Object.entries(rentingData.platforms)) {
      if (Array.isArray(platforms)) {
        for (const platform of platforms) {
          if (platform && platform.id) {
            entries.push(transformPlatform(platform, category));
          }
        }
      }
    }
  }

  // Process rental dossier info
  if (rentingData.rentalDossier) {
    entries.push(transformResource(rentingData.rentalDossier, 'documentation', 'rental-dossier'));
  }

  // Process scam prevention
  if (rentingData.scamPrevention) {
    entries.push(transformResource(rentingData.scamPrevention, 'safety', 'scam-prevention'));
  }

  // Process rental tips
  if (rentingData.rentalTips) {
    entries.push(transformResource(rentingData.rentalTips, 'tips', 'rental-tips-general'));
    
    // Also add city-specific tips if available
    if (rentingData.rentalTips.byCity) {
      for (const [city, tips] of Object.entries(rentingData.rentalTips.byCity)) {
        entries.push(transformResource(tips, 'tips', `rental-tips-${city.toLowerCase()}`));
      }
    }
  }

  // Process legal info
  if (rentingData.legalInfo) {
    entries.push(transformResource(rentingData.legalInfo, 'legal', 'legal-info'));
  }

  return entries;
}

/**
 * Insert renting entries into Supabase (upsert)
 */
async function insertRentingEntries(entries) {
  console.log(`Inserting ${entries.length} renting entries into database...`);

  // Batch insert in chunks of 100
  const chunkSize = 100;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < entries.length; i += chunkSize) {
    const chunk = entries.slice(i, i + chunkSize);
    
    const { data, error } = await supabaseAdmin
      .from('renting')
      .upsert(chunk, {
        onConflict: 'category,platform_id',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error(`Error inserting chunk ${i / chunkSize + 1}:`, error.message);
      console.error('Error details:', error);
      errors += chunk.length;
    } else {
      inserted += chunk.length;
      console.log(`Inserted chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(entries.length / chunkSize)}`);
    }
  }

  return { inserted, errors };
}

/**
 * Clear all existing renting entries from database
 */
async function clearRenting() {
  console.log('Clearing existing renting entries...');
  
  const { error } = await supabaseAdmin
    .from('renting')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    console.error('Error clearing renting:', error.message);
    throw error;
  }
  
  console.log('Cleared existing renting entries.');
}

/**
 * Get statistics about loaded renting entries
 */
async function getStats() {
  const { count: totalCount } = await supabaseAdmin
    .from('renting')
    .select('*', { count: 'exact', head: true });

  const { data: categoryCounts } = await supabaseAdmin
    .from('renting')
    .select('category');

  const stats = { total: totalCount, byCategory: {} };
  
  if (categoryCounts) {
    for (const row of categoryCounts) {
      stats.byCategory[row.category] = (stats.byCategory[row.category] || 0) + 1;
    }
  }

  return stats;
}

/**
 * Main function to load renting data into database
 */
export async function loadRenting(options = { clear: false }) {
  console.log('='.repeat(50));
  console.log('Loading Renting Knowledge Base');
  console.log('='.repeat(50));

  try {
    // Optionally clear existing data
    if (options.clear) {
      await clearRenting();
    }

    // Load and parse JSON
    console.log('Loading renting data from:', DATA_PATH);
    const rentingData = await loadRentingData();
    console.log('Metadata:', rentingData.metadata);

    // Extract entries
    const entries = extractRentingEntries(rentingData);
    console.log(`Extracted ${entries.length} renting entries`);

    // Insert into database
    const result = await insertRentingEntries(entries);
    console.log(`\nResults: ${result.inserted} inserted, ${result.errors} errors`);

    // Show stats
    const stats = await getStats();
    console.log('\nDatabase Statistics:');
    console.log(`Total renting entries: ${stats.total}`);
    console.log('By category:', stats.byCategory);

    console.log('\n' + '='.repeat(50));
    console.log('Renting data loading complete!');
    console.log('='.repeat(50));

    return result;
  } catch (error) {
    console.error('Failed to load renting data:', error);
    throw error;
  }
}

// Run if executed directly
const isMainModule = process.argv[1] && fileURLToPath(import.meta.url).includes(process.argv[1].replace(/\\/g, '/'));
if (isMainModule) {
  loadRenting({ clear: true })
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default loadRenting;
