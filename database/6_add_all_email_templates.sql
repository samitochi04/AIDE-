-- Add comprehensive email templates
-- Migration: 6_add_all_email_templates.sql

-- Delete existing templates and re-insert with all templates
DELETE FROM email_templates;

-- Insert all email templates
INSERT INTO email_templates (template_key, template_name, description, subject, body_html, body_text, category, available_variables)
VALUES 
-- ========================================
-- AUTHENTICATION EMAILS
-- ========================================
(
    'welcome',
    'Welcome Email',
    'Sent to new users after registration',
    'Bienvenue sur AIDE+ ! ',
    '<html><body>
        <h1>Bienvenue {{name}} ! </h1>
        <p>Merci de vous être inscrit sur AIDE+, votre assistant pour naviguer dans les aides et démarches administratives en France.</p>
        <p>Avec AIDE+, vous pouvez :</p>
        <ul>
            <li>Découvrir les aides auxquelles vous avez droit</li>
            <li>Suivre vos démarches administratives</li>
            <li>Poser vos questions à notre assistant IA</li>
            <li>Accéder à des guides personnalisés</li>
        </ul>
        <p><a href="{{app_url}}/dashboard">Commencer maintenant</a></p>
    </body></html>',
    'Bienvenue sur AIDE+ {{name}}! Nous sommes ravis de vous accueillir.',
    'transactional',
    '["{{name}}", "{{email}}", "{{app_url}}"]'
),
(
    'magic_link',
    'Magic Link Login',
    'Login link for passwordless authentication',
    'Votre lien de connexion AIDE+',
    '<html><body>
        <h1>Connexion à votre compte </h1>
        <p>Cliquez sur le bouton ci-dessous pour vous connecter à votre compte AIDE+ :</p>
        <p><a href="{{link}}">Se connecter</a></p>
        <p>Ce lien expire dans 1 heure. Si vous n''avez pas demandé ce lien, ignorez cet email.</p>
    </body></html>',
    'Cliquez sur ce lien pour vous connecter: {{link}}',
    'transactional',
    '["{{link}}"]'
),
(
    'password_reset',
    'Password Reset',
    'Password reset request',
    'Réinitialisation de votre mot de passe AIDE+',
    '<html><body>
        <h1>Réinitialisation du mot de passe</h1>
        <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
        <p><a href="{{link}}">Réinitialiser le mot de passe</a></p>
        <p>Ce lien expire dans 1 heure. Si vous n''avez pas fait cette demande, ignorez cet email.</p>
    </body></html>',
    'Cliquez sur ce lien pour réinitialiser votre mot de passe: {{link}}',
    'transactional',
    '["{{link}}"]'
),

