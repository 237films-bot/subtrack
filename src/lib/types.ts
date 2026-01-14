export interface Subscription {
  id: string;
  name: string;
  logo?: string;
  color: string;
  category: string; // e.g., 'SaaS', 'Logiciel', 'Hébergement', 'Marketing', etc.
  cost: number; // Coût par période
  currency: string; // 'EUR', 'USD', etc.
  billingCycle: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  customCycleDays?: number; // Pour les cycles personnalisés
  renewalDate: string; // Date ISO du prochain renouvellement
  autoRenew: boolean; // Renouvellement automatique activé
  url?: string;
  notes?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RenewalHistory {
  id: string;
  subscriptionId: string;
  date: string;
  cost: number;
  currency: string;
  note?: string;
  wasAutoRenewed: boolean;
}

export const SUBSCRIPTION_CATEGORIES = [
  'SaaS',
  'Logiciel',
  'Hébergement',
  'Marketing',
  'Design',
  'Développement',
  'Communication',
  'Productivité',
  'Analytique',
  'Sécurité',
  'Stockage',
  'IA & Automation',
  'Autre',
] as const;

export const BILLING_CYCLES = [
  { value: 'monthly', label: 'Mensuel', days: 30 },
  { value: 'quarterly', label: 'Trimestriel', days: 90 },
  { value: 'yearly', label: 'Annuel', days: 365 },
  { value: 'custom', label: 'Personnalisé', days: 0 },
] as const;

export const SUBSCRIPTION_PRESETS: Partial<Subscription>[] = [
  {
    name: 'Microsoft 365',
    category: 'Productivité',
    color: '#0078d4',
    logo: 'box',
    url: 'https://microsoft.com',
    billingCycle: 'monthly',
  },
  {
    name: 'Adobe Creative Cloud',
    category: 'Design',
    color: '#ff0000',
    logo: 'palette',
    url: 'https://adobe.com',
    billingCycle: 'monthly',
  },
  {
    name: 'Slack',
    category: 'Communication',
    color: '#4a154b',
    logo: 'message-square',
    url: 'https://slack.com',
    billingCycle: 'monthly',
  },
  {
    name: 'GitHub',
    category: 'Développement',
    color: '#181717',
    logo: 'github',
    url: 'https://github.com',
    billingCycle: 'monthly',
  },
  {
    name: 'AWS',
    category: 'Hébergement',
    color: '#ff9900',
    logo: 'cloud',
    url: 'https://aws.amazon.com',
    billingCycle: 'monthly',
  },
  {
    name: 'Google Workspace',
    category: 'Productivité',
    color: '#4285f4',
    logo: 'mail',
    url: 'https://workspace.google.com',
    billingCycle: 'monthly',
  },
  {
    name: 'Notion',
    category: 'Productivité',
    color: '#000000',
    logo: 'file-text',
    url: 'https://notion.so',
    billingCycle: 'monthly',
  },
  {
    name: 'Figma',
    category: 'Design',
    color: '#f24e1e',
    logo: 'figma',
    url: 'https://figma.com',
    billingCycle: 'monthly',
  },
  {
    name: 'Salesforce',
    category: 'SaaS',
    color: '#00a1e0',
    logo: 'cloud',
    url: 'https://salesforce.com',
    billingCycle: 'monthly',
  },
  {
    name: 'Zoom',
    category: 'Communication',
    color: '#2d8cff',
    logo: 'video',
    url: 'https://zoom.us',
    billingCycle: 'monthly',
  },
  {
    name: 'Dropbox',
    category: 'Stockage',
    color: '#0061ff',
    logo: 'hard-drive',
    url: 'https://dropbox.com',
    billingCycle: 'monthly',
  },
  {
    name: 'HubSpot',
    category: 'Marketing',
    color: '#ff7a59',
    logo: 'trending-up',
    url: 'https://hubspot.com',
    billingCycle: 'monthly',
  },
];
