/**
 * Procedures Knowledge Base Loader
 * Loads data from knowledge_base/procedure/data.json into Supabase procedures table
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { supabaseAdmin } from '../src/config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to procedures knowledge base
const DATA_PATH = join(__dirname, '../../knowledge_base/procedure/data.json');

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

// Counter for generating unique IDs
let idCounter = 0;

/**
 * Generate a unique procedure ID
 */
function generateUniqueId(item, category, subcategory, section, subsection) {
  idCounter++;
  // Use item.id if available, otherwise generate based on context
  if (item.id) {
    return `${item.id}-${subsection || 'main'}-${idCounter}`;
  }
  const baseName = (item.name || item.title || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30);
  return `${section}-${subsection || 'main'}-${baseName}-${idCounter}`;
}

/**
 * Transform a procedure item to database format
 */
function transformProcedure(item, category, subcategory, section, subsection = null) {
  // Generate unique ID
  const procedureId = generateUniqueId(item, category, subcategory, section, subsection);
  const procedureName = item.name || item.title || section;
  const procedureDescription = item.description || '';

  const contentText = [
    procedureName,
    procedureDescription,
    flattenToText(item),
    category,
    subcategory,
    section,
    subsection || '',
  ].filter(Boolean).join(' ');

  return {
    category,
    subcategory,
    procedure_id: procedureId,
    procedure_name: procedureName,
    procedure_description: procedureDescription,
    section,
    subsection,
    procedure_data: item,
    content_text: contentText,
    source_url: item.url || item.source?.url || null,
    last_verified: new Date().toISOString(),
  };
}

/**
 * Load and parse the procedures JSON
 */
async function loadProceduresData() {
  try {
    const data = await readFile(DATA_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading procedures data:', error.message);
    throw error;
  }
}

/**
 * Extract all procedures from JSON structure
 */
function extractProcedures(proceduresData) {
  // Reset ID counter
  idCounter = 0;
  const procedures = [];

  // Process students
  if (proceduresData.students) {
    for (const [profileType, profile] of Object.entries(proceduresData.students)) {
      if (!profile || typeof profile !== 'object') continue;

      // Process each section (preArrival, arrival, banking, dailyLife, etc.)
      for (const [sectionName, sectionData] of Object.entries(profile)) {
        if (!sectionData || typeof sectionData !== 'object') continue;
        if (['id', 'name', 'description', 'note', 'keyAdvantage', 'referenceSections'].includes(sectionName)) continue;

        // Handle array sections (documents, preparation, administrative, etc.)
        if (Array.isArray(sectionData)) {
          for (const item of sectionData) {
            procedures.push(transformProcedure(item, 'students', profileType, sectionName));
          }
        }
        // Handle object sections with subsections
        else if (typeof sectionData === 'object') {
          for (const [subsectionName, subsectionData] of Object.entries(sectionData)) {
            if (Array.isArray(subsectionData)) {
              for (const item of subsectionData) {
                procedures.push(transformProcedure(item, 'students', profileType, sectionName, subsectionName));
              }
            } else if (subsectionData && typeof subsectionData === 'object') {
              // Single object item
              procedures.push(transformProcedure(subsectionData, 'students', profileType, sectionName, subsectionName));
            }
          }
        }
      }
    }
  }

  // Process workers
  if (proceduresData.workers) {
    for (const [profileType, profile] of Object.entries(proceduresData.workers)) {
      if (!profile || typeof profile !== 'object') continue;

      for (const [sectionName, sectionData] of Object.entries(profile)) {
        if (!sectionData || typeof sectionData !== 'object') continue;
        if (['id', 'name', 'description', 'note', 'keyAdvantage', 'keyNote', 'referenceSections'].includes(sectionName)) continue;

        if (Array.isArray(sectionData)) {
          for (const item of sectionData) {
            procedures.push(transformProcedure(item, 'workers', profileType, sectionName));
          }
        } else if (typeof sectionData === 'object') {
          for (const [subsectionName, subsectionData] of Object.entries(sectionData)) {
            if (Array.isArray(subsectionData)) {
              for (const item of subsectionData) {
                procedures.push(transformProcedure(item, 'workers', profileType, sectionName, subsectionName));
              }
            } else if (subsectionData && typeof subsectionData === 'object') {
              procedures.push(transformProcedure(subsectionData, 'workers', profileType, sectionName, subsectionName));
            }
          }
        }
      }
    }
  }

  return procedures;
}

/**
 * Insert procedures into Supabase (upsert)
 */
async function insertProcedures(procedures) {
  console.log(`Inserting ${procedures.length} procedures into database...`);

  // Batch insert in chunks of 100
  const chunkSize = 100;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < procedures.length; i += chunkSize) {
    const chunk = procedures.slice(i, i + chunkSize);
    
    const { data, error } = await supabaseAdmin
      .from('procedures')
      .upsert(chunk, {
        onConflict: 'category,subcategory,section,procedure_id',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error(`Error inserting chunk ${i / chunkSize + 1}:`, error.message);
      errors += chunk.length;
    } else {
      inserted += chunk.length;
      console.log(`Inserted chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(procedures.length / chunkSize)}`);
    }
  }

  return { inserted, errors };
}

/**
 * Clear all existing procedures from database
 */
async function clearProcedures() {
  console.log('Clearing existing procedures...');
  
  const { error } = await supabaseAdmin
    .from('procedures')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    console.error('Error clearing procedures:', error.message);
    throw error;
  }
  
  console.log('Cleared existing procedures.');
}

/**
 * Get statistics about loaded procedures
 */
async function getStats() {
  const { count: totalCount } = await supabaseAdmin
    .from('procedures')
    .select('*', { count: 'exact', head: true });

  const { data: categoryCounts } = await supabaseAdmin
    .from('procedures')
    .select('category, subcategory');

  const stats = { total: totalCount, byCategory: {} };
  
  if (categoryCounts) {
    for (const row of categoryCounts) {
      const key = `${row.category}/${row.subcategory}`;
      stats.byCategory[key] = (stats.byCategory[key] || 0) + 1;
    }
  }

  return stats;
}

/**
 * Main function to load procedures into database
 */
export async function loadProcedures(options = { clear: false }) {
  console.log('='.repeat(50));
  console.log('Loading Procedures Knowledge Base');
  console.log('='.repeat(50));

  try {
    // Optionally clear existing data
    if (options.clear) {
      await clearProcedures();
    }

    // Load and parse JSON
    console.log('Loading procedures from:', DATA_PATH);
    const proceduresData = await loadProceduresData();
    console.log('Metadata:', proceduresData.metadata);

    // Extract procedures
    const procedures = extractProcedures(proceduresData);
    console.log(`Extracted ${procedures.length} procedures`);

    // Insert into database
    const result = await insertProcedures(procedures);
    console.log(`\nResults: ${result.inserted} inserted, ${result.errors} errors`);

    // Show stats
    const stats = await getStats();
    console.log('\nDatabase Statistics:');
    console.log(`Total procedures: ${stats.total}`);
    console.log('By category:', stats.byCategory);

    console.log('\n' + '='.repeat(50));
    console.log('Procedures loading complete!');
    console.log('='.repeat(50));

    return result;
  } catch (error) {
    console.error('Failed to load procedures:', error);
    throw error;
  }
}

// Run if executed directly
const isMainModule = process.argv[1] && fileURLToPath(import.meta.url).includes(process.argv[1].replace(/\\/g, '/'));
if (isMainModule) {
  loadProcedures({ clear: true })
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default loadProcedures;