-- ========================================
-- SUBSCRIPTION EMAILS
-- ========================================
(
    'subscription_welcome',
    'Subscription Welcome',
    'Sent when user subscribes',
    'Bienvenue dans AIDE+ {{planName}} ! ',
    '<html><body>
        <h1>Votre abonnement est actif ! </h1>
        <p>Merci d''avoir souscrit à AIDE+ {{planName}}.</p>
        <p><strong>Détails de votre abonnement</strong></p>
        <p>Plan : {{planName}}</p>
        <p>Prix : {{price}}€/mois</p>
        <p>Prochaine facturation : {{nextBillingDate}}</p>
        <p>Vous avez maintenant accès à toutes les fonctionnalités de votre plan.</p>
        <p><a href="{{app_url}}/dashboard">Accéder à mon compte</a></p>
    </body></html>',
    'Merci! Votre abonnement AIDE+ {{planName}} est maintenant actif.',
    'transactional',
    '["{{planName}}", "{{price}}", "{{nextBillingDate}}", "{{app_url}}"]'
),
(
    'subscription_confirmation',
    'Subscription Payment Confirmation',
    'Payment confirmation for subscription',
    'Confirmation de paiement - AIDE+ {{planName}}',
    '<html><body>
        <h1>Paiement reçu </h1>
        <p>Votre paiement pour AIDE+ {{planName}} a été traité avec succès.</p>
        <p><strong>Montant :</strong> {{price}}€</p>
        <p><strong>Prochaine facturation :</strong> {{nextBillingDate}}</p>
        <p><a href="{{app_url}}/dashboard/subscription">Gérer mon abonnement</a></p>
    </body></html>',
    'Paiement reçu: {{price}}€ pour AIDE+ {{planName}}.',
    'transactional',
    '["{{planName}}", "{{price}}", "{{nextBillingDate}}", "{{app_url}}"]'
),
(
    'subscription_canceled',
    'Subscription Canceled',
    'Sent when subscription is canceled',
    'Confirmation d''annulation - AIDE+',
    '<html><body>
        <h1>Abonnement annulé </h1>
        <p>Nous confirmons l''annulation de votre abonnement AIDE+ {{planName}}.</p>
        <p>Vous conservez l''accès à toutes les fonctionnalités jusqu''au {{endDate}}.</p>
        <p>Nous espérons vous revoir bientôt !</p>
        <p><a href="{{app_url}}/pricing">Voir les offres</a></p>
    </body></html>',
    'Votre abonnement AIDE+ {{planName}} a été annulé et prendra fin le {{endDate}}.',
    'transactional',
    '["{{planName}}", "{{endDate}}", "{{app_url}}"]'
),
(
    'payment_failed',
    'Payment Failed',
    'Sent when payment fails',
    'Échec de paiement - AIDE+',
    '<html><body>
        <h1>Problème de paiement </h1>
        <p>Nous n''avons pas pu traiter votre paiement pour AIDE+ {{planName}}.</p>
        <p><strong>Raison :</strong> {{reason}}</p>
        <p><strong>Prochaine tentative :</strong> {{retryDate}}</p>
        <p>Pour éviter l''interruption de votre service, veuillez mettre à jour vos informations de paiement.</p>
        <p><a href="{{app_url}}/dashboard/subscription">Mettre à jour ma carte</a></p>
    </body></html>',
    'Échec de paiement pour AIDE+ {{planName}}. Veuillez mettre à jour votre carte.',
    'transactional',
    '["{{planName}}", "{{reason}}", "{{retryDate}}", "{{app_url}}"]'
),

-- ========================================
-- ADMIN NOTIFICATION EMAILS
-- ========================================
(
    'admin_new_subscription',
    'Admin: New Subscription',
    'Notification sent to admin for new subscription',
    'Nouvel abonnement - {{planName}}',
    '<html><body>
        <h1>Nouvel abonnement !</h1>
        <p><strong>Utilisateur :</strong> {{userName}}</p>
        <p><strong>Email :</strong> {{userEmail}}</p>
        <p><strong>Plan :</strong> {{planName}}</p>
        <p><strong>Prix :</strong> {{price}}€/mois</p>
        <p><a href="{{app_url}}/x-admin/users">Voir dans l''admin</a></p>
    </body></html>',
    'Nouvel abonnement: {{userName}} - {{planName}} ({{price}}€/mois)',
    'notification',
    '["{{userName}}", "{{userEmail}}", "{{planName}}", "{{price}}", "{{app_url}}"]'
),
(
    'admin_new_user',
    'Admin: New User',
    'Notification sent to admin for new user signup',
    'Nouvel utilisateur inscrit',
    '<html><body>
        <h1>Nouvel utilisateur !</h1>
        <p><strong>Nom :</strong> {{name}}</p>
        <p><strong>Email :</strong> {{email}}</p>
        <p><strong>Source :</strong> {{source}}</p>
        <p><a href="{{app_url}}/x-admin/users">Voir dans l''admin</a></p>
    </body></html>',
    'Nouvel utilisateur: {{name}} ({{email}})',
    'notification',
    '["{{name}}", "{{email}}", "{{source}}", "{{app_url}}"]'
),

