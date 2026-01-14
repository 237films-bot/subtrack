'use client';

import { Subscription, RenewalHistory } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

// Keep localStorage keys for authentication only
const AUTH_KEY = 'auth-session';
const PASSPHRASE_KEY = 'app-passphrase';
const RATE_LIMIT_KEY = 'auth-rate-limit';

// Old localStorage keys for migration
const OLD_STORAGE_KEY = 'subscriptions';
const OLD_HISTORY_KEY = 'renewal-history';

// Auth types
interface AuthSession {
  authenticated: boolean;
  timestamp: number;
}

interface RateLimitData {
  attempts: number;
  lastAttempt: number;
  blockedUntil?: number;
}

// Helper to convert Supabase snake_case to camelCase
function convertSubscriptionFromDB(dbSub: any): Subscription {
  return {
    id: dbSub.id,
    name: dbSub.name,
    logo: dbSub.logo,
    color: dbSub.color,
    category: dbSub.category,
    cost: Number(dbSub.cost),
    currency: dbSub.currency,
    billingCycle: dbSub.billing_cycle,
    customCycleDays: dbSub.custom_cycle_days,
    renewalDate: dbSub.renewal_date,
    autoRenew: dbSub.auto_renew,
    url: dbSub.url,
    notes: dbSub.notes,
    enabled: dbSub.enabled,
    createdAt: dbSub.created_at,
    updatedAt: dbSub.updated_at,
  };
}

function convertSubscriptionToDB(sub: Subscription) {
  return {
    id: sub.id,
    name: sub.name,
    logo: sub.logo,
    color: sub.color,
    category: sub.category,
    cost: sub.cost,
    currency: sub.currency,
    billing_cycle: sub.billingCycle,
    custom_cycle_days: sub.customCycleDays,
    renewal_date: sub.renewalDate,
    auto_renew: sub.autoRenew,
    url: sub.url,
    notes: sub.notes,
    enabled: sub.enabled,
    created_at: sub.createdAt,
    updated_at: sub.updatedAt,
  };
}

function convertHistoryFromDB(dbHistory: any): RenewalHistory {
  return {
    id: dbHistory.id,
    subscriptionId: dbHistory.subscription_id,
    date: dbHistory.date,
    cost: Number(dbHistory.cost),
    currency: dbHistory.currency,
    note: dbHistory.note,
    wasAutoRenewed: dbHistory.was_auto_renewed,
  };
}

function convertHistoryToDB(history: RenewalHistory) {
  return {
    id: history.id,
    subscription_id: history.subscriptionId,
    date: history.date,
    cost: history.cost,
    currency: history.currency,
    note: history.note,
    was_auto_renewed: history.wasAutoRenewed,
  };
}

// Migration function from localStorage to Supabase
export async function migrateFromLocalStorage(): Promise<{ success: boolean; message: string }> {
  if (typeof window === 'undefined') {
    return { success: false, message: 'Not in browser environment' };
  }

  try {
    // Check if there's data to migrate
    const oldSubsData = localStorage.getItem(OLD_STORAGE_KEY);
    const oldHistoryData = localStorage.getItem(OLD_HISTORY_KEY);

    if (!oldSubsData && !oldHistoryData) {
      return { success: false, message: 'No data to migrate' };
    }

    // Migrate subscriptions
    if (oldSubsData) {
      const subscriptions: Subscription[] = JSON.parse(oldSubsData);

      for (const sub of subscriptions) {
        const dbSub = convertSubscriptionToDB(sub);
        const { error } = await supabase
          .from('subscriptions')
          .upsert(dbSub);

        if (error) {
          console.error('Error migrating subscription:', error);
          return { success: false, message: `Error migrating: ${error.message}` };
        }
      }

      console.log(`Migrated ${subscriptions.length} subscriptions`);
    }

    // Migrate history
    if (oldHistoryData) {
      const history: RenewalHistory[] = JSON.parse(oldHistoryData);

      for (const entry of history) {
        const dbHistory = convertHistoryToDB(entry);
        const { error } = await supabase
          .from('renewal_history')
          .upsert(dbHistory);

        if (error) {
          console.error('Error migrating history:', error);
          return { success: false, message: `Error migrating history: ${error.message}` };
        }
      }

      console.log(`Migrated ${history.length} history entries`);
    }

    // Backup and clear old data
    localStorage.setItem(`${OLD_STORAGE_KEY}_backup`, oldSubsData || '');
    localStorage.setItem(`${OLD_HISTORY_KEY}_backup`, oldHistoryData || '');
    localStorage.removeItem(OLD_STORAGE_KEY);
    localStorage.removeItem(OLD_HISTORY_KEY);

    return { success: true, message: 'Migration completed successfully' };
  } catch (error) {
    console.error('Migration error:', error);
    return { success: false, message: `Migration failed: ${error}` };
  }
}

// Subscriptions functions - now using Supabase
export async function getSubscriptions(): Promise<Subscription[]> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, returning empty array');
    return [];
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching subscriptions:', error);
    return [];
  }

  return (data || []).map(convertSubscriptionFromDB);
}

