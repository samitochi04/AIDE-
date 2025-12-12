import { transporter, emailConfig } from '../config/email.js';
import { emailTemplateRepository, emailLogRepository } from '../repositories/index.js';
import { userRepository } from '../repositories/index.js';
import logger from '../utils/logger.js';
import { APP_CONFIG } from '../config/index.js';

/**
 * Base email wrapper function for consistent styling
 */
const wrapEmailContent = (content) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
    <div style="background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0; font-size: 28px;">AIDE+</h1>
        <p style="color: #64748b; margin: 5px 0 0;">Votre assistant administratif</p>
      </div>
      ${content}
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
        © ${new Date().getFullYear()} AIDE+ - Tous droits réservés<br>
        <a href="${APP_CONFIG.frontendUrl}/unsubscribe" style="color: #94a3b8;">Se désabonner des emails</a>
      </p>
    </div>
  </body>
</html>
`;

const buttonStyle = 'background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;';
const secondaryButtonStyle = 'background-color: #f1f5f9; color: #475569; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;';
const cardStyle = 'background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;';
const warningCardStyle = 'background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;';
const successCardStyle = 'background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;';

/**
 * Email templates
 */
const templates = {
  // ========================================
  // AUTHENTICATION EMAILS
  // ========================================
  
  welcome: (data) => ({
    subject: 'Bienvenue sur AIDE+ ! 🎉',
    html: wrapEmailContent(`
      <h2 style="color: #1e293b; margin-top: 0;">Bienvenue ${data.name || ''} ! 👋</h2>
      
      <p>Merci de vous être inscrit sur AIDE+, votre assistant pour naviguer dans les aides et démarches administratives en France.</p>
      
      <p>Avec AIDE+, vous pouvez :</p>
      <ul style="padding-left: 20px;">
        <li>🔍 Découvrir les aides auxquelles vous avez droit</li>
        <li>📋 Suivre vos démarches administratives</li>
        <li>🤖 Poser vos questions à notre assistant IA</li>
        <li>📚 Accéder à des guides personnalisés</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_CONFIG.frontendUrl}/dashboard" style="${buttonStyle}">
          Commencer maintenant
        </a>
      </div>
      
      <p style="color: #64748b; font-size: 14px;">
        💡 <strong>Conseil :</strong> Commencez par faire une simulation pour découvrir les aides auxquelles vous avez droit !
      </p>
    `),
  }),

  magicLink: (data) => ({
    subject: 'Votre lien de connexion AIDE+',
    html: wrapEmailContent(`
      <h2 style="color: #1e293b; margin-top: 0;">Connexion à votre compte 🔐</h2>
      
      <p>Cliquez sur le bouton ci-dessous pour vous connecter à votre compte AIDE+ :</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.link}" style="${buttonStyle}">
          Se connecter
        </a>
      </div>
      
      <div style="${warningCardStyle}">
        <p style="margin: 0; font-size: 14px;">
          ⚠️ Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas demandé ce lien, vous pouvez ignorer cet email.
        </p>
      </div>
    `),
  }),

  passwordReset: (data) => ({
    subject: 'Réinitialisation de votre mot de passe AIDE+',
    html: wrapEmailContent(`
      <h2 style="color: #1e293b; margin-top: 0;">Réinitialisation du mot de passe 🔑</h2>
      
      <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.link}" style="${buttonStyle}">
          Réinitialiser le mot de passe
        </a>
      </div>
      
      <div style="${warningCardStyle}">
        <p style="margin: 0; font-size: 14px;">
          ⚠️ Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas fait cette demande, ignorez cet email.
        </p>
      </div>
    `),
  }),

  // ========================================
  // SUBSCRIPTION EMAILS
  // ========================================
  
  subscriptionWelcome: (data) => ({
    subject: `Bienvenue dans AIDE+ ${data.planName} ! 🎉`,
    html: wrapEmailContent(`
      <h2 style="color: #1e293b; margin-top: 0;">Votre abonnement est actif ! 🎉</h2>
      
      <p>Merci d'avoir souscrit à <strong>AIDE+ ${data.planName}</strong>.</p>
      
      <div style="${successCardStyle}">
        <h3 style="margin-top: 0; color: #166534;">Détails de votre abonnement</h3>
        <p style="margin: 5px 0;"><strong>Plan :</strong> ${data.planName}</p>
        <p style="margin: 5px 0;"><strong>Prix :</strong> ${data.price}€/mois</p>
        <p style="margin: 5px 0;"><strong>Prochaine facturation :</strong> ${data.nextBillingDate}</p>
      </div>
      
      <p>Vous avez maintenant accès à :</p>
      <ul style="padding-left: 20px;">
        ${(data.features || []).map(f => `<li>✅ ${f}</li>`).join('')}
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_CONFIG.frontendUrl}/dashboard" style="${buttonStyle}">
          Accéder à mon compte
        </a>
      </div>
    `),
  }),

  subscriptionConfirmation: (data) => ({
    subject: `Confirmation de paiement - AIDE+ ${data.planName}`,
    html: wrapEmailContent(`
      <h2 style="color: #1e293b; margin-top: 0;">Paiement reçu ✅</h2>
      
      <p>Votre paiement pour AIDE+ ${data.planName} a été traité avec succès.</p>
      
      <div style="${cardStyle}">
        <h3 style="margin-top: 0;">Détails du paiement</h3>
        <p style="margin: 5px 0;"><strong>Montant :</strong> ${data.price}€</p>
        <p style="margin: 5px 0;"><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
        <p style="margin: 5px 0;"><strong>Prochaine facturation :</strong> ${data.nextBillingDate}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_CONFIG.frontendUrl}/dashboard/subscription" style="${secondaryButtonStyle}">
          Gérer mon abonnement
        </a>
      </div>
    `),
  }),

  subscriptionCancelled: (data) => ({
    subject: 'Confirmation d\'annulation - AIDE+',
    html: wrapEmailContent(`
      <h2 style="color: #1e293b; margin-top: 0;">Abonnement annulé 😢</h2>
      
      <p>Nous confirmons l'annulation de votre abonnement AIDE+ ${data.planName}.</p>
      
      <div style="${warningCardStyle}">
        <p style="margin: 0;">
          📅 Vous conservez l'accès à toutes les fonctionnalités jusqu'au <strong>${data.endDate}</strong>.
        </p>
      </div>
      
      <p>Nous sommes désolés de vous voir partir. Si vous avez des suggestions pour améliorer notre service, n'hésitez pas à nous contacter.</p>
      
      <p>Vous pouvez vous réabonner à tout moment :</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_CONFIG.frontendUrl}/pricing" style="${buttonStyle}">
          Voir les offres
        </a>
      </div>
    `),
  }),

  paymentFailed: (data) => ({
    subject: '⚠️ Échec de paiement - AIDE+',
    html: wrapEmailContent(`
      <h2 style="color: #dc2626; margin-top: 0;">Problème de paiement ⚠️</h2>
      
      <p>Nous n'avons pas pu traiter votre paiement pour AIDE+ ${data.planName}.</p>
      
      <div style="${warningCardStyle}">
        <p style="margin: 0;">
          <strong>Raison :</strong> ${data.reason || 'Carte refusée'}<br>
          <strong>Prochaine tentative :</strong> ${data.retryDate || 'Dans 3 jours'}
        </p>
      </div>
      
      <p>Pour éviter l'interruption de votre service, veuillez mettre à jour vos informations de paiement :</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_CONFIG.frontendUrl}/dashboard/subscription" style="${buttonStyle}">
          Mettre à jour ma carte
        </a>
      </div>
    `),
  }),

  // ========================================
  // ADMIN NOTIFICATION EMAILS
  // ========================================
  
  adminNewSubscription: (data) => ({
    subject: `🎉 Nouvel abonnement - ${data.planName}`,
    html: wrapEmailContent(`
      <h2 style="color: #1e293b; margin-top: 0;">Nouvel abonnement ! 🎉</h2>
      
      <div style="${successCardStyle}">
        <p style="margin: 5px 0;"><strong>Utilisateur :</strong> ${data.userName}</p>
        <p style="margin: 5px 0;"><strong>Email :</strong> ${data.userEmail}</p>
        <p style="margin: 5px 0;"><strong>Plan :</strong> ${data.planName}</p>
        <p style="margin: 5px 0;"><strong>Prix :</strong> ${data.price}€/mois</p>
        <p style="margin: 5px 0;"><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_CONFIG.frontendUrl}/admin/users" style="${buttonStyle}">
          Voir dans l'admin
        </a>
      </div>
    `),
  }),

  adminNewUser: (data) => ({
    subject: `👤 Nouvel utilisateur inscrit`,
    html: wrapEmailContent(`
      <h2 style="color: #1e293b; margin-top: 0;">Nouvel utilisateur ! 👤</h2>
      
      <div style="${cardStyle}">
        <p style="margin: 5px 0;"><strong>Nom :</strong> ${data.name || 'Non renseigné'}</p>
        <p style="margin: 5px 0;"><strong>Email :</strong> ${data.email}</p>
        <p style="margin: 5px 0;"><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
        <p style="margin: 5px 0;"><strong>Source :</strong> ${data.source || 'Direct'}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_CONFIG.frontendUrl}/admin/users" style="${buttonStyle}">
          Voir dans l'admin
        </a>
      </div>
    `),
  }),

  // ========================================
  // PLATFORM UPDATE EMAILS
  // ========================================
  
  platformUpdate: (data) => ({
    subject: `📢 ${data.title}`,
    html: wrapEmailContent(`
      <h2 style="color: #1e293b; margin-top: 0;">${data.title} 📢</h2>
      
      <div style="${cardStyle}">
        ${data.content}
      </div>
      
      ${data.ctaText && data.ctaUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.ctaUrl}" style="${buttonStyle}">
            ${data.ctaText}
          </a>
        </div>
      ` : ''}
      
      <p style="color: #64748b; font-size: 14px;">
        L'équipe AIDE+
      </p>
    `),
  }),

  // ========================================
  // AIDES & SIMULATION EMAILS
  // ========================================
  
  newAidesAvailable: (data) => ({
    subject: `🆕 ${data.aides.length} nouvelle(s) aide(s) pour vous !`,
    html: wrapEmailContent(`
      <h2 style="color: #1e293b; margin-top: 0;">Nouvelles aides disponibles ! 🆕</h2>
      
      <p>Bonne nouvelle ! De nouvelles aides correspondent à votre profil :</p>
      
      ${data.aides.map(aide => `
        <div style="${successCardStyle}">
          <h3 style="margin-top: 0; color: #166534;">${aide.name}</h3>
          <p style="margin: 5px 0;">${aide.description}</p>
          ${aide.amount ? `<p style="margin: 5px 0;"><strong>Montant estimé :</strong> ${aide.amount}€</p>` : ''}
        </div>
      `).join('')}
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_CONFIG.frontendUrl}/dashboard/aides" style="${buttonStyle}">
          Voir mes aides
        </a>
      </div>
    `),
  }),

  aidesUpdate: (data) => ({
    subject: `📝 Mise à jour de l'aide : ${data.aideName}`,
    html: wrapEmailContent(`
      <h2 style="color: #1e293b; margin-top: 0;">Mise à jour importante 📝</h2>
      
      <p>L'aide <strong>${data.aideName}</strong> que vous suivez a été mise à jour.</p>
      
      <div style="${cardStyle}">
        <h3 style="margin-top: 0;">Ce qui a changé :</h3>
        <p>${data.changes}</p>
      </div>
      
      ${data.actionRequired ? `
        <div style="${warningCardStyle}">
          <p style="margin: 0;">
            ⚠️ <strong>Action requise :</strong> ${data.actionRequired}
          </p>
        </div>
      ` : ''}
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_CONFIG.frontendUrl}/dashboard/aides/${data.aideId}" style="${buttonStyle}">
          Voir les détails
        </a>
      </div>
    `),
  }),

  simulationResults: (data) => ({
    subject: `🎯 Vos résultats de simulation AIDE+`,
    html: wrapEmailContent(`
      <h2 style="color: #1e293b; margin-top: 0;">Résultats de votre simulation 🎯</h2>
      
      <p>Voici un récapitulatif des aides auxquelles vous pourriez avoir droit :</p>
      
      <div style="${successCardStyle}">
        <h3 style="margin-top: 0; color: #166534;">💰 Montant total estimé : ${data.totalAmount}€/an</h3>
        <p style="margin: 0;">${data.aidesCount} aide(s) identifiée(s)</p>
      </div>
      
      ${data.topAides.map(aide => `
        <div style="${cardStyle}">
          <h4 style="margin-top: 0;">${aide.name}</h4>
          <p style="margin: 5px 0;">${aide.description}</p>
          ${aide.amount ? `<p style="margin: 5px 0;"><strong>Montant :</strong> ${aide.amount}€</p>` : ''}
        </div>
      `).join('')}
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_CONFIG.frontendUrl}/dashboard/simulation/${data.simulationId}" style="${buttonStyle}">
          Voir tous les résultats
        </a>
      </div>
    `),
  }),

  // ========================================
  // PROCEDURE REMINDER EMAILS
  // ========================================
  
  procedureReminder: (data) => ({
    subject: `⏰ Rappel : ${data.proceduresCount} démarche(s) en cours`,
    html: wrapEmailContent(`
      <h2 style="color: #1e293b; margin-top: 0;">Rappel de vos démarches ⏰</h2>
      
      <p>Vous avez <strong>${data.proceduresCount} démarche(s)</strong> en cours. N'oubliez pas de les compléter !</p>
      
      ${data.procedures.map(proc => `
        <div style="${cardStyle}">
          <h4 style="margin-top: 0;">${proc.name}</h4>
          <p style="margin: 5px 0;"><strong>Statut :</strong> ${proc.status}</p>
          <p style="margin: 5px 0;"><strong>Prochaine étape :</strong> ${proc.nextStep || 'Continuer la démarche'}</p>
          ${proc.deadline ? `<p style="margin: 5px 0; color: #dc2626;"><strong>Échéance :</strong> ${proc.deadline}</p>` : ''}
        </div>
      `).join('')}
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_CONFIG.frontendUrl}/dashboard/procedures" style="${buttonStyle}">
          Voir mes démarches
        </a>
      </div>
    `),
  }),

  procedureDeadline: (data) => ({
    subject: `🚨 Échéance proche : ${data.procedureName}`,
    html: wrapEmailContent(`
      <h2 style="color: #dc2626; margin-top: 0;">Échéance imminente ! 🚨</h2>
      
      <div style="${warningCardStyle}">
        <h3 style="margin-top: 0;">${data.procedureName}</h3>
        <p style="margin: 5px 0;"><strong>Date limite :</strong> ${data.deadline}</p>
        <p style="margin: 5px 0;"><strong>Jours restants :</strong> ${data.daysLeft} jour(s)</p>
      </div>
      
      <p>Ne perdez pas cette opportunité ! Complétez votre démarche avant la date limite.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_CONFIG.frontendUrl}/dashboard/procedures/${data.procedureId}" style="${buttonStyle}">
          Compléter maintenant
        </a>
      </div>
    `),
  }),

  // ========================================
  // AFFILIATE EMAILS
  // ========================================
  
  affiliateWelcome: (data) => ({
    subject: 'Bienvenue dans le programme d\'affiliation AIDE+ ! 🤝',
    html: wrapEmailContent(`
      <h2 style="color: #1e293b; margin-top: 0;">Bienvenue parmi nos affiliés ! 🤝</h2>
      
      <p>Votre demande d'affiliation a été approuvée. Vous pouvez maintenant commencer à gagner des commissions !</p>
      
      <div style="${successCardStyle}">
        <h3 style="margin-top: 0; color: #166534;">Votre lien d'affiliation</h3>
        <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px; font-family: monospace;">
          ${data.affiliateLink}
        </p>
      </div>
      
      <div style="${cardStyle}">
        <h3 style="margin-top: 0;">Comment ça marche ?</h3>
        <ul style="padding-left: 20px; margin: 10px 0;">
          <li>Partagez votre lien unique</li>
          <li>Gagnez <strong>${data.commissionRate}%</strong> sur chaque abonnement</li>
          <li>Recevez vos paiements mensuellement</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_CONFIG.frontendUrl}/dashboard/affiliate" style="${buttonStyle}">
          Accéder à mon espace affilié
        </a>
      </div>
    `),
  }),

  affiliateNewReferral: (data) => ({
    subject: `🎉 Nouvelle conversion ! +${data.commission}€`,
    html: wrapEmailContent(`
      <h2 style="color: #1e293b; margin-top: 0;">Félicitations ! 🎉</h2>
      
      <p>Un utilisateur s'est abonné grâce à votre lien d'affiliation !</p>
      
      <div style="${successCardStyle}">
        <h3 style="margin-top: 0; color: #166534;">Commission gagnée</h3>
        <p style="font-size: 32px; font-weight: bold; margin: 10px 0;">+${data.commission}€</p>
        <p style="margin: 0; color: #166534;">Plan ${data.planName}</p>
      </div>
      
      <div style="${cardStyle}">
        <p style="margin: 5px 0;"><strong>Total du mois :</strong> ${data.monthlyTotal}€</p>
        <p style="margin: 5px 0;"><strong>Total des conversions :</strong> ${data.totalReferrals}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_CONFIG.frontendUrl}/dashboard/affiliate" style="${buttonStyle}">
          Voir mes statistiques
        </a>
      </div>
    `),
  }),

  affiliatePayout: (data) => ({
    subject: `💸 Paiement de ${data.amount}€ envoyé !`,
    html: wrapEmailContent(`
      <h2 style="color: #1e293b; margin-top: 0;">Paiement envoyé ! 💸</h2>
      
      <p>Votre paiement d'affiliation a été effectué.</p>
      
      <div style="${successCardStyle}">
        <h3 style="margin-top: 0; color: #166534;">Montant</h3>
        <p style="font-size: 32px; font-weight: bold; margin: 10px 0;">${data.amount}€</p>
        <p style="margin: 0;">Envoyé le ${new Date().toLocaleDateString('fr-FR')}</p>
      </div>
      
      <div style="${cardStyle}">
        <p style="margin: 5px 0;"><strong>Méthode :</strong> ${data.paymentMethod}</p>
        <p style="margin: 5px 0;"><strong>Référence :</strong> ${data.reference}</p>
      </div>
      
      <p style="color: #64748b; font-size: 14px;">
        Le virement devrait apparaître sur votre compte sous 2-3 jours ouvrés.
      </p>
    `),
  }),

  affiliatePayoutPending: (data) => ({
    subject: `📋 Paiement de ${data.amount}€ en cours de traitement`,
    html: wrapEmailContent(`
      <h2 style="color: #1e293b; margin-top: 0;">Paiement en attente 📋</h2>
      
      <p>Votre demande de paiement est en cours de traitement.</p>
      
      <div style="${cardStyle}">
        <p style="margin: 5px 0;"><strong>Montant :</strong> ${data.amount}€</p>
        <p style="margin: 5px 0;"><strong>Date de demande :</strong> ${data.requestDate}</p>
        <p style="margin: 5px 0;"><strong>Délai estimé :</strong> 5-7 jours ouvrés</p>
      </div>
      
      <p style="color: #64748b; font-size: 14px;">
        Vous recevrez un email de confirmation une fois le paiement effectué.
      </p>
    `),
  }),

  // ========================================
  // CONTACT & SUPPORT EMAILS
  // ========================================
  
  contactConfirmation: (data) => ({
    subject: 'Nous avons bien reçu votre message - AIDE+',
    html: wrapEmailContent(`
      <h2 style="color: #1e293b; margin-top: 0;">Message reçu ! 📬</h2>
      
      <p>Bonjour ${data.name},</p>
      
      <p>Nous avons bien reçu votre message et nous vous répondrons dans les plus brefs délais (généralement sous 24-48h).</p>
      
      <div style="${cardStyle}">
        <p style="margin: 5px 0;"><strong>Sujet :</strong> ${data.subject}</p>
        <p style="margin: 5px 0;"><strong>Message :</strong></p>
        <p style="white-space: pre-wrap; background: white; padding: 10px; border-radius: 4px;">${data.message}</p>
      </div>
      
      <p>Merci de votre confiance,<br>L'équipe AIDE+</p>
    `),
  }),

  supportNotification: (data) => ({
    subject: `[Support AIDE+] ${data.category}: ${data.subject}`,
    html: wrapEmailContent(`
      <h2 style="color: #1e293b; margin-top: 0;">Nouveau message de support 📩</h2>
      
      <div style="${cardStyle}">
        <p style="margin: 5px 0;"><strong>De :</strong> ${data.name} (${data.email})</p>
        <p style="margin: 5px 0;"><strong>Catégorie :</strong> ${data.category}</p>
        <p style="margin: 5px 0;"><strong>Sujet :</strong> ${data.subject}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;">
        <p style="margin: 5px 0;"><strong>Message :</strong></p>
        <p style="white-space: pre-wrap;">${data.message}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_CONFIG.frontendUrl}/admin/support" style="${buttonStyle}">
          Répondre dans l'admin
        </a>
      </div>
    `),
  }),

  // ========================================
  // WEEKLY DIGEST
  // ========================================
  
  weeklyDigest: (data) => ({
    subject: `📊 Votre récap hebdomadaire AIDE+`,
    html: wrapEmailContent(`
      <h2 style="color: #1e293b; margin-top: 0;">Votre semaine sur AIDE+ 📊</h2>
      
      <div style="${cardStyle}">
        <h3 style="margin-top: 0;">Résumé de la semaine</h3>
        <p style="margin: 5px 0;">🎯 <strong>${data.newAidesCount}</strong> nouvelle(s) aide(s) disponible(s)</p>
        <p style="margin: 5px 0;">📋 <strong>${data.proceduresProgress}</strong> démarche(s) en cours</p>
        <p style="margin: 5px 0;">💬 <strong>${data.chatMessages}</strong> message(s) avec l'assistant</p>
      </div>
      
      ${data.upcomingDeadlines.length > 0 ? `
        <div style="${warningCardStyle}">
          <h3 style="margin-top: 0;">⏰ Échéances à venir</h3>
          ${data.upcomingDeadlines.map(d => `
            <p style="margin: 5px 0;">• ${d.name} - <strong>${d.date}</strong></p>
          `).join('')}
        </div>
      ` : ''}
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_CONFIG.frontendUrl}/dashboard" style="${buttonStyle}">
          Accéder à mon espace
        </a>
      </div>
    `),
  }),

  // ========================================
  // ACCOUNT SECURITY
  // ========================================
  
  securityAlert: (data) => ({
    subject: '🔒 Alerte de sécurité - AIDE+',
    html: wrapEmailContent(`
      <h2 style="color: #dc2626; margin-top: 0;">Alerte de sécurité 🔒</h2>
      
      <p>Une activité inhabituelle a été détectée sur votre compte :</p>
      
      <div style="${warningCardStyle}">
        <p style="margin: 5px 0;"><strong>Type :</strong> ${data.alertType}</p>
        <p style="margin: 5px 0;"><strong>Date :</strong> ${data.date}</p>
        <p style="margin: 5px 0;"><strong>Localisation :</strong> ${data.location || 'Inconnue'}</p>
        <p style="margin: 5px 0;"><strong>Appareil :</strong> ${data.device || 'Inconnu'}</p>
      </div>
      
      <p>Si c'était vous, vous pouvez ignorer cet email. Sinon, nous vous recommandons de :</p>
      
      <ol style="padding-left: 20px;">
        <li>Changer votre mot de passe immédiatement</li>
        <li>Vérifier vos paramètres de sécurité</li>
        <li>Nous contacter si nécessaire</li>
      </ol>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_CONFIG.frontendUrl}/auth/reset-password" style="${buttonStyle}">
          Changer mon mot de passe
        </a>
      </div>
    `),
  }),

  accountDeleted: (data) => ({
    subject: 'Votre compte AIDE+ a été supprimé',
    html: wrapEmailContent(`
      <h2 style="color: #1e293b; margin-top: 0;">Au revoir... 👋</h2>
      
      <p>Votre compte AIDE+ a été supprimé avec succès.</p>
      
      <div style="${cardStyle}">
        <p style="margin: 0;">Toutes vos données ont été supprimées conformément à notre politique de confidentialité.</p>
      </div>
      
      <p>Nous sommes tristes de vous voir partir. Si vous avez des retours à nous faire, n'hésitez pas à nous écrire.</p>
      
      <p>Si vous changez d'avis, vous pouvez toujours créer un nouveau compte.</p>
      
      <p>Merci d'avoir utilisé AIDE+.<br>L'équipe AIDE+</p>
    `),
  }),
};

