import { Resend } from 'resend';
import { emailConfig } from '../config/email.js';
import logger from '../utils/logger.js';
import { APP_CONFIG } from '../config/index.js';

const resend = new Resend(emailConfig.apiKey);

/**
 * Email templates
 */
const templates = {
  welcome: (data) => ({
    subject: 'Bienvenue sur AIDE+ ! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bienvenue sur AIDE+</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">AIDE+</h1>
          </div>
          
          <h2>Bienvenue ${data.name || ''} ! 👋</h2>
          
          <p>Merci de vous être inscrit sur AIDE+, votre assistant pour naviguer dans les aides et démarches administratives en France.</p>
          
          <p>Avec AIDE+, vous pouvez :</p>
          <ul>
            <li>🔍 Découvrir les aides auxquelles vous avez droit</li>
            <li>📋 Suivre vos démarches administratives</li>
            <li>🤖 Poser vos questions à notre assistant IA</li>
            <li>📚 Accéder à des guides personnalisés</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_CONFIG.frontendUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Commencer maintenant
            </a>
          </div>
          
          <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
          
          <p>À bientôt,<br>L'équipe AIDE+</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            Vous recevez cet email car vous vous êtes inscrit sur AIDE+.
          </p>
        </body>
      </html>
    `,
  }),

  magicLink: (data) => ({
    subject: 'Votre lien de connexion AIDE+',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">AIDE+</h1>
          </div>
          
          <h2>Connexion à votre compte</h2>
          
          <p>Cliquez sur le bouton ci-dessous pour vous connecter à votre compte AIDE+ :</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Se connecter
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            Ce lien expire dans 1 heure. Si vous n'avez pas demandé ce lien, vous pouvez ignorer cet email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            AIDE+ - Votre assistant administratif en France
          </p>
        </body>
      </html>
    `,
  }),

  passwordReset: (data) => ({
    subject: 'Réinitialisation de votre mot de passe AIDE+',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">AIDE+</h1>
          </div>
          
          <h2>Réinitialisation du mot de passe</h2>
          
          <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Réinitialiser le mot de passe
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            AIDE+ - Votre assistant administratif en France
          </p>
        </body>
      </html>
    `,
  }),

  subscriptionConfirmation: (data) => ({
    subject: `Bienvenue dans AIDE+ ${data.planName} ! 🎉`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">AIDE+</h1>
          </div>
          
          <h2>Votre abonnement est actif ! 🎉</h2>
          
          <p>Merci d'avoir souscrit à <strong>AIDE+ ${data.planName}</strong>.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Détails de votre abonnement</h3>
            <p><strong>Plan :</strong> ${data.planName}</p>
            <p><strong>Prix :</strong> ${data.price}€/mois</p>
            <p><strong>Prochaine facturation :</strong> ${data.nextBillingDate}</p>
          </div>
          
          <p>Vous avez maintenant accès à toutes les fonctionnalités de votre plan :</p>
          <ul>
            ${data.features.map(f => `<li>${f}</li>`).join('')}
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_CONFIG.frontendUrl}/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accéder à mon compte
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            Vous pouvez gérer votre abonnement depuis votre espace personnel.
          </p>
        </body>
      </html>
    `,
  }),

  subscriptionCancelled: (data) => ({
    subject: 'Confirmation d\'annulation - AIDE+',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">AIDE+</h1>
          </div>
          
          <h2>Votre abonnement a été annulé</h2>
          
          <p>Nous confirmons l'annulation de votre abonnement AIDE+ ${data.planName}.</p>
          
          <p>Vous conservez l'accès à toutes les fonctionnalités jusqu'au <strong>${data.endDate}</strong>.</p>
          
          <p>Nous espérons vous revoir bientôt ! Si vous changez d'avis, vous pouvez vous réabonner à tout moment.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_CONFIG.frontendUrl}/pricing" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir les offres
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            AIDE+ - Votre assistant administratif en France
          </p>
        </body>
      </html>
    `,
  }),

  contactConfirmation: (data) => ({
    subject: 'Nous avons bien reçu votre message - AIDE+',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">AIDE+</h1>
          </div>
          
          <h2>Message reçu ! 📬</h2>
          
          <p>Bonjour ${data.name},</p>
          
          <p>Nous avons bien reçu votre message et nous vous répondrons dans les plus brefs délais.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Sujet :</strong> ${data.subject}</p>
            <p><strong>Message :</strong></p>
            <p style="white-space: pre-wrap;">${data.message}</p>
          </div>
          
          <p>Merci de votre confiance,<br>L'équipe AIDE+</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            AIDE+ - Votre assistant administratif en France
          </p>
        </body>
      </html>
    `,
  }),

  supportNotification: (data) => ({
    subject: `[Support AIDE+] ${data.category}: ${data.subject}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Nouveau message de support</h2>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>De :</strong> ${data.name} (${data.email})</p>
            <p><strong>Catégorie :</strong> ${data.category}</p>
            <p><strong>Sujet :</strong> ${data.subject}</p>
            <hr>
            <p><strong>Message :</strong></p>
            <p style="white-space: pre-wrap;">${data.message}</p>
          </div>
          
          <p><a href="${APP_CONFIG.frontendUrl}/admin/support">Voir dans l'admin</a></p>
        </body>
      </html>
    `,
  }),
};

/**
 * Email Service
 */
class EmailService {
  constructor() {
    this.from = emailConfig.from;
    this.replyTo = emailConfig.replyTo;
  }

  /**
   * Send an email
   */
  async send({ to, subject, html, text }) {
    try {
      const result = await resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
        text,
        reply_to: this.replyTo,
      });

      logger.info('Email sent successfully', { to, subject, id: result.id });
      return result;
    } catch (error) {
      logger.error('Failed to send email', { to, subject, error: error.message });
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcome(to, data) {
    const template = templates.welcome(data);
    return this.send({ to, ...template });
  }

  /**
   * Send magic link email
   */
  async sendMagicLink(to, link) {
    const template = templates.magicLink({ link });
    return this.send({ to, ...template });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(to, link) {
    const template = templates.passwordReset({ link });
    return this.send({ to, ...template });
  }

  /**
   * Send subscription confirmation
   */
  async sendSubscriptionConfirmation(to, data) {
    const template = templates.subscriptionConfirmation(data);
    return this.send({ to, ...template });
  }

  /**
   * Send subscription cancelled confirmation
   */
  async sendSubscriptionCancelled(to, data) {
    const template = templates.subscriptionCancelled(data);
    return this.send({ to, ...template });
  }

  /**
   * Send contact form confirmation to user
   */
  async sendContactConfirmation(to, data) {
    const template = templates.contactConfirmation(data);
    return this.send({ to, ...template });
  }

  /**
   * Send contact form notification to support team
   */
  async sendSupportNotification(data) {
    const template = templates.supportNotification(data);
    return this.send({
      to: emailConfig.supportEmail,
      ...template,
    });
  }
}

export const emailService = new EmailService();
export default emailService;
