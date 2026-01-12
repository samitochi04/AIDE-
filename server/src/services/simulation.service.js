import OpenAI from 'openai';
import { openaiConfig } from '../config/openai.js';
import { supabaseAdmin } from '../config/supabase.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

const openai = new OpenAI({ apiKey: openaiConfig.apiKey });

/**
 * Simulation Service
 * Handles aide eligibility calculation based on user profile
 */
class SimulationService {
  constructor() {
    // Cache for AI-filtered results to reduce API calls
    this.filterCache = new Map();
  }
  /**
   * Run a simulation based on user answers
   * @param {Object} answers - User's simulation answers
   * @param {string} language - User's preferred language (fr/en)
   * @returns {Object} Simulation results with eligible aides
   */
  async runSimulation(answers, language = 'fr') {
    try {
      logger.info('Running simulation', { answers, language });

      // 1. Get relevant aides from database based on region
      const aides = await this.fetchAidesByRegion(answers.region);

      // 2. Basic filter aides based on eligibility criteria (age, profile type)
      const preFilteredAides = this.filterEligibleAides(aides, answers);

      // 3. AI-based smart filtering to remove irrelevant aides for user's situation
      const eligibleAides = await this.aiFilterAides(preFilteredAides, answers);

      // 4. Estimate monthly amounts based on user profile
      const aidesWithAmounts = this.estimateAmounts(eligibleAides, answers);

      // 5. Translate/format descriptions for user's language
      const translatedAides = await this.translateAides(aidesWithAmounts, language);

      // 6. Calculate totals
      const totalMonthly = translatedAides.reduce(
        (sum, aide) => sum + (aide.monthlyAmount || 0),
        0
      );

      return {
        eligibleAides: translatedAides,
        totalMonthly,
        totalAnnual: totalMonthly * 12,
        simulatedAt: new Date().toISOString(),
        profile: {
          region: answers.region,
          nationality: answers.nationality,
          residenceStatus: answers.residenceStatus,
        },
      };
    } catch (error) {
      logger.error('Simulation error', { error: error.message, answers });
      throw new AppError('Failed to run simulation', 500);
    }
  }

  /**
   * Fetch aides from database by region
   */
  async fetchAidesByRegion(region) {
    try {
      // Get both normalized region and slug formats
      const normalizedRegion = this.normalizeRegion(region);
      const regionSlug = this.getRegionSlug(region);
      logger.info('Fetching aides for region', { region, normalizedRegion, regionSlug });

      // Query database for region-specific and national aides
      // Use region_id for exact slug match, region_name for display name match
      let { data, error } = await supabaseAdmin
        .from('gov_aides')
        .select('*')
        .or(`region_id.eq.${regionSlug},region_id.ilike.%${regionSlug}%,region_name.eq.National,region_name.eq.national`);

      if (error) {
        logger.error('Error fetching aides from database', { error: error.message });
        throw error;
      }

      // If no region-specific results, get national aides
      if (!data || data.length === 0) {
        logger.info('No region-specific aides found, fetching national aides');
        const { data: nationalAides, error: nationalError } = await supabaseAdmin
          .from('gov_aides')
          .select('*')
          .or('region_name.eq.National,region_name.eq.national,region_name.is.null');

        if (nationalError) {
          logger.error('Error fetching national aides', { error: nationalError.message });
          throw nationalError;
        }
        data = nationalAides || [];
      }

      // Map database fields to expected format
      const mappedAides = data.map(aide => this.mapDatabaseAide(aide));
      
      logger.info(`Found ${mappedAides.length} aides for region: ${region}`);
      return mappedAides;
    } catch (error) {
      logger.error('Failed to fetch aides from database', { error: error.message, region });
      return [];
    }
  }

  /**
   * Map database aide to expected format
   */
  mapDatabaseAide(dbAide) {
    const aideData = dbAide.aide_data || {};
    return {
      id: dbAide.aide_id || dbAide.id,
      name: dbAide.aide_name || aideData.name,
      description: dbAide.aide_description || aideData.description,
      category: dbAide.aide_category || aideData.category || 'social',
      region: dbAide.region_name || 'National',
      regionId: dbAide.region_id,
      profileType: dbAide.profile_type,
      profileSubtype: dbAide.profile_subtype,
      eligibility: aideData.eligibility || {},
      amount: aideData.amount || {},
      applicationProcess: aideData.applicationProcess,
      requiredDocuments: aideData.requiredDocuments,
      source: aideData.source,
      content_text: dbAide.content_text,
      // Explicit URLs for frontend buttons
      sourceUrl: aideData.source?.url || null,
      applicationUrl: aideData.applicationProcess?.online?.url || null,
    };
  }

