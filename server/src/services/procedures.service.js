import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

/**
 * Procedures Service
 * Handles user procedure tracking and knowledge base queries
 */
class ProceduresService {
  /**
   * Get user's tracked procedures
   */
  async getUserProcedures(userId, filters = {}) {
    try {
      let query = supabaseAdmin
        .from('user_procedures')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.category && filters.category !== 'all') {
        query = query.eq('procedure_category', filters.category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to get user procedures', { userId, error: error.message });
      return [];
    }
  }

  /**
   * Get recommended procedures based on user's latest simulation
   */
  async getRecommendedProcedures(userId) {
    try {
      // Get user's latest simulation
      const { data: simulation } = await supabaseAdmin
        .from('simulations')
        .select('answers, results')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!simulation) {
        return this.getDefaultProcedures();
      }

      const answers = simulation.answers || {};
      const residenceStatus = answers.residenceStatus || 'other';
      
      // Map residence status to procedure category
      const categoryMap = {
        'student': 'students',
        'worker': 'workers',
        'refugee': 'workers',
        'family': 'workers',
        'other': 'workers',
      };
      
      const category = categoryMap[residenceStatus] || 'workers';
      
      // Get procedures from knowledge base
      const { data: procedures, error } = await supabaseAdmin
        .from('procedures')
        .select('*')
        .eq('category', category)
        .limit(20);

      if (error) throw error;

      // Get user's already tracked procedures
      const { data: userProcedures } = await supabaseAdmin
        .from('user_procedures')
        .select('procedure_id')
        .eq('user_id', userId);

      const trackedIds = new Set((userProcedures || []).map(p => p.procedure_id));

      // Format and filter out already tracked
      return (procedures || [])
        .filter(p => !trackedIds.has(p.procedure_id))
        .map(p => this.formatKnowledgeProcedure(p))
        .slice(0, 10);
    } catch (error) {
      logger.error('Failed to get recommended procedures', { userId, error: error.message });
      return this.getDefaultProcedures();
    }
  }

  /**
   * Get default procedures for new users
   */
  getDefaultProcedures() {
    return [
      {
        id: 'default-bank-account',
        procedure_id: 'open-bank-account',
        procedure_name: 'Open a French Bank Account',
        procedure_description: 'Essential for receiving salary, aides, and daily transactions',
        procedure_category: 'banking',
        provider: 'Various Banks',
        steps: [
          { name: 'Choose a bank', completed: false },
          { name: 'Gather required documents', completed: false },
          { name: 'Schedule appointment or apply online', completed: false },
          { name: 'Submit application', completed: false },
          { name: 'Receive bank card and RIB', completed: false },
        ],
        required_documents: [
          { name: 'Valid ID or passport', uploaded: false },
          { name: 'Proof of address', uploaded: false },
          { name: 'Proof of income or student status', uploaded: false },
        ],
        estimatedTime: '1-2 weeks',
        isRecommended: true,
      },
      {
        id: 'default-social-security',
        procedure_id: 'social-security-registration',
        procedure_name: 'Register for Social Security',
        procedure_description: 'Get your Carte Vitale for healthcare coverage',
        procedure_category: 'health',
        provider: 'CPAM / Ameli',
        provider_url: 'https://www.ameli.fr',
        steps: [
          { name: 'Create account on ameli.fr', completed: false },
          { name: 'Fill registration form', completed: false },
          { name: 'Upload documents', completed: false },
          { name: 'Wait for processing', completed: false },
          { name: 'Receive Carte Vitale', completed: false },
        ],
        required_documents: [
          { name: 'Valid ID or passport', uploaded: false },
          { name: 'Birth certificate', uploaded: false },
          { name: 'Proof of residence', uploaded: false },
          { name: 'RIB (bank details)', uploaded: false },
        ],
        estimatedTime: '2-6 weeks',
        isRecommended: true,
      },
      {
        id: 'default-caf-registration',
        procedure_id: 'caf-registration',
        procedure_name: 'Register with CAF',
        procedure_description: 'Required for housing aid (APL/ALS) and other benefits',
        procedure_category: 'administrative',
        provider: 'CAF',
        provider_url: 'https://www.caf.fr',
        steps: [
          { name: 'Create CAF account', completed: false },
          { name: 'Fill personal information', completed: false },
          { name: 'Add housing information', completed: false },
          { name: 'Upload documents', completed: false },
          { name: 'Submit application', completed: false },
        ],
        required_documents: [
          { name: 'Valid ID or residence permit', uploaded: false },
          { name: 'Proof of residence', uploaded: false },
          { name: 'Rental contract', uploaded: false },
          { name: 'RIB (bank details)', uploaded: false },
        ],
        estimatedTime: '1-2 months',
        isRecommended: true,
      },
    ];
  }