export async function addSubscription(subscription: Subscription): Promise<Subscription[]> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const dbSub = convertSubscriptionToDB(subscription);

  const { error } = await supabase
    .from('subscriptions')
    .insert(dbSub);

  if (error) {
    console.error('Error adding subscription:', error);
    throw new Error(error.message);
  }

  return await getSubscriptions();
}

export async function updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription[]> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const updateData: any = {};

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.logo !== undefined) updateData.logo = updates.logo;
  if (updates.color !== undefined) updateData.color = updates.color;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.cost !== undefined) updateData.cost = updates.cost;
  if (updates.currency !== undefined) updateData.currency = updates.currency;
  if (updates.billingCycle !== undefined) updateData.billing_cycle = updates.billingCycle;
  if (updates.customCycleDays !== undefined) updateData.custom_cycle_days = updates.customCycleDays;
  if (updates.renewalDate !== undefined) updateData.renewal_date = updates.renewalDate;
  if (updates.autoRenew !== undefined) updateData.auto_renew = updates.autoRenew;
  if (updates.url !== undefined) updateData.url = updates.url;
  if (updates.notes !== undefined) updateData.notes = updates.notes;
  if (updates.enabled !== undefined) updateData.enabled = updates.enabled;

  const { error } = await supabase
    .from('subscriptions')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating subscription:', error);
    throw new Error(error.message);
  }

  return await getSubscriptions();
}

export async function deleteSubscription(id: string): Promise<Subscription[]> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from('subscriptions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting subscription:', error);
    throw new Error(error.message);
  }

  return await getSubscriptions();
}

// Renewal functions - now using Supabase
export async function renewSubscription(id: string, note?: string): Promise<Subscription[]> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  // First, get the subscription
  const { data: subData, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', id)
    .single();

  if (subError || !subData) {
    console.error('Error fetching subscription:', subError);
    throw new Error(subError?.message || 'Subscription not found');
  }

  const subscription = convertSubscriptionFromDB(subData);

  // Record history
  const historyEntry: RenewalHistory = {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    subscriptionId: id,
    date: new Date().toISOString(),
    cost: subscription.cost,
    currency: subscription.currency,
    note,
    wasAutoRenewed: false,
  };

  const { error: historyError } = await supabase
    .from('renewal_history')
    .insert(convertHistoryToDB(historyEntry));

  if (historyError) {
    console.error('Error adding history:', historyError);
  }

  // Calculate next renewal date
  const nextRenewalDate = calculateNextRenewalDate(subscription);

  // Update subscription
  return await updateSubscription(id, { renewalDate: nextRenewalDate.toISOString() });
}

// History functions - now using Supabase
export async function getHistory(): Promise<RenewalHistory[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from('renewal_history')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }

  return (data || []).map(convertHistoryFromDB);
}

export async function getSubscriptionHistory(subscriptionId: string): Promise<RenewalHistory[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from('renewal_history')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching subscription history:', error);
    return [];
  }

  return (data || []).map(convertHistoryFromDB);
}

// Date calculation functions (unchanged)
export function calculateNextRenewalDate(subscription: Subscription): Date {
  const currentRenewal = new Date(subscription.renewalDate);

  if (subscription.billingCycle === 'monthly') {
    currentRenewal.setMonth(currentRenewal.getMonth() + 1);
  } else if (subscription.billingCycle === 'quarterly') {
    currentRenewal.setMonth(currentRenewal.getMonth() + 3);
  } else if (subscription.billingCycle === 'yearly') {
    currentRenewal.setFullYear(currentRenewal.getFullYear() + 1);
  } else if (subscription.billingCycle === 'custom' && subscription.customCycleDays) {
    currentRenewal.setDate(currentRenewal.getDate() + subscription.customCycleDays);
  }

  return currentRenewal;
}