  /**
   * Normalize region string for database matching
   */
  normalizeRegion(region) {
    if (!region) return '';
    // Remove leading dashes and clean up
    let normalized = region.trim();
    // Remove leading dash if present (e.g., "-le-de-france" -> "le-de-france")
    if (normalized.startsWith('-')) {
      normalized = normalized.substring(1);
    }
    // Also fix "ile" without accent to match "île"
    if (normalized.toLowerCase().startsWith('ile-') || normalized.toLowerCase() === 'ile de france') {
      // Try to reconstruct proper region_id format
      normalized = 'ile-de-france';
    }
    return normalized;
  }
  
  /**
   * Get the slug version of region for querying region_id
   */
  getRegionSlug(region) {
    if (!region) return '';
    let slug = region.trim().toLowerCase();
    // Remove leading dash
    if (slug.startsWith('-')) {
      slug = slug.substring(1);
    }
    // Normalize accented characters
    slug = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Replace spaces with dashes
    slug = slug.replace(/\s+/g, '-');
    return slug;
  }

  /**
   * AI-based filtering to ensure aides are truly relevant to user's situation
   * This removes aides that technically pass basic filters but don't apply
   */
  async aiFilterAides(aides, answers) {
    if (aides.length === 0) return [];

    try {
      // Build user profile summary
      const userProfile = this.buildUserProfileSummary(answers);
      
      // Create list of aides with their names and descriptions
      const aidesList = aides.map((aide, index) => ({
        index,
        id: aide.id,
        name: aide.name,
        description: aide.description || '',
        category: aide.category,
      }));

      logger.info('Running AI filter on aides', { 
        aidesCount: aides.length,
        userProfile 
      });

      const response = await openai.chat.completions.create({
        model: openaiConfig.model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en aides sociales françaises. Tu dois analyser si chaque aide est réellement pertinente pour le profil de l'utilisateur.

RÈGLES IMPORTANTES:
- Les aides pour enfants (allocations familiales, PAJE, CMG, ARS, AEEH) ne sont PAS pertinentes pour quelqu'un SANS enfants
- Les aides pour personnes âgées (ASPA, APA) ne sont PAS pertinentes pour les jeunes
- Les aides pour handicap (AAH, PCH, CMI) ne sont pertinentes QUE si la personne est handicapée
- Les aides pour demandeurs d'emploi ne sont PAS pertinentes pour les étudiants
- La Prime d'activité n'est PAS pertinente pour les étudiants sans emploi salarié significatif
- Les bourses étudiantes SONT pertinentes pour les étudiants
- Les aides au logement (APL, ALS) SONT pertinentes pour les locataires

Retourne UNIQUEMENT un JSON avec le format: { "eligibleIds": [array of aide IDs that are TRULY relevant] }`,
          },
          {
            role: 'user',
            content: `Profil utilisateur:
${userProfile}

Liste des aides à filtrer:
${JSON.stringify(aidesList, null, 2)}

Retourne les IDs des aides réellement pertinentes pour ce profil.`,
          },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content);
      const eligibleIds = result.eligibleIds || result.eligible_ids || [];
      
      logger.info('AI filter result', { 
        originalCount: aides.length,
        filteredCount: eligibleIds.length,
        eligibleIds 
      });

      // Filter aides to only include those approved by AI
      const filteredAides = aides.filter(aide => 
        eligibleIds.includes(aide.id) || eligibleIds.includes(aide.name)
      );

      // If AI returned too few or empty results, fall back to basic filtering
      if (filteredAides.length === 0 && aides.length > 0) {
        logger.warn('AI filter returned no results, using basic filtering');
        return this.basicSmartFilter(aides, answers);
      }

      return filteredAides;
    } catch (error) {
      logger.error('AI filter error, falling back to basic filter', { error: error.message });
      return this.basicSmartFilter(aides, answers);
    }
  }

  /**
   * Build a human-readable summary of user profile for AI
   */
  buildUserProfileSummary(answers) {
    const parts = [];
    
    parts.push(`- Âge: ${answers.age} ans`);
    parts.push(`- Nationalité: ${answers.nationality === 'french' ? 'Française' : answers.nationality === 'eu' ? 'UE' : 'Non-UE'}`);
    parts.push(`- Statut: ${answers.residenceStatus === 'student' ? 'Étudiant' : answers.residenceStatus}`);
    parts.push(`- Logement: ${answers.housingStatus === 'renter' ? 'Locataire' : answers.housingStatus === 'owner' ? 'Propriétaire' : answers.housingStatus}`);
    if (answers.rent) parts.push(`- Loyer: ${answers.rent}€/mois`);
    parts.push(`- Revenus: ${answers.incomeBracket || 0}€/mois`);
    parts.push(`- Enfants: ${answers.hasChildren ? `Oui (${answers.numberOfChildren || 1})` : 'Non'}`);
    if (answers.employmentStatus) parts.push(`- Emploi: ${answers.employmentStatus}`);
    if (answers.yearsInFrance) parts.push(`- Années en France: ${answers.yearsInFrance}`);
    
    return parts.join('\n');
  }

  /**
   * Basic smart filter as fallback when AI fails
   */
  basicSmartFilter(aides, answers) {
    return aides.filter(aide => {
      const name = (aide.name || '').toLowerCase();
      const desc = (aide.description || '').toLowerCase();
      const combined = name + ' ' + desc;

      // Filter out children-related aides if no children
      if (!answers.hasChildren) {
        const childKeywords = ['enfant', 'naissance', 'grossesse', 'familiales', 'paje', 'cmg', 'ars ', 'aeeh', 'garde'];
        if (childKeywords.some(kw => combined.includes(kw))) {
          return false;
        }
      }

      // Filter out disability aides unless indicated
      if (!answers.hasDisability) {
        const disabilityKeywords = ['handicap', 'aah', 'pch', 'cmi', 'invalidité'];
        if (disabilityKeywords.some(kw => combined.includes(kw))) {
          return false;
        }
      }

      // Filter out senior aides for young people
      if (answers.age < 60) {
        const seniorKeywords = ['aspa', 'apa', 'personnes âgées', 'retraite', 'senior'];
        if (seniorKeywords.some(kw => combined.includes(kw))) {
          return false;
        }
      }

      // For students, filter out employment-specific aides
      if (answers.residenceStatus === 'student' || answers.employmentStatus === 'student') {
        const employmentKeywords = ['demandeur d\'emploi', 'chômage', 'are ', 'ass ', 'retour emploi'];
        if (employmentKeywords.some(kw => combined.includes(kw))) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Filter aides based on user eligibility (basic pre-filter)
   */
  filterEligibleAides(aides, answers) {
    logger.info('Filtering aides', { 
      totalAides: aides.length, 
      userNationality: answers.nationality,
      userAge: answers.age,
      residenceStatus: answers.residenceStatus,
      housingStatus: answers.housingStatus,
    });

    const filtered = aides.filter((aide) => {
      const eligibility = aide.eligibility || {};
      const aideName = aide.name || '';

      // Check nationality - be inclusive for non-EU with valid residence
      if (eligibility.nationality) {
        const allowedNationalities = Array.isArray(eligibility.nationality) 
          ? eligibility.nationality 
          : [eligibility.nationality];
        
        const userNationality = answers.nationality;
        
        // Map user answer to eligibility values
        const isEligibleByNationality = allowedNationalities.some(allowed => {
          const lowerAllowed = (allowed || '').toLowerCase();
          
          // French citizen matches french
          if (userNationality === 'french') {
            return ['french', 'eu', 'all'].includes(lowerAllowed) || lowerAllowed.includes('french');
          }
          // EU citizen matches eu
          if (userNationality === 'eu') {
            return ['eu', 'eu_eea', 'all'].includes(lowerAllowed) || lowerAllowed.includes('eu');
          }
          // Non-EU matches non-eu entries (assuming they have valid titre de séjour)
          if (userNationality === 'non-eu') {
            return lowerAllowed.includes('non-eu') || 
                   lowerAllowed.includes('non_eu') ||
                   lowerAllowed.includes('all') ||
                   // Many French aides are available to non-EU with valid residence permit
                   lowerAllowed.includes('valid-titre') ||
                   lowerAllowed.includes('titre');
          }
          return lowerAllowed === 'all';
        });

        // Only filter out if nationality is explicitly restricted AND user doesn't match
        // Most aides don't have strict nationality requirements
        if (allowedNationalities.length > 0 && !isEligibleByNationality) {
          // Check if it's a strict exclusion
          const hasStrictExclusion = allowedNationalities.some(a => 
            ['french_only', 'eu_only'].includes((a || '').toLowerCase())
          );
          if (hasStrictExclusion) {
            logger.debug(`Excluding ${aideName} - nationality mismatch`);
            return false;
          }
        }
      }

      // Check age requirements
      const ageRange = eligibility.ageRange || {};
      if (ageRange.min && answers.age < ageRange.min) {
        logger.debug(`Excluding ${aideName} - below min age ${ageRange.min}`);
        return false;
      }
      if (ageRange.max && answers.age > ageRange.max) {
        logger.debug(`Excluding ${aideName} - above max age ${ageRange.max}`);
        return false;
      }

      // Also check legacy format
      if (eligibility.minAge && answers.age < eligibility.minAge) {
        return false;
      }
      if (eligibility.maxAge && answers.age > eligibility.maxAge) {
        return false;
      }

      // Check profile type matching (students, workers, etc.)
      if (aide.profileType) {
        const profileMatch = this.matchesProfile(aide.profileType, answers);
        if (!profileMatch) {
          logger.debug(`Excluding ${aideName} - profile mismatch`);
          return false;
        }
      }

      // Housing aides - check if user is renter
      if (aide.category === 'housing' || aide.category === 'logement') {
        // Only filter for explicitly housing-dependent aides when user is owner
        if (answers.housingStatus === 'owner') {
          const lowerName = aideName.toLowerCase();
          if (lowerName.includes('apl') || lowerName.includes('als') || lowerName.includes('alf')) {
            logger.debug(`Excluding ${aideName} - owner cannot get rental aid`);
            return false;
          }
        }
      }

      // Check family requirements
      if (eligibility.requiresChildren && !answers.hasChildren) {
        return false;
      }

      return true;
    });

    logger.info(`Filtered to ${filtered.length} eligible aides`);
    return filtered;
  }

  /**
   * Check if user profile matches aide profile type
   */
  matchesProfile(profileType, answers) {
    if (!profileType || profileType === 'all') return true;
    
    const lowerProfile = profileType.toLowerCase();
    const residenceStatus = (answers.residenceStatus || '').toLowerCase();
    const employmentStatus = (answers.employmentStatus || '').toLowerCase();

    // Students
    if (lowerProfile === 'students' || lowerProfile === 'student') {
      return residenceStatus === 'student' || residenceStatus === 'étudiant';
    }
    
    // Workers
    if (lowerProfile === 'workers' || lowerProfile === 'worker') {
      return ['worker', 'employed', 'salarié', 'travailleur'].includes(residenceStatus) ||
             ['employed', 'self-employed'].includes(employmentStatus);
    }
    
    // Job seekers
    if (lowerProfile === 'jobseekers' || lowerProfile === 'jobseeker') {
      return residenceStatus === 'job-seeker' || residenceStatus === 'unemployed' ||
             employmentStatus === 'unemployed';
    }

    // If no specific match required, include it
    return true;
  }

  /**
   * Estimate monthly amounts based on user profile
   */
  estimateAmounts(aides, answers) {
    return aides.map((aide) => {
      let monthlyAmount = 0;

      // Get base amount from aide data
      const amounts = aide.amounts || aide.data?.amounts || {};
      const baseAmount = amounts.monthly || amounts.base || 0;
      
      // Try to get amount from aide.amount structure
      const aideAmount = aide.amount || {};
      const minAmount = aideAmount.min || 0;
      const maxAmount = aideAmount.max || 0;

      // Calculate based on aide type
      const aideName = (aide.name || '').toLowerCase();
      const category = (aide.category || '').toLowerCase();

      if (aideName.includes('apl') || aideName.includes('als') || aideName.includes('alf')) {
        // Housing aid - based on rent
        const rent = answers.rent || 0;
        if (rent > 0) {
          // APL typically covers 30-60% of rent depending on income
          const incomeMultiplier = this.getIncomeMultiplier(answers.incomeBracket);
          monthlyAmount = Math.min(rent * 0.5 * incomeMultiplier, maxAmount || 500);
        } else {
          monthlyAmount = baseAmount || maxAmount || 250;
        }
      } else if (aideName.includes('bourse') && aideName.includes('critères sociaux')) {
        // Student scholarship - BCS
        // Average based on income bracket
        const avgBourse = (minAmount + maxAmount) / 2 || 350;
        monthlyAmount = answers.incomeBracket < 1500 ? avgBourse : avgBourse * 0.5;
      } else if (aideName.includes('rsa')) {
        // RSA - Active Solidarity Income
        if (answers.incomeBracket < 1000 || !answers.incomeBracket) {
          monthlyAmount = answers.hasChildren 
            ? 750 + (answers.numberOfChildren || 0) * 200
            : 565;
        }
      } else if (aideName.includes('prime d\'activité') || aideName.includes('prime activite')) {
        // Activity bonus - only for workers
        if ((answers.employmentStatus === 'employed' || answers.employmentStatus === 'self-employed') 
            && answers.incomeBracket < 2000) {
          monthlyAmount = Math.max(0, 200 - (answers.incomeBracket || 0) * 0.1);
        }
      } else if (aideName.includes('imagine r') || aideName.includes('navigo')) {
        // Transport pass discount for students
        monthlyAmount = 40; // Average monthly savings
      } else if (aideName.includes('cvec')) {
        // CVEC is a fee, not an aide - set to 0 or negative
        monthlyAmount = 0;
      } else if (category === 'family' || category === 'famille') {
        // Family aides
        if (answers.hasChildren) {
          const childCount = answers.numberOfChildren || 1;
          monthlyAmount = baseAmount || (childCount >= 2 ? 140 * (childCount - 1) : 0);
        }
      } else if (category === 'education' || category === 'étudiant') {
        // Student aides
        if (answers.residenceStatus === 'student' || answers.employmentStatus === 'student') {
          monthlyAmount = baseAmount || maxAmount || 100;
        }
      } else {
        // Default to base amount or estimate
        monthlyAmount = baseAmount || this.estimateDefaultAmount(aide, answers);
      }

      return {
        ...aide,
        monthlyAmount: Math.round(monthlyAmount),
        estimatedAnnual: Math.round(monthlyAmount * 12),
      };
    });
  }

  /**
   * Get income multiplier for calculations
   */
  getIncomeMultiplier(income) {
    if (!income || income < 500) return 1.0;
    if (income < 1000) return 0.9;
    if (income < 1500) return 0.7;
    if (income < 2000) return 0.5;
    return 0.3;
  }

  /**
   * Estimate default amount for unspecified aides
   */
  estimateDefaultAmount(aide, answers) {
    const category = (aide.category || '').toLowerCase();
    
    switch (category) {
      case 'housing':
      case 'logement':
        return 200;
      case 'health':
      case 'santé':
        return 50;
      case 'transport':
        return 30;
      case 'education':
      case 'formation':
        return 100;
      default:
        return 50;
    }
  }

  /**
   * Translate aide descriptions to user's language using AI
   */
  async translateAides(aides, language) {
    // If French or no aides, return as-is
    if (language === 'fr' || aides.length === 0) {
      return aides.map((aide) => this.formatAide(aide, 'fr'));
    }

    try {
      // Batch translate descriptions using OpenAI
      const descriptions = aides.map((a) => a.description || a.content_text || '').slice(0, 10);
      
      const response = await openai.chat.completions.create({
        model: openaiConfig.model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a translator. Translate the following French texts about government benefits in France to English. Keep the translations concise and clear. Return a JSON array of translated strings.`,
          },
          {
            role: 'user',
            content: JSON.stringify(descriptions),
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const translated = JSON.parse(response.choices[0].message.content);
      const translations = translated.translations || translated.results || descriptions;

      return aides.map((aide, index) => ({
        ...this.formatAide(aide, language),
        description: translations[index] || aide.description || aide.content_text,
      }));
    } catch (error) {
      logger.error('Translation error', { error: error.message });
      // Return untranslated on error
      return aides.map((aide) => this.formatAide(aide, language));
    }
  }

  /**
   * Format aide for response
   */
  formatAide(aide, language) {
    const categoryTranslations = {
      fr: {
        housing: 'Logement',
        logement: 'Logement',
        family: 'Famille',
        famille: 'Famille',
        employment: 'Emploi',
        emploi: 'Emploi',
        social: 'Social',
        health: 'Santé',
        santé: 'Santé',
        education: 'Éducation',
        transport: 'Transport',
      },
      en: {
        housing: 'Housing',
        logement: 'Housing',
        family: 'Family',
        famille: 'Family',
        employment: 'Employment',
        emploi: 'Employment',
        social: 'Social',
        health: 'Health',
        santé: 'Health',
        education: 'Education',
        transport: 'Transport',
      },
    };

    const category = (aide.category || 'social').toLowerCase();
    const translations = categoryTranslations[language] || categoryTranslations.fr;

    return {
      id: aide.id || aide.aide_id,
      name: aide.name || aide.title,
      category: translations[category] || aide.category,
      categoryKey: category,
      description: aide.description || aide.content_text || '',
      monthlyAmount: aide.monthlyAmount || 0,
      estimatedAnnual: aide.estimatedAnnual || 0,
      organism: aide.organism || aide.data?.organism || 'CAF',
      officialUrl: aide.official_url || aide.data?.officialUrl || null,
      region: aide.region || 'National',
      requirements: aide.requirements || aide.data?.requirements || [],
      processingTime: aide.processing_time || aide.data?.processingTime || '2-4 semaines',
      // URLs for action buttons
      sourceUrl: aide.sourceUrl || aide.source?.url || null,
      applicationUrl: aide.applicationUrl || aide.applicationProcess?.online?.url || null,
    };
  }

  /**
   * Save simulation results to database for logged-in users
   */
  async saveSimulation(userId, answers, results) {
    try {
      const eligibleAides = results.eligibleAides || [];
      const { data, error } = await supabaseAdmin
        .from('simulations')
        .insert({
          user_id: userId,
          answers,
          results,
          total_monthly: results.totalMonthly || 0,
          total_annual: results.totalAnnual || 0,
          eligible_aides_count: eligibleAides.length,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to save simulation', { userId, error: error.message });
      // Don't throw - saving is optional
      return null;
    }
  }

  /**
   * Get user's simulation history
   */
  async getSimulationHistory(userId, limit = 10) {
    try {
      const { data, error } = await supabaseAdmin
        .from('simulations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to get simulation history', { userId, error: error.message });
      return [];
    }
  }

  /**
   * Get user's latest simulation
   */
  async getLatestSimulation(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('simulations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data || null;
    } catch (error) {
      logger.error('Failed to get latest simulation', { userId, error: error.message });
      return null;
    }
  }

  /**
   * Get a specific simulation by ID
   */
  async getSimulationById(userId, simulationId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('simulations')
        .select('*')
        .eq('id', simulationId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      logger.error('Failed to get simulation by ID', { userId, simulationId, error: error.message });
      return null;
    }
  }

  /**
   * Get user's saved aides
   */
  async getSavedAides(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('saved_aides')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to get saved aides', { userId, error: error.message });
      return [];
    }
  }

  /**
   * Save/bookmark an aide
   */
  async saveAide(userId, aide, simulationId = null) {
    try {
      const { data, error } = await supabaseAdmin
        .from('saved_aides')
        .insert({
          user_id: userId,
          aide_id: aide.id,
          aide_name: aide.name,
          aide_description: aide.description,
          aide_category: aide.category || aide.categoryKey,
          monthly_amount: aide.monthlyAmount || 0,
          source_url: aide.sourceUrl,
          application_url: aide.applicationUrl,
          simulation_id: simulationId,
          status: 'saved',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to save aide', { userId, aideId: aide.id, error: error.message });
      throw error;
    }
  }

  /**
   * Remove a saved aide
   */
  async unsaveAide(userId, aideId) {
    try {
      const { error } = await supabaseAdmin
        .from('saved_aides')
        .delete()
        .eq('user_id', userId)
        .eq('aide_id', aideId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Failed to unsave aide', { userId, aideId, error: error.message });
      throw error;
    }
  }

  /**
   * Update saved aide status
   */
  async updateSavedAideStatus(userId, aideId, status, notes = null) {
    try {
      const updateData = { status };
      if (notes !== null) {
        updateData.notes = notes;
      }
      if (status === 'applied') {
        updateData.applied_at = new Date().toISOString();
      }

      const { data, error } = await supabaseAdmin
        .from('saved_aides')
        .update(updateData)
        .eq('user_id', userId)
        .eq('aide_id', aideId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to update saved aide status', { userId, aideId, error: error.message });
      throw error;
    }
  }
}

export const simulationService = new SimulationService();
export default simulationService;
