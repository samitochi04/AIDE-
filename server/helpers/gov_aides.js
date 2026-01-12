/**
 * Government Aides Knowledge Base Loader
 * Loads data from knowledge_base/data.json into Supabase gov_aides table
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { supabaseAdmin } from '../src/config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to knowledge base
const DATA_PATH = join(__dirname, '../../knowledge_base/data.json');

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
 * Transform an aide from JSON to database format
 */
function transformAide(aide, region, profileType, profileSubtype = null) {
  const contentText = [
    aide.name,
    aide.description,
    flattenToText(aide.eligibility),
    flattenToText(aide.amount),
    flattenToText(aide.applicationProcess),
    flattenToText(aide.requiredDocuments),
    region.name,
    profileType,
    profileSubtype || '',
  ].filter(Boolean).join(' ');

  return {
    region_id: region.id,
    region_name: region.name,
    region_code: region.code,
    departments: region.departments,
    profile_type: profileType,
    profile_subtype: profileSubtype,
    aide_id: aide.id,
    aide_name: aide.name,
    aide_description: aide.description,
    aide_category: aide.category || null,
    aide_data: aide,
    content_text: contentText,
    source_url: aide.source?.url || null,
    last_verified: new Date().toISOString(),
  };
}

/**
 * Load and parse the knowledge base JSON
 */
async function loadKnowledgeBase() {
  try {
    const data = await readFile(DATA_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading knowledge base:', error.message);
    throw error;
  }
}

/**
 * Extract all aides from all regions
 */
function extractAides(knowledgeBase) {
  const aides = [];

  for (const region of knowledgeBase.regions) {
    if (!region.profiles) continue;

    // Process each profile type (students, workers, jobSeekers, etc.)
    for (const [profileType, profileData] of Object.entries(region.profiles)) {
      if (!profileData) continue;

      // If profileData has aides directly
      if (profileData.aides && Array.isArray(profileData.aides)) {
        for (const aide of profileData.aides) {
          aides.push(transformAide(aide, region, profileType, null));
        }
      }

      // If profileData has nationality sub-categories (french, eu, nonEu)
      for (const [subtype, subtypeData] of Object.entries(profileData)) {
        if (subtypeData && subtypeData.aides && Array.isArray(subtypeData.aides)) {
          for (const aide of subtypeData.aides) {
            aides.push(transformAide(aide, region, profileType, subtype));
          }
        }
      }
    }
  }

  return aides;
}

/**
 * Insert aides into Supabase (upsert)
 */
async function insertAides(aides) {
  console.log(`Inserting ${aides.length} aides into database...`);

  // Batch insert in chunks of 100
  const chunkSize = 100;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < aides.length; i += chunkSize) {
    const chunk = aides.slice(i, i + chunkSize);
    
    const { data, error } = await supabaseAdmin
      .from('gov_aides')
      .upsert(chunk, {
        onConflict: 'region_id,profile_type,aide_id',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error(`Error inserting chunk ${i / chunkSize + 1}:`, error.message);
      errors += chunk.length;
    } else {
      inserted += chunk.length;
      console.log(`Inserted chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(aides.length / chunkSize)}`);
    }
  }

  return { inserted, errors };
}

/**
 * Clear all existing aides from database
 */
async function clearAides() {
  console.log('Clearing existing gov_aides...');
  
  const { error } = await supabaseAdmin
    .from('gov_aides')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

  if (error) {
    console.error('Error clearing aides:', error.message);
    throw error;
  }
  
  console.log('Cleared existing aides.');
}

/**
 * Get statistics about loaded aides
 */
async function getStats() {
  const { count: totalCount } = await supabaseAdmin
    .from('gov_aides')
    .select('*', { count: 'exact', head: true });

  const { data: regionCounts } = await supabaseAdmin
    .from('gov_aides')
    .select('region_name')
    .then(result => {
      const counts = {};
      result.data?.forEach(row => {
        counts[row.region_name] = (counts[row.region_name] || 0) + 1;
      });
      return { data: counts };
    });

  return {
    total: totalCount,
    byRegion: regionCounts,
  };
}

/**
 * Main function to load gov_aides into database
 */
export async function loadGovAides(options = { clear: false }) {
  console.log('='.repeat(50));
  console.log('Loading Government Aides Knowledge Base');
  console.log('='.repeat(50));

  try {
    // Optionally clear existing data
    if (options.clear) {
      await clearAides();
    }

    // Load and parse JSON
    console.log('Loading knowledge base from:', DATA_PATH);
    const knowledgeBase = await loadKnowledgeBase();
    console.log(`Loaded ${knowledgeBase.regions?.length || 0} regions`);

    // Extract aides
    const aides = extractAides(knowledgeBase);
    console.log(`Extracted ${aides.length} aides`);

    // Insert into database
    const result = await insertAides(aides);
    console.log(`\nResults: ${result.inserted} inserted, ${result.errors} errors`);

    // Show stats
    const stats = await getStats();
    console.log('\nDatabase Statistics:');
    console.log(`Total aides: ${stats.total}`);

    console.log('\n' + '='.repeat(50));
    console.log('Gov Aides loading complete!');
    console.log('='.repeat(50));

    return result;
  } catch (error) {
    console.error('Failed to load gov_aides:', error);
    throw error;
  }
}

// Run if executed directly
const isMainModule = process.argv[1] && fileURLToPath(import.meta.url).includes(process.argv[1].replace(/\\/g, '/'));
if (isMainModule) {
  loadGovAides({ clear: true })
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default loadGovAides;