export function getDaysUntilRenewal(subscription: Subscription): number {
  const renewalDate = new Date(subscription.renewalDate);
  const now = new Date();
  const diffTime = renewalDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isRenewalSoon(subscription: Subscription, daysThreshold: number = 30): boolean {
  const days = getDaysUntilRenewal(subscription);
  return days >= 0 && days <= daysThreshold;
}

export function isOverdue(subscription: Subscription): boolean {
  return getDaysUntilRenewal(subscription) < 0;
}

// Cost calculation functions (unchanged)
export function getTotalMonthlyCost(subscriptions: Subscription[]): number {
  return subscriptions
    .filter(s => s.enabled)
    .reduce((total, sub) => {
      let monthlyCost = sub.cost;

      if (sub.billingCycle === 'yearly') {
        monthlyCost = sub.cost / 12;
      } else if (sub.billingCycle === 'quarterly') {
        monthlyCost = sub.cost / 3;
      } else if (sub.billingCycle === 'custom' && sub.customCycleDays) {
        monthlyCost = (sub.cost / sub.customCycleDays) * 30;
      }

      return total + monthlyCost;
    }, 0);
}

export function getTotalYearlyCost(subscriptions: Subscription[]): number {
  return getTotalMonthlyCost(subscriptions) * 12;
}

export function getCostByCategory(subscriptions: Subscription[]): Record<string, number> {
  const costs: Record<string, number> = {};

  subscriptions
    .filter(s => s.enabled)
    .forEach(sub => {
      if (!costs[sub.category]) {
        costs[sub.category] = 0;
      }

      let monthlyCost = sub.cost;
      if (sub.billingCycle === 'yearly') {
        monthlyCost = sub.cost / 12;
      } else if (sub.billingCycle === 'quarterly') {
        monthlyCost = sub.cost / 3;
      } else if (sub.billingCycle === 'custom' && sub.customCycleDays) {
        monthlyCost = (sub.cost / sub.customCycleDays) * 30;
      }

      costs[sub.category] += monthlyCost;
    });

  return costs;
}

export function getUpcomingRenewals(subscriptions: Subscription[], days: number = 30): Subscription[] {
  return subscriptions
    .filter(s => s.enabled && isRenewalSoon(s, days))
    .sort((a, b) => {
      const daysA = getDaysUntilRenewal(a);
      const daysB = getDaysUntilRenewal(b);
      return daysA - daysB;
    });
}

// Authentication functions (kept in localStorage as requested)
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function hashPassphrase(passphrase: string): string {
  let hash = 0;
  for (let i = 0; i < passphrase.length; i++) {
    const char = passphrase.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

export function initializePassphrase(passphrase: string): void {
  if (typeof window === 'undefined') return;
  const hashed = hashPassphrase(passphrase);
  localStorage.setItem(PASSPHRASE_KEY, hashed);
}

export function isPassphraseSet(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(PASSPHRASE_KEY);
}

function getRateLimitData(): RateLimitData {
  if (typeof window === 'undefined') return { attempts: 0, lastAttempt: 0 };
  const data = localStorage.getItem(RATE_LIMIT_KEY);
  return data ? JSON.parse(data) : { attempts: 0, lastAttempt: 0 };
}

function saveRateLimitData(data: RateLimitData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
}

export function isBlocked(): { blocked: boolean; remainingTime?: number } {
  const rateLimitData = getRateLimitData();

  if (rateLimitData.blockedUntil) {
    const now = Date.now();
    if (now < rateLimitData.blockedUntil) {
      return {
        blocked: true,
        remainingTime: Math.ceil((rateLimitData.blockedUntil - now) / 1000)
      };
    } else {
      saveRateLimitData({ attempts: 0, lastAttempt: 0 });
      return { blocked: false };
    }
  }

  return { blocked: false };
}

export function verifyPassphrase(passphrase: string): { success: boolean; error?: string; remainingAttempts?: number } {
  if (typeof window === 'undefined') return { success: false, error: 'Environment not available' };

  const blockStatus = isBlocked();
  if (blockStatus.blocked) {
    const minutes = Math.ceil((blockStatus.remainingTime || 0) / 60);
    return {
      success: false,
      error: `Trop de tentatives. Veuillez réessayer dans ${minutes} minute${minutes > 1 ? 's' : ''}.`
    };
  }

  const storedHash = localStorage.getItem(PASSPHRASE_KEY);
  if (!storedHash) {
    return { success: false, error: 'Passphrase not configured' };
  }

  const inputHash = hashPassphrase(passphrase);
  const rateLimitData = getRateLimitData();

  if (inputHash === storedHash) {
    saveRateLimitData({ attempts: 0, lastAttempt: 0 });
    const session: AuthSession = {
      authenticated: true,
      timestamp: Date.now()
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return { success: true };
  } else {
    const newAttempts = rateLimitData.attempts + 1;
    const newData: RateLimitData = {
      attempts: newAttempts,
      lastAttempt: Date.now()
    };

    if (newAttempts >= MAX_ATTEMPTS) {
      newData.blockedUntil = Date.now() + BLOCK_DURATION;
      saveRateLimitData(newData);
      return {
        success: false,
        error: `Trop de tentatives échouées. Accès bloqué pendant 15 minutes.`
      };
    }

    saveRateLimitData(newData);
    const remaining = MAX_ATTEMPTS - newAttempts;
    return {
      success: false,
      error: 'Passphrase incorrecte',
      remainingAttempts: remaining
    };
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;

  const sessionData = localStorage.getItem(AUTH_KEY);
  if (!sessionData) return false;

  try {
    const session: AuthSession = JSON.parse(sessionData);
    const now = Date.now();

    if (session.authenticated && (now - session.timestamp) < SESSION_DURATION) {
      return true;
    }

    localStorage.removeItem(AUTH_KEY);
    return false;
  } catch {
    return false;
  }
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_KEY);
}

export function getRemainingAttempts(): number {
  const rateLimitData = getRateLimitData();
  return Math.max(0, MAX_ATTEMPTS - rateLimitData.attempts);
}