  /**
   * Get procedures from knowledge base
   */
  async getKnowledgeBaseProcedures(category, subcategory = null, section = null) {
    try {
      let query = supabaseAdmin
        .from('procedures')
        .select('*')
        .eq('category', category);

      if (subcategory) {
        query = query.eq('subcategory', subcategory);
      }

      if (section) {
        query = query.eq('section', section);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      return (data || []).map(p => this.formatKnowledgeProcedure(p));
    } catch (error) {
      logger.error('Failed to get knowledge base procedures', { category, error: error.message });
      return [];
    }
  }

  /**
   * Format knowledge base procedure for frontend
   */
  formatKnowledgeProcedure(procedure) {
    const data = procedure.procedure_data || {};
    
    return {
      id: procedure.id,
      procedure_id: procedure.procedure_id,
      procedure_name: procedure.procedure_name,
      procedure_description: procedure.procedure_description,
      procedure_category: this.mapSectionToCategory(procedure.section),
      provider: data.provider || data.organizers?.[0]?.name || 'Government',
      provider_url: procedure.source_url || data.url,
      section: procedure.section,
      subsection: procedure.subsection,
      steps: this.extractSteps(data),
      required_documents: this.extractDocuments(data),
      estimatedTime: data.processingTime || data.timeToOpen || 'Varies',
      cost: data.cost || 'Free',
      tips: data.tips || [],
      rawData: data,
    };
  }

  /**
   * Map section to category
   */
  mapSectionToCategory(section) {
    const mapping = {
      'preArrival': 'administrative',
      'arrival': 'administrative',
      'administrative': 'administrative',
      'housing': 'housing',
      'banking': 'banking',
      'health': 'health',
      'employment': 'employment',
      'education': 'education',
      'transport': 'transport',
    };
    return mapping[section] || 'administrative';
  }

  /**
   * Extract steps from procedure data
   */
  extractSteps(data) {
    if (data.howTo && Array.isArray(data.howTo)) {
      return data.howTo.map((step, idx) => ({
        name: step,
        completed: false,
        order: idx,
      }));
    }
    if (data.steps && Array.isArray(data.steps)) {
      return data.steps.map((step, idx) => ({
        name: typeof step === 'string' ? step : step.name || step.description,
        completed: false,
        order: idx,
      }));
    }
    return [];
  }

  /**
   * Extract required documents from procedure data
   */
  extractDocuments(data) {
    if (data.requiredDocuments && Array.isArray(data.requiredDocuments)) {
      return data.requiredDocuments.map(doc => ({
        name: typeof doc === 'string' ? doc : doc.name || doc,
        uploaded: false,
        required: typeof doc === 'object' ? doc.required !== false : true,
      }));
    }
    return [];
  }

  /**
   * Create a new user procedure
   */
  async createProcedure(userId, procedureData) {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_procedures')
        .insert({
          user_id: userId,
          procedure_id: procedureData.procedure_id,
          procedure_name: procedureData.procedure_name,
          procedure_description: procedureData.procedure_description,
          procedure_category: procedureData.procedure_category,
          provider: procedureData.provider,
          provider_url: procedureData.provider_url,
          status: 'not-started',
          progress: 0,
          steps: procedureData.steps || [],
          current_step: 0,
          total_steps: (procedureData.steps || []).length,
          required_documents: procedureData.required_documents || [],
          related_aide_id: procedureData.related_aide_id,
          related_aide_name: procedureData.related_aide_name,
          source: procedureData.source || 'manual',
          simulation_id: procedureData.simulation_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to create procedure', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get procedure by ID
   */
  async getProcedureById(userId, procedureId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_procedures')
        .select('*')
        .eq('id', procedureId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      logger.error('Failed to get procedure', { userId, procedureId, error: error.message });
      return null;
    }
  }

  /**
   * Update procedure
   */
  async updateProcedure(userId, procedureId, updates) {
    try {
      // Calculate progress and status based on steps
      if (updates.steps) {
        const steps = updates.steps;
        const completedSteps = steps.filter(s => s.completed).length;
        const totalSteps = steps.length;
        updates.progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
        updates.current_step = completedSteps;
        updates.total_steps = totalSteps;

        // Auto-update status
        if (updates.progress === 100 && updates.status !== 'completed' && updates.status !== 'pending') {
          updates.status = 'pending';
        } else if (updates.progress > 0 && updates.status === 'not-started') {
          updates.status = 'in-progress';
          updates.started_at = new Date().toISOString();
        }
      }

      // Set completed_at if status is completed
      if (updates.status === 'completed' && !updates.completed_at) {
        updates.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabaseAdmin
        .from('user_procedures')
        .update(updates)
        .eq('id', procedureId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to update procedure', { userId, procedureId, error: error.message });
      return null;
    }
  }

  /**
   * Complete a step
   */
  async completeStep(userId, procedureId, stepIndex, completed = true) {
    try {
      // Get current procedure
      const procedure = await this.getProcedureById(userId, procedureId);
      if (!procedure) return null;

      // Update step
      const steps = [...(procedure.steps || [])];
      if (steps[stepIndex]) {
        steps[stepIndex] = {
          ...steps[stepIndex],
          completed,
          date: completed ? new Date().toISOString() : null,
        };
      }

      // Update procedure with new steps
      return this.updateProcedure(userId, procedureId, { steps });
    } catch (error) {
      logger.error('Failed to complete step', { userId, procedureId, stepIndex, error: error.message });
      return null;
    }
  }

  /**
   * Mark document as uploaded
   */
  async markDocumentUploaded(userId, procedureId, documentIndex, uploaded = true) {
    try {
      // Get current procedure
      const procedure = await this.getProcedureById(userId, procedureId);
      if (!procedure) return null;

      // Update document
      const documents = [...(procedure.required_documents || [])];
      if (documents[documentIndex]) {
        documents[documentIndex] = {
          ...documents[documentIndex],
          uploaded,
          uploadedAt: uploaded ? new Date().toISOString() : null,
        };
      }

      const { data, error } = await supabaseAdmin
        .from('user_procedures')
        .update({ required_documents: documents })
        .eq('id', procedureId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to mark document uploaded', { userId, procedureId, documentIndex, error: error.message });
      return null;
    }
  }

  /**
   * Delete a procedure
   */
  async deleteProcedure(userId, procedureId) {
    try {
      const { error } = await supabaseAdmin
        .from('user_procedures')
        .delete()
        .eq('id', procedureId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Failed to delete procedure', { userId, procedureId, error: error.message });
      return false;
    }
  }
}

export const proceduresService = new ProceduresService();
export default proceduresService;
