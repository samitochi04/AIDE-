/**
 * PDF Export Service
 * Generates PDF exports of user data in background
 */

import PDFDocument from 'pdfkit';
import { supabaseAdmin } from '../config/supabase.js';
import { emailService } from './email.service.js';
import logger from '../utils/logger.js';

class PDFExportService {
  constructor() {
    this.processingExports = new Map();
  }

  /**
   * Request a data export (runs in background)
   */
  async requestExport(userId, requestedFrom = 'settings') {
    try {
      // Create export record
      const { data: exportRecord, error: createError } = await supabaseAdmin
        .from('data_exports')
        .insert({
          user_id: userId,
          export_type: 'full',
          status: 'pending',
          requested_from: requestedFrom,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Start background processing
      this.processExportInBackground(exportRecord.id, userId);

      return exportRecord;
    } catch (error) {
      logger.error('Failed to request export', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Process export in background
   */
  async processExportInBackground(exportId, userId) {
    // Don't await - let it run in background
    setImmediate(async () => {
      try {
        logger.info('Starting background PDF export', { exportId, userId });

        // Update status to processing
        await supabaseAdmin
          .from('data_exports')
          .update({ status: 'processing', started_at: new Date().toISOString() })
          .eq('id', exportId);

        // Gather all user data
        const userData = await this.gatherUserData(userId);

        // Generate PDF
        const pdfBuffer = await this.generatePDF(userData);

        // Upload to storage
        const { filePath, fileUrl } = await this.uploadPDF(userId, exportId, pdfBuffer);

        // Calculate expiration (7 days)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Update export record with success
        await supabaseAdmin
          .from('data_exports')
          .update({
            status: 'completed',
            file_path: filePath,
            file_url: fileUrl,
            file_size: pdfBuffer.length,
            completed_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
          })
          .eq('id', exportId);

        // Send email notification
        await emailService.sendDataExportReady({
          userId,
          email: userData.profile.email,
          name: userData.profile.full_name || 'Utilisateur',
          downloadUrl: fileUrl,
          expiresAt: expiresAt.toISOString(),
        });

        logger.info('PDF export completed successfully', { exportId, userId });

      } catch (error) {
        logger.error('PDF export failed', { exportId, userId, error: error.message });

        // Update export record with error
        await supabaseAdmin
          .from('data_exports')
          .update({
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString(),
          })
          .eq('id', exportId);
      }
    });
  }

  /**
   * Gather all user data for export
   */
  async gatherUserData(userId) {
    const [
      profileResult,
      simulationsResult,
      savedAidesResult,
      proceduresResult,
      conversationsResult,
      subscriptionResult,
      emailLogsResult,
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('id', userId).single(),
      supabaseAdmin.from('simulations').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabaseAdmin.from('saved_aides').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabaseAdmin.from('user_procedures').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabaseAdmin.from('chat_conversations').select('*, chat_messages(*)').eq('user_id', userId).order('created_at', { ascending: false }),
      supabaseAdmin.from('stripe_subscriptions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabaseAdmin.from('email_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
    ]);

    return {
      profile: profileResult.data || {},
      simulations: simulationsResult.data || [],
      savedAides: savedAidesResult.data || [],
      procedures: proceduresResult.data || [],
      conversations: conversationsResult.data || [],
      subscription: subscriptionResult.data?.[0] || null,
      emailLogs: emailLogsResult.data || [],
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate PDF from user data
   */
  async generatePDF(userData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          bufferPages: true,
          info: {
            Title: `AIDE+ - Export de données - ${userData.profile.full_name || 'Utilisateur'}`,
            Author: 'AIDE+',
            Subject: 'Export de données personnelles',
            Creator: 'AIDE+ Platform',
          },
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Colors
        const primaryColor = '#3B82F6';
        const textColor = '#1F2937';
        const mutedColor = '#6B7280';
        const borderColor = '#E5E7EB';

        // Helper functions
        const addHeader = () => {
          // Logo placeholder (text-based for now)
          doc.fontSize(28)
            .fillColor(primaryColor)
            .font('Helvetica-Bold')
            .text('AIDE+', 50, 50);
          
          doc.fontSize(10)
            .fillColor(mutedColor)
            .font('Helvetica')
            .text('Votre assistant pour les aides en France', 50, 82);
          
          doc.moveTo(50, 110)
            .lineTo(545, 110)
            .strokeColor(borderColor)
            .stroke();
          
          return 130;
        };

        const addPageNumber = (pageNum) => {
          doc.fontSize(9)
            .fillColor(mutedColor)
            .text(
              `Page ${pageNum}`,
              0,
              doc.page.height - 40,
              { align: 'center' }
            );
        };

        const addSectionTitle = (title, y) => {
          doc.fontSize(16)
            .fillColor(primaryColor)
            .font('Helvetica-Bold')
            .text(title, 50, y);
          
          doc.moveTo(50, y + 22)
            .lineTo(545, y + 22)
            .strokeColor(primaryColor)
            .lineWidth(1)
            .stroke();
          
          return y + 35;
        };

        const addSubSection = (title, y) => {
          doc.fontSize(12)
            .fillColor(textColor)
            .font('Helvetica-Bold')
            .text(title, 50, y);
          return y + 20;
        };

        const addKeyValue = (key, value, y) => {
          doc.fontSize(10)
            .fillColor(mutedColor)
            .font('Helvetica')
            .text(key + ':', 50, y);
          
          doc.fontSize(10)
            .fillColor(textColor)
            .font('Helvetica')
            .text(String(value || 'Non renseigné'), 200, y);
          
          return y + 18;
        };

        const checkNewPage = (y, minSpace = 100) => {
          if (y > doc.page.height - minSpace) {
            doc.addPage();
            addPageNumber(doc.bufferedPageRange().count);
            return 50;
          }
          return y;
        };

        // ====================
        // Page 1: Cover & Table of Contents
        // ====================
        let y = addHeader();

        // Title
        doc.fontSize(24)
          .fillColor(textColor)
          .font('Helvetica-Bold')
          .text('Export de Données Personnelles', 50, y + 30, { align: 'center' });

        doc.fontSize(12)
          .fillColor(mutedColor)
          .font('Helvetica')
          .text(`Généré le ${new Date().toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}`, 50, y + 65, { align: 'center' });

        y = y + 120;

        // User info box
        doc.rect(50, y, 495, 80)
          .fillColor('#F3F4F6')
          .fill();

        doc.fontSize(14)
          .fillColor(textColor)
          .font('Helvetica-Bold')
          .text(userData.profile.full_name || 'Utilisateur AIDE+', 70, y + 15);

        doc.fontSize(10)
          .fillColor(mutedColor)
          .font('Helvetica')
          .text(userData.profile.email, 70, y + 35);

        doc.text(`Membre depuis le ${new Date(userData.profile.created_at).toLocaleDateString('fr-FR')}`, 70, y + 50);

        y = y + 110;

        // Table of Contents
        y = addSectionTitle('Table des Matières', y);

        const toc = [
          { num: '1', title: 'Informations Personnelles', page: 2 },
          { num: '2', title: 'Simulations d\'Aides', page: 2 },
          { num: '3', title: 'Aides Sauvegardées', page: 3 },
          { num: '4', title: 'Démarches Administratives', page: 3 },
          { num: '5', title: 'Conversations IA', page: 4 },
          { num: '6', title: 'Abonnement', page: 4 },
          { num: '7', title: 'Historique des Emails', page: 5 },
        ];

        toc.forEach(item => {
          doc.fontSize(11)
            .fillColor(textColor)
            .font('Helvetica')
            .text(`${item.num}. ${item.title}`, 70, y);
          
          doc.text(`Page ${item.page}`, 480, y, { align: 'right' });
          y += 22;
        });

        addPageNumber(1);

        // ====================
        // Page 2: Personal Information & Simulations
        // ====================
        doc.addPage();
        y = addHeader();
        addPageNumber(2);

        y = addSectionTitle('1. Informations Personnelles', y);
        
        y = addSubSection('Identité', y);
        y = addKeyValue('Nom complet', userData.profile.full_name, y);
        y = addKeyValue('Email', userData.profile.email, y);
        y = addKeyValue('Téléphone', userData.profile.phone, y);
        y = addKeyValue('Date de naissance', userData.profile.date_of_birth ? new Date(userData.profile.date_of_birth).toLocaleDateString('fr-FR') : null, y);
        
        y += 10;
        y = addSubSection('Situation', y);
        y = addKeyValue('Statut', userData.profile.status, y);
        y = addKeyValue('Nationalité', userData.profile.nationality, y);
        y = addKeyValue('Pays d\'origine', userData.profile.country_of_origin, y);
        
        y += 10;
        y = addSubSection('Adresse', y);
        y = addKeyValue('Région', userData.profile.region, y);
        y = addKeyValue('Département', userData.profile.department, y);
        y = addKeyValue('Ville', userData.profile.city, y);
        y = addKeyValue('Code postal', userData.profile.postal_code, y);

        y += 20;
        y = checkNewPage(y, 150);

        // Simulations
        y = addSectionTitle('2. Simulations d\'Aides', y);

        if (userData.simulations.length === 0) {
          doc.fontSize(10)
            .fillColor(mutedColor)
            .text('Aucune simulation effectuée.', 50, y);
          y += 25;
        } else {
          doc.fontSize(10)
            .fillColor(textColor)
            .text(`Total: ${userData.simulations.length} simulation(s)`, 50, y);
          y += 20;

          userData.simulations.slice(0, 5).forEach((sim, index) => {
            y = checkNewPage(y, 80);
            
            doc.rect(50, y, 495, 60)
              .fillColor(index % 2 === 0 ? '#F9FAFB' : 'white')
              .fill();

            doc.fontSize(11)
              .fillColor(textColor)
              .font('Helvetica-Bold')
              .text(`Simulation #${index + 1}`, 60, y + 10);

            doc.fontSize(9)
              .fillColor(mutedColor)
              .font('Helvetica')
              .text(`Date: ${new Date(sim.created_at).toLocaleDateString('fr-FR')}`, 60, y + 28);

            doc.text(`Aides éligibles: ${sim.eligible_aides_count || 0}`, 200, y + 28);
            doc.text(`Montant total: ${sim.total_monthly || 0}€/mois`, 350, y + 28);

            y += 70;
          });

          if (userData.simulations.length > 5) {
            doc.fontSize(9)
              .fillColor(mutedColor)
              .text(`... et ${userData.simulations.length - 5} autre(s) simulation(s)`, 50, y);
            y += 20;
          }
        }

        // ====================
        // Page 3: Saved Aides & Procedures
        // ====================
        doc.addPage();
        y = addHeader();
        addPageNumber(3);

        y = addSectionTitle('3. Aides Sauvegardées', y);

        if (userData.savedAides.length === 0) {
          doc.fontSize(10)
            .fillColor(mutedColor)
            .text('Aucune aide sauvegardée.', 50, y);
          y += 25;
        } else {
          doc.fontSize(10)
            .fillColor(textColor)
            .text(`Total: ${userData.savedAides.length} aide(s) sauvegardée(s)`, 50, y);
          y += 20;

          userData.savedAides.slice(0, 8).forEach((aide, index) => {
            y = checkNewPage(y, 40);
            
            doc.fontSize(10)
              .fillColor(textColor)
              .text(`• ${aide.aide_name || 'Aide sans nom'}`, 60, y);
            
            doc.fontSize(9)
              .fillColor(mutedColor)
              .text(`Statut: ${aide.status || 'Non défini'} | Sauvegardé le ${new Date(aide.created_at).toLocaleDateString('fr-FR')}`, 75, y + 14);
            
            y += 35;
          });
        }

        y += 20;
        y = checkNewPage(y, 150);

        y = addSectionTitle('4. Démarches Administratives', y);

        if (userData.procedures.length === 0) {
          doc.fontSize(10)
            .fillColor(mutedColor)
            .text('Aucune démarche enregistrée.', 50, y);
          y += 25;
        } else {
          doc.fontSize(10)
            .fillColor(textColor)
            .text(`Total: ${userData.procedures.length} démarche(s)`, 50, y);
          y += 20;

          userData.procedures.slice(0, 6).forEach((proc, index) => {
            y = checkNewPage(y, 50);
            
            doc.rect(50, y, 495, 45)
              .fillColor(index % 2 === 0 ? '#F9FAFB' : 'white')
              .fill();

            doc.fontSize(10)
              .fillColor(textColor)
              .font('Helvetica-Bold')
              .text(proc.name || 'Démarche sans nom', 60, y + 8);

            doc.fontSize(9)
              .fillColor(mutedColor)
              .font('Helvetica')
              .text(`Type: ${proc.type || 'Non défini'} | Statut: ${proc.status || 'Non défini'}`, 60, y + 24);

            y += 55;
          });
        }

        // ====================
        // Page 4: Conversations & Subscription
        // ====================
        doc.addPage();
        y = addHeader();
        addPageNumber(4);

        y = addSectionTitle('5. Conversations IA', y);

        if (userData.conversations.length === 0) {
          doc.fontSize(10)
            .fillColor(mutedColor)
            .text('Aucune conversation avec l\'assistant IA.', 50, y);
          y += 25;
        } else {
          doc.fontSize(10)
            .fillColor(textColor)
            .text(`Total: ${userData.conversations.length} conversation(s)`, 50, y);
          y += 15;

          const totalMessages = userData.conversations.reduce((sum, conv) => 
            sum + (conv.chat_messages?.length || 0), 0);
          
          doc.text(`Total messages: ${totalMessages}`, 50, y);
          y += 25;

          userData.conversations.slice(0, 5).forEach((conv, index) => {
            y = checkNewPage(y, 40);
            
            doc.fontSize(10)
              .fillColor(textColor)
              .text(`• Conversation #${index + 1}`, 60, y);
            
            doc.fontSize(9)
              .fillColor(mutedColor)
              .text(`${conv.chat_messages?.length || 0} message(s) | ${new Date(conv.created_at).toLocaleDateString('fr-FR')}`, 75, y + 14);
            
            y += 35;
          });
        }

        y += 20;
        y = checkNewPage(y, 150);

        y = addSectionTitle('6. Abonnement', y);

        if (!userData.subscription) {
          doc.fontSize(10)
            .fillColor(mutedColor)
            .text('Forfait gratuit (Free)', 50, y);
          y += 15;
          doc.text('Aucun abonnement payant actif.', 50, y);
          y += 25;
        } else {
          y = addKeyValue('Forfait', userData.subscription.tier || 'Free', y);
          y = addKeyValue('Statut', userData.subscription.status, y);
          y = addKeyValue('Période actuelle', userData.subscription.current_period_end ? 
            `Jusqu'au ${new Date(userData.subscription.current_period_end).toLocaleDateString('fr-FR')}` : 'N/A', y);
        }

        // ====================
        // Page 5: Email History
        // ====================
        doc.addPage();
        y = addHeader();
        addPageNumber(5);

        y = addSectionTitle('7. Historique des Emails', y);

        if (userData.emailLogs.length === 0) {
          doc.fontSize(10)
            .fillColor(mutedColor)
            .text('Aucun email envoyé.', 50, y);
        } else {
          doc.fontSize(10)
            .fillColor(textColor)
            .text(`Total: ${userData.emailLogs.length} email(s) (100 derniers affichés)`, 50, y);
          y += 25;

          userData.emailLogs.slice(0, 15).forEach((log, index) => {
            y = checkNewPage(y, 35);
            
            doc.fontSize(9)
              .fillColor(textColor)
              .text(`${new Date(log.created_at).toLocaleDateString('fr-FR')}`, 50, y);
            
            doc.text(log.subject?.substring(0, 50) + (log.subject?.length > 50 ? '...' : ''), 130, y);
            doc.fillColor(log.status === 'sent' ? '#10B981' : mutedColor)
              .text(log.status, 480, y);
            
            y += 18;
          });
        }

        // ====================
        // Final Page: Footer
        // ====================
        y = checkNewPage(y, 100);
        y += 30;

        doc.moveTo(50, y)
          .lineTo(545, y)
          .strokeColor(borderColor)
          .stroke();

        y += 20;

        doc.fontSize(10)
          .fillColor(mutedColor)
          .font('Helvetica')
          .text('Ce document contient toutes vos données personnelles stockées par AIDE+.', 50, y, { align: 'center' });
        
        y += 15;
        doc.text('Conformément au RGPD, vous pouvez demander la modification ou la suppression de ces données.', 50, y, { align: 'center' });
        
        y += 20;
        doc.fontSize(9)
          .text('© 2025 AIDE+ - Tous droits réservés', 50, y, { align: 'center' });

        // Finalize PDF
        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Upload PDF to Supabase storage
   */
  async uploadPDF(userId, exportId, pdfBuffer) {
    const fileName = `${userId}/${exportId}.pdf`;
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'exports';
    
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) throw error;

    // Get signed URL (valid for 7 days)
    const { data: urlData } = await supabaseAdmin.storage
      .from(bucketName)
      .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days

    return {
      filePath: fileName,
      fileUrl: urlData?.signedUrl || '',
    };
  }

  /**
   * Get export status
   */
  async getExportStatus(exportId, userId) {
    const { data, error } = await supabaseAdmin
      .from('data_exports')
      .select('*')
      .eq('id', exportId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get user's export history
   */
  async getExportHistory(userId) {
    const { data, error } = await supabaseAdmin
      .from('data_exports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  }
}

export const pdfExportService = new PDFExportService();
export default pdfExportService;
