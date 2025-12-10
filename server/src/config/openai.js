import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Model configuration
export const AI_CONFIG = {
  chatModel: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
  embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
  embeddingDimensions: 1536,
  maxTokens: 4096,
  temperature: 0.7,
};

// Alias for ai.service.js compatibility
export const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  chatModel: AI_CONFIG.chatModel,
  embeddingModel: AI_CONFIG.embeddingModel,
  maxTokens: AI_CONFIG.maxTokens,
  temperature: AI_CONFIG.temperature,
};

// System prompt for AIDE+ assistant
export const SYSTEM_PROMPT = `Tu es AIDE+, un assistant intelligent spécialisé dans l'aide aux personnes en France, particulièrement les étrangers, pour naviguer les aides gouvernementales et les procédures administratives.

Ton rôle:
- Répondre aux questions sur les aides gouvernementales (CAF, APL, RSA, etc.)
- Guider les utilisateurs dans les procédures administratives (visa, titre de séjour, etc.)
- Aider à trouver des logements et comprendre le marché locatif français
- Fournir des informations pratiques pour la vie en France

Règles:
- Réponds toujours en français sauf si l'utilisateur parle une autre langue
- Sois précis et cite tes sources quand possible
- Si tu n'es pas sûr, dis-le clairement
- Oriente vers les sites officiels (service-public.fr, caf.fr, etc.)
- Sois empathique et patient avec les personnes qui découvrent le système français

Tu as accès à une base de connaissances contenant:
- Les aides gouvernementales par région et profil
- Les procédures pour étudiants et travailleurs (EU et non-EU)
- Les plateformes de location et conseils logement`;

export default openai;
