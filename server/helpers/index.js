/**
 * Knowledge Base Loader - Main Entry Point
 * 
 * Loads all knowledge base data into Supabase:
 * - gov_aides: Government financial aides by region
 * - procedures: Administrative procedures for students/workers
 * - renting: Housing and rental platform information
 * 
 * Usage:
 *   node helpers/index.js           # Load all data
 *   node helpers/index.js --clear   # Clear existing data first
 *   node helpers/gov_aides.js       # Load only gov_aides
 *   node helpers/procedures.js      # Load only procedures
 *   node helpers/renting.js         # Load only renting
 */

import 'dotenv/config';
import { loadGovAides } from './gov_aides.js';
import { loadProcedures } from './procedures.js';
import { loadRenting } from './renting.js';

/**
 * Load all knowledge bases into Supabase
 */
async function loadAllKnowledgeBases(options = { clear: false }) {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         AIDE+ Knowledge Base Loader                        ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║  Loading all knowledge bases into Supabase...              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  const results = {
    govAides: null,
    procedures: null,
    renting: null,
  };

  try {
    // Load Government Aides
    console.log('\n📋 Step 1/3: Loading Government Aides...\n');
    results.govAides = await loadGovAides(options);
  } catch (error) {
    console.error('❌ Failed to load gov_aides:', error.message);
    results.govAides = { error: error.message };
  }

  try {
    // Load Procedures
    console.log('\n📝 Step 2/3: Loading Procedures...\n');
    results.procedures = await loadProcedures(options);
  } catch (error) {
    console.error('❌ Failed to load procedures:', error.message);
    results.procedures = { error: error.message };
  }

  try {
    // Load Renting
    console.log('\n🏠 Step 3/3: Loading Renting Data...\n');
    results.renting = await loadRenting(options);
  } catch (error) {
    console.error('❌ Failed to load renting:', error.message);
    results.renting = { error: error.message };
  }

  // Print summary
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    LOADING COMPLETE                        ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  
  if (results.govAides?.inserted !== undefined) {
    console.log(`║  ✅ Gov Aides:   ${String(results.govAides.inserted).padStart(5)} inserted, ${String(results.govAides.errors).padStart(3)} errors       ║`);
  } else {
    console.log(`║  ❌ Gov Aides:   Failed - ${results.govAides?.error?.substring(0, 25) || 'Unknown'}       ║`);
  }
  
  if (results.procedures?.inserted !== undefined) {
    console.log(`║  ✅ Procedures:  ${String(results.procedures.inserted).padStart(5)} inserted, ${String(results.procedures.errors).padStart(3)} errors       ║`);
  } else {
    console.log(`║  ❌ Procedures:  Failed - ${results.procedures?.error?.substring(0, 25) || 'Unknown'}       ║`);
  }
  
  if (results.renting?.inserted !== undefined) {
    console.log(`║  ✅ Renting:     ${String(results.renting.inserted).padStart(5)} inserted, ${String(results.renting.errors).padStart(3)} errors       ║`);
  } else {
    console.log(`║  ❌ Renting:     Failed - ${results.renting?.error?.substring(0, 25) || 'Unknown'}       ║`);
  }
  
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  return results;
}

// Run if executed directly
if (process.argv[1]?.includes('helpers/index.js') || process.argv[1]?.includes('helpers\\index.js')) {
  const clearFlag = process.argv.includes('--clear');
  
  console.log(`Options: { clear: ${clearFlag} }`);
  
  loadAllKnowledgeBases({ clear: clearFlag })
    .then((results) => {
      const hasErrors = Object.values(results).some(r => r?.errors > 0 || r?.error);
      process.exit(hasErrors ? 1 : 0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { loadGovAides, loadProcedures, loadRenting, loadAllKnowledgeBases };
export default loadAllKnowledgeBases;