/**
 * Email Service Class
 * Supports both database templates and hardcoded fallbacks
 * Logs all emails to the database for tracking
 */
class EmailService {
  constructor() {
    this.from = emailConfig.from;
    this.replyTo = emailConfig.replyTo;
  }

  /**
   * Replace template variables with actual values
   */
  replaceVariables(text, data) {
    if (!text) return text;
    
    let result = text;
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value ?? '');
    }
    return result;
  }

  /**
   * Get template from database or fallback to hardcoded
   */
  async getTemplate(templateKey, data, language = 'fr') {
    try {
      // Try to get template from database
      const dbTemplate = await emailTemplateRepository.findByKeyAndLanguage(templateKey, language);
      
      if (dbTemplate) {
        return {
          templateId: dbTemplate.id,
          subject: this.replaceVariables(dbTemplate.subject, data),
          html: this.replaceVariables(dbTemplate.body_html, data),
          text: this.replaceVariables(dbTemplate.body_text, data),
        };
      }
    } catch (error) {
      logger.warn('Failed to fetch template from database, using fallback', { 
        templateKey, 
        error: error.message 
      });
    }

    // Fallback to hardcoded template
    if (templates[templateKey]) {
      const fallbackTemplate = templates[templateKey](data);
      return {
        templateId: null,
        ...fallbackTemplate,
      };
    }

    throw new Error(`Template not found: ${templateKey}`);
  }

  /**
   * Get user ID from email (for logging purposes)
   */
  async getUserIdByEmail(email) {
    try {
      const user = await userRepository.findByEmail(email);
      return user?.id || null;
    } catch {
      return null;
    }
  }

  /**
   * Send an email with database logging
   */
  async send({ to, subject, html, text, templateKey = null, templateId = null, userId = null }) {
    let logId = null;

    try {
      // Get userId if not provided
      if (!userId) {
        userId = await this.getUserIdByEmail(to);
      }

      // Create pending log entry
      try {
        const log = await emailLogRepository.logEmail({
          templateId,
          userId,
          recipientEmail: to,
          subject,
          status: 'pending',
        });
        logId = log?.id;
      } catch (logError) {
        logger.warn('Failed to create email log', { error: logError.message });
      }

      // Send the email
      const result = await transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
        text,
        replyTo: this.replyTo,
      });

      // Update log to sent
      if (logId) {
        try {
          await emailLogRepository.updateStatus(logId, 'sent');
        } catch (logError) {
          logger.warn('Failed to update email log', { error: logError.message });
        }
      }

      // Increment template send count
      if (templateKey) {
        try {
          await emailTemplateRepository.incrementSendCount(templateKey);
        } catch (countError) {
          logger.warn('Failed to increment template count', { error: countError.message });
        }
      }

      logger.info('Email sent successfully', { to, subject, messageId: result.messageId, logId });
      return { id: result.messageId, logId, success: true };
    } catch (error) {
      // Update log to failed
      if (logId) {
        try {
          await emailLogRepository.updateStatus(logId, 'failed', { 
            error_message: error.message 
          });
        } catch (logError) {
          logger.warn('Failed to update email log with error', { error: logError.message });
        }
      }

      logger.error('Failed to send email', { to, subject, error: error.message, logId });
      throw error;
    }
  }

  /**
   * Send email using template key (database or fallback)
   */
  async sendWithTemplate(templateKey, to, data, options = {}) {
    const { language = 'fr', userId = null } = options;
    
    const template = await this.getTemplate(templateKey, data, language);
    
    return this.send({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      templateKey,
      templateId: template.templateId,
      userId,
    });
  }

  /**
   * Send to multiple recipients
   */
  async sendBulk(recipients, templateName, getData) {
    const results = [];
    for (const recipient of recipients) {
      try {
        const data = getData(recipient);
        const template = templates[templateName](data);
        await this.send({ 
          to: recipient.email, 
          ...template,
          templateKey: templateName,
          userId: recipient.id,
        });
        results.push({ email: recipient.email, success: true });
      } catch (error) {
        results.push({ email: recipient.email, success: false, error: error.message });
      }
    }
    return results;
  }

  // ========================================
  // EMAIL STATISTICS (Admin)
  // ========================================

  /**
   * Get email statistics for admin dashboard
   */
  async getEmailStats(options = {}) {
    try {
      return await emailLogRepository.getStats(options);
    } catch (error) {
      logger.error('Failed to get email stats', { error: error.message });
      return null;
    }
  }

  /**
   * Get recent email logs
   */
  async getRecentEmails(limit = 50) {
    try {
      return await emailLogRepository.findRecent(limit);
    } catch (error) {
      logger.error('Failed to get recent emails', { error: error.message });
      return [];
    }
  }

  /**
   * Get user's email history
   */
  async getUserEmailHistory(userId, options = {}) {
    try {
      return await emailLogRepository.findByUser(userId, options);
    } catch (error) {
      logger.error('Failed to get user email history', { error: error.message });
      return { data: [], total: 0 };
    }
  }

  // ========================================
  // AUTH EMAILS
  // ========================================
  
  async sendWelcome(to, data) {
    const template = templates.welcome(data);
    return this.send({ to, ...template, templateKey: 'welcome' });
  }

  async sendMagicLink(to, link) {
    const template = templates.magicLink({ link });
    return this.send({ to, ...template, templateKey: 'magic_link' });
  }

  async sendPasswordReset(to, link) {
    const template = templates.passwordReset({ link });
    return this.send({ to, ...template, templateKey: 'password_reset' });
  }

  // ========================================
  // SUBSCRIPTION EMAILS
  // ========================================
  
  async sendSubscriptionWelcome(to, data) {
    const template = templates.subscriptionWelcome(data);
    return this.send({ to, ...template, templateKey: 'subscription_welcome' });
  }

  async sendSubscriptionConfirmation(to, data) {
    const template = templates.subscriptionConfirmation(data);
    return this.send({ to, ...template, templateKey: 'subscription_confirmation' });
  }

  async sendSubscriptionCancelled(to, data) {
    const template = templates.subscriptionCancelled(data);
    return this.send({ to, ...template, templateKey: 'subscription_canceled' });
  }

  async sendPaymentFailed(to, data) {
    const template = templates.paymentFailed(data);
    return this.send({ to, ...template, templateKey: 'payment_failed' });
  }

  // ========================================
  // ADMIN NOTIFICATION EMAILS
  // ========================================
  
  async sendAdminNewSubscription(data) {
    const template = templates.adminNewSubscription(data);
    return this.send({ to: emailConfig.adminEmail || emailConfig.supportEmail, ...template, templateKey: 'admin_new_subscription' });
  }

  async sendAdminNewUser(data) {
    const template = templates.adminNewUser(data);
    return this.send({ to: emailConfig.adminEmail || emailConfig.supportEmail, ...template, templateKey: 'admin_new_user' });
  }

  // ========================================
  // PLATFORM UPDATE EMAILS
  // ========================================
  
  async sendPlatformUpdate(to, data) {
    const template = templates.platformUpdate(data);
    return this.send({ to, ...template, templateKey: 'platform_update' });
  }

  // ========================================
  // AIDES & SIMULATION EMAILS
  // ========================================
  
  async sendNewAidesAvailable(to, data) {
    const template = templates.newAidesAvailable(data);
    return this.send({ to, ...template, templateKey: 'new_aides_available' });
  }

  async sendAidesUpdate(to, data) {
    const template = templates.aidesUpdate(data);
    return this.send({ to, ...template, templateKey: 'aides_update' });
  }

  async sendSimulationResults(to, data) {
    const template = templates.simulationResults(data);
    return this.send({ to, ...template, templateKey: 'simulation_results' });
  }

  // ========================================
  // PROCEDURE REMINDER EMAILS
  // ========================================
  
  async sendProcedureReminder(to, data) {
    const template = templates.procedureReminder(data);
    return this.send({ to, ...template, templateKey: 'procedure_reminder' });
  }

  async sendProcedureDeadline(to, data) {
    const template = templates.procedureDeadline(data);
    return this.send({ to, ...template, templateKey: 'procedure_deadline' });
  }

  // ========================================
  // AFFILIATE EMAILS
  // ========================================
  
  async sendAffiliateWelcome(to, data) {
    const template = templates.affiliateWelcome(data);
    return this.send({ to, ...template, templateKey: 'affiliate_welcome' });
  }

  async sendAffiliateNewReferral(to, data) {
    const template = templates.affiliateNewReferral(data);
    return this.send({ to, ...template, templateKey: 'affiliate_new_referral' });
  }

  async sendAffiliatePayout(to, data) {
    const template = templates.affiliatePayout(data);
    return this.send({ to, ...template, templateKey: 'affiliate_payout' });
  }

  async sendAffiliatePayoutPending(to, data) {
    const template = templates.affiliatePayoutPending(data);
    return this.send({ to, ...template, templateKey: 'affiliate_payout_pending' });
  }

  // ========================================
  // CONTACT & SUPPORT EMAILS
  // ========================================
  
  async sendContactConfirmation(to, data) {
    const template = templates.contactConfirmation(data);
    return this.send({ to, ...template, templateKey: 'contact_confirmation' });
  }

  async sendSupportNotification(data) {
    const template = templates.supportNotification(data);
    return this.send({ to: emailConfig.supportEmail, ...template, templateKey: 'support_notification' });
  }

  // ========================================
  // WEEKLY DIGEST
  // ========================================
  
  async sendWeeklyDigest(to, data) {
    const template = templates.weeklyDigest(data);
    return this.send({ to, ...template, templateKey: 'weekly_digest' });
  }

  // ========================================
  // SECURITY EMAILS
  // ========================================
  
  async sendSecurityAlert(to, data) {
    const template = templates.securityAlert(data);
    return this.send({ to, ...template, templateKey: 'security_alert' });
  }

  async sendAccountDeleted(to, data) {
    const template = templates.accountDeleted(data);
    return this.send({ to, ...template, templateKey: 'account_deleted' });
  }
}

export const emailService = new EmailService();
export default emailService;