-- ========================================
-- PLATFORM UPDATE EMAILS
-- ========================================
(
    'platform_update',
    'Platform Update',
    'General platform update announcement',
    '📢 {{title}}',
    '<html><body>
        <h1>{{title}} 📢</h1>
        <div>{{content}}</div>
        {{#if ctaUrl}}<p><a href="{{ctaUrl}}">{{ctaText}}</a></p>{{/if}}
        <p>L''équipe AIDE+</p>
    </body></html>',
    '{{title}} - {{content}}',
    'marketing',
    '["{{title}}", "{{content}}", "{{ctaText}}", "{{ctaUrl}}"]'
),

-- ========================================
-- AIDES & SIMULATION EMAILS
-- ========================================
(
    'new_aides_available',
    'New Aides Available',
    'Notification when new aides match user profile',
    'Nouvelles aides disponibles pour vous !',
    '<html><body>
        <h1>Nouvelles aides disponibles !</h1>
        <p>Bonne nouvelle ! De nouvelles aides correspondent à votre profil.</p>
        <p><a href="{{app_url}}/dashboard/aides">Voir mes aides</a></p>
    </body></html>',
    'De nouvelles aides correspondent à votre profil sur AIDE+.',
    'notification',
    '["{{app_url}}"]'
),
(
    'aides_update',
    'Aide Update',
    'Notification when a saved aide is updated',
    'Mise à jour de l''aide : {{aideName}}',
    '<html><body>
        <h1>Mise à jour importante </h1>
        <p>L''aide <strong>{{aideName}}</strong> que vous suivez a été mise à jour.</p>
        <p><strong>Ce qui a changé :</strong> {{changes}}</p>
        <p><a href="{{app_url}}/dashboard/aides/{{aideId}}">Voir les détails</a></p>
    </body></html>',
    'L''aide {{aideName}} a été mise à jour.',
    'notification',
    '["{{aideName}}", "{{aideId}}", "{{changes}}", "{{app_url}}"]'
),
(
    'simulation_results',
    'Simulation Results',
    'Email with simulation results summary',
    'Vos résultats de simulation AIDE+',
    '<html><body>
        <h1>Résultats de votre simulation</h1>
        <p>Voici un récapitulatif des aides auxquelles vous pourriez avoir droit :</p>
        <p><strong>Montant total estimé : {{totalAmount}}€/an</strong></p>
        <p>{{aidesCount}} aide(s) identifiée(s)</p>
        <p><a href="{{app_url}}/dashboard/simulation/{{simulationId}}">Voir tous les résultats</a></p>
    </body></html>',
    'Résultats de simulation: {{totalAmount}}€/an potentiel avec {{aidesCount}} aide(s).',
    'transactional',
    '["{{totalAmount}}", "{{aidesCount}}", "{{simulationId}}", "{{app_url}}"]'
),

-- ========================================
-- PROCEDURE REMINDER EMAILS
-- ========================================
(
    'procedure_reminder',
    'Procedure Reminder',
    'Regular reminder for in-progress procedures',
    'Rappel : {{proceduresCount}} démarche(s) en cours',
    '<html><body>
        <h1>Rappel de vos démarches</h1>
        <p>Vous avez <strong>{{proceduresCount}} démarche(s)</strong> en cours. N''oubliez pas de les compléter !</p>
        <p><a href="{{app_url}}/dashboard/procedures">Voir mes démarches</a></p>
    </body></html>',
    'Rappel: vous avez {{proceduresCount}} démarche(s) en cours sur AIDE+.',
    'notification',
    '["{{proceduresCount}}", "{{app_url}}"]'
),
(
    'procedure_deadline',
    'Procedure Deadline',
    'Urgent reminder for approaching deadline',
    'Échéance proche : {{procedureName}}',
    '<html><body>
        <h1>Échéance imminente !</h1>
        <p><strong>{{procedureName}}</strong></p>
        <p>Date limite : {{deadline}}</p>
        <p>Jours restants : {{daysLeft}} jour(s)</p>
        <p>Ne perdez pas cette opportunité ! Complétez votre démarche avant la date limite.</p>
        <p><a href="{{app_url}}/dashboard/procedures/{{procedureId}}">Compléter maintenant</a></p>
    </body></html>',
    'Échéance proche pour {{procedureName}} - {{daysLeft}} jour(s) restants.',
    'notification',
    '["{{procedureName}}", "{{procedureId}}", "{{deadline}}", "{{daysLeft}}", "{{app_url}}"]'
),

-- ========================================
-- AFFILIATE EMAILS
-- ========================================
(
    'affiliate_welcome',
    'Affiliate Welcome',
    'Welcome email for approved affiliates',
    'Bienvenue dans le programme d''affiliation AIDE+ !',
    '<html><body>
        <h1>Bienvenue parmi nos affiliés !</h1>
        <p>Votre demande d''affiliation a été approuvée. Vous pouvez maintenant commencer à gagner des commissions !</p>
        <p><strong>Votre lien d''affiliation :</strong></p>
        <p>{{affiliateLink}}</p>
        <p><strong>Commission :</strong> {{commissionRate}}% sur chaque abonnement</p>
        <p><a href="{{app_url}}/dashboard/affiliate">Accéder à mon espace affilié</a></p>
    </body></html>',
    'Bienvenue dans le programme d''affiliation AIDE+! Votre lien: {{affiliateLink}}',
    'transactional',
    '["{{affiliateLink}}", "{{commissionRate}}", "{{app_url}}"]'
),
(
    'affiliate_new_referral',
    'Affiliate New Referral',
    'Notification for new affiliate conversion',
    'Nouvelle conversion ! +{{commission}}€',
    '<html><body>
        <h1>Félicitations !</h1>
        <p>Un utilisateur s''est abonné grâce à votre lien d''affiliation !</p>
        <p><strong>Commission gagnée :</strong> +{{commission}}€</p>
        <p><strong>Plan :</strong> {{planName}}</p>
        <p><strong>Total du mois :</strong> {{monthlyTotal}}€</p>
        <p><a href="{{app_url}}/dashboard/affiliate">Voir mes statistiques</a></p>
    </body></html>',
    'Nouvelle conversion! +{{commission}}€ de commission.',
    'notification',
    '["{{commission}}", "{{planName}}", "{{monthlyTotal}}", "{{totalReferrals}}", "{{app_url}}"]'
),
(
    'affiliate_payout',
    'Affiliate Payout',
    'Payout confirmation for affiliates',
    'Paiement de {{amount}}€ envoyé !',
    '<html><body>
        <h1>Paiement envoyé !</h1>
        <p>Votre paiement d''affiliation a été effectué.</p>
        <p><strong>Montant :</strong> {{amount}}€</p>
        <p><strong>Méthode :</strong> {{paymentMethod}}</p>
        <p><strong>Référence :</strong> {{reference}}</p>
        <p>Le virement devrait apparaître sur votre compte sous 2-3 jours ouvrés.</p>
    </body></html>',
    'Paiement de {{amount}}€ envoyé!',
    'transactional',
    '["{{amount}}", "{{paymentMethod}}", "{{reference}}"]'
),
(
    'affiliate_payout_pending',
    'Affiliate Payout Pending',
    'Payout request confirmation',
    'Paiement de {{amount}}€ en cours de traitement',
    '<html><body>
        <h1>Paiement en attente</h1>
        <p>Votre demande de paiement est en cours de traitement.</p>
        <p><strong>Montant :</strong> {{amount}}€</p>
        <p><strong>Date de demande :</strong> {{requestDate}}</p>
        <p><strong>Délai estimé :</strong> 5-7 jours ouvrés</p>
        <p>Vous recevrez un email de confirmation une fois le paiement effectué.</p>
    </body></html>',
    'Demande de paiement de {{amount}}€ en cours de traitement.',
    'transactional',
    '["{{amount}}", "{{requestDate}}"]'
),

-- ========================================
-- CONTACT & SUPPORT EMAILS
-- ========================================
(
    'contact_confirmation',
    'Contact Confirmation',
    'Confirmation sent to user after contact form submission',
    'Nous avons bien reçu votre message - AIDE+',
    '<html><body>
        <h1>Message reçu !</h1>
        <p>Bonjour {{name}},</p>
        <p>Nous avons bien reçu votre message et nous vous répondrons dans les plus brefs délais (généralement sous 24-48h).</p>
        <p><strong>Sujet :</strong> {{subject}}</p>
        <p><strong>Message :</strong></p>
        <p>{{message}}</p>
        <p>Merci de votre confiance,<br>L''équipe AIDE+</p>
    </body></html>',
    'Nous avons bien reçu votre message concernant: {{subject}}',
    'transactional',
    '["{{name}}", "{{subject}}", "{{message}}"]'
),
(
    'support_notification',
    'Support Notification',
    'Notification sent to support team',
    '[Support AIDE+] {{category}}: {{subject}}',
    '<html><body>
        <h1>Nouveau message de support</h1>
        <p><strong>De :</strong> {{name}} ({{email}})</p>
        <p><strong>Catégorie :</strong> {{category}}</p>
        <p><strong>Sujet :</strong> {{subject}}</p>
        <hr>
        <p><strong>Message :</strong></p>
        <p>{{message}}</p>
        <p><a href="{{app_url}}/x-admin/support">Répondre dans l''admin</a></p>
    </body></html>',
    'Support - {{category}}: {{subject}} de {{name}}',
    'notification',
    '["{{name}}", "{{email}}", "{{category}}", "{{subject}}", "{{message}}", "{{app_url}}"]'
),

-- ========================================
-- WEEKLY DIGEST
-- ========================================
(
    'weekly_digest',
    'Weekly Digest',
    'Weekly activity summary for users',
    'Votre récap hebdomadaire AIDE+',
    '<html><body>
        <h1>Votre semaine sur AIDE+</h1>
        <p><strong>Résumé de la semaine</strong></p>
        <p>{{newAidesCount}} nouvelle(s) aide(s) disponible(s)</p>
        <p>{{proceduresProgress}} démarche(s) en cours</p>
        <p>{{chatMessages}} message(s) avec l''assistant</p>
        <p><a href="{{app_url}}/dashboard">Accéder à mon espace</a></p>
    </body></html>',
    'Votre récap AIDE+: {{newAidesCount}} nouvelles aides, {{proceduresProgress}} démarches en cours.',
    'notification',
    '["{{newAidesCount}}", "{{proceduresProgress}}", "{{chatMessages}}", "{{app_url}}"]'
),

-- ========================================
-- SECURITY EMAILS
-- ========================================
(
    'security_alert',
    'Security Alert',
    'Security warning for unusual activity',
    'Alerte de sécurité - AIDE+',
    '<html><body>
        <h1>Alerte de sécurité</h1>
        <p>Une activité inhabituelle a été détectée sur votre compte :</p>
        <p><strong>Type :</strong> {{alertType}}</p>
        <p><strong>Date :</strong> {{date}}</p>
        <p><strong>Localisation :</strong> {{location}}</p>
        <p><strong>Appareil :</strong> {{device}}</p>
        <p>Si c''était vous, vous pouvez ignorer cet email. Sinon, nous vous recommandons de changer votre mot de passe.</p>
        <p><a href="{{app_url}}/auth/reset-password">Changer mon mot de passe</a></p>
    </body></html>',
    'Alerte de sécurité: {{alertType}} détecté sur votre compte AIDE+.',
    'transactional',
    '["{{alertType}}", "{{date}}", "{{location}}", "{{device}}", "{{app_url}}"]'
),
(
    'account_deleted',
    'Account Deleted',
    'Confirmation of account deletion',
    'Votre compte AIDE+ a été supprimé',
    '<html><body>
        <h1>Au revoir...</h1>
        <p>Votre compte AIDE+ a été supprimé avec succès.</p>
        <p>Toutes vos données ont été supprimées conformément à notre politique de confidentialité.</p>
        <p>Nous sommes tristes de vous voir partir. Si vous changez d''avis, vous pouvez toujours créer un nouveau compte.</p>
        <p>Merci d''avoir utilisé AIDE+.<br>L''équipe AIDE+</p>
    </body></html>',
    'Votre compte AIDE+ a été supprimé.',
    'transactional',
    '[]'
);

-- Create function to increment email template send count (for better performance)
CREATE OR REPLACE FUNCTION increment_email_template_send_count(p_template_key TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE email_templates 
    SET send_count = send_count + 1,
        last_used_at = NOW()
    WHERE template_key = p_template_key;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for email_logs performance
CREATE INDEX IF NOT EXISTS idx_email_logs_template ON email_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_status ON email_logs(created_at, status);

-- Comment on the approach
COMMENT ON TABLE email_templates IS 'Email templates that can be edited by admin. Code uses these with fallback to hardcoded templates.';
COMMENT ON TABLE email_logs IS 'Comprehensive log of all emails sent for tracking and analytics.';
