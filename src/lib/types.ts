export interface AISubscription {
  id: string;
  name: string;
  logo?: string;
  color: string;
  totalCredits: number;
  usedCredits: number;
  resetDay: number; // Day of month (1-31)
  resetType: 'monthly' | 'weekly' | 'yearly' | 'custom';
  customResetDays?: number; // For custom reset periods
  url?: string;
  notes?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreditHistory {
  id: string;
  subscriptionId: string;
  previousUsed: number;
  newUsed: number;
  change: number;
  date: string;
  note?: string;
}

export const AI_SERVICES_PRESETS: Partial<AISubscription>[] = [
  {
    name: 'Genspark',
    color: '#6366f1',
    logo: 'sparkles',
    url: 'https://genspark.ai',
  },
  {
    name: 'Higgsfield',
    color: '#ec4899',
    logo: 'video',
    url: 'https://higgsfield.ai',
  },
  {
    name: 'ChatGPT',
    color: '#10a37f',
    logo: 'message-circle',
    url: 'https://chat.openai.com',
  },
  {
    name: 'Claude',
    color: '#d97706',
    logo: 'brain',
    url: 'https://claude.ai',
  },
  {
    name: 'Midjourney',
    color: '#ffffff',
    logo: 'image',
    url: 'https://midjourney.com',
  },
  {
    name: 'DALL-E',
    color: '#10a37f',
    logo: 'palette',
    url: 'https://openai.com/dall-e-3',
  },
  {
    name: 'Runway',
    color: '#6366f1',
    logo: 'clapperboard',
    url: 'https://runway.ml',
  },
  {
    name: 'ElevenLabs',
    color: '#000000',
    logo: 'mic',
    url: 'https://elevenlabs.io',
  },
  {
    name: 'Perplexity',
    color: '#20808d',
    logo: 'search',
    url: 'https://perplexity.ai',
  },
  {
    name: 'Pika',
    color: '#ff6b6b',
    logo: 'film',
    url: 'https://pika.art',
  },
  {
    name: 'Suno',
    color: '#8b5cf6',
    logo: 'music',
    url: 'https://suno.ai',
  },
  {
    name: 'Udio',
    color: '#3b82f6',
    logo: 'headphones',
    url: 'https://udio.com',
  },
];
