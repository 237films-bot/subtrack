'use client';

import { Subscription, RenewalHistory } from './types';

const STORAGE_KEY = 'subscriptions';
const HISTORY_KEY = 'renewal-history';
const AUTH_KEY = 'auth-session';
const PASSPHRASE_KEY = 'app-passphrase';
const RATE_LIMIT_KEY = 'auth-rate-limit';

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

export function getSubscriptions(): Subscription[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveSubscriptions(subscriptions: Subscription[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
}

export function addSubscription(subscription: Subscription): Subscription[] {
  const subscriptions = getSubscriptions();
  subscriptions.push(subscription);
  saveSubscriptions(subscriptions);
  return subscriptions;
}

export function updateSubscription(id: string, updates: Partial<Subscription>): Subscription[] {
  const subscriptions = getSubscriptions();
  const index = subscriptions.findIndex(s => s.id === id);
  if (index !== -1) {
    subscriptions[index] = {
      ...subscriptions[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveSubscriptions(subscriptions);
  }
  return subscriptions;
}

export function deleteSubscription(id: string): Subscription[] {
  let subscriptions = getSubscriptions();
  subscriptions = subscriptions.filter(s => s.id !== id);
  saveSubscriptions(subscriptions);

  // Also delete related history
  let history = getHistory();
  history = history.filter(h => h.subscriptionId !== id);
  saveHistory(history);

  return subscriptions;
}

// Renewal functions
export function renewSubscription(id: string, note?: string): Subscription[] {
  const subscriptions = getSubscriptions();
  const subscription = subscriptions.find(s => s.id === id);

  if (subscription) {
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
    addHistory(historyEntry);

    // Calculate next renewal date
    const nextRenewalDate = calculateNextRenewalDate(subscription);

    // Update subscription
    return updateSubscription(id, { renewalDate: nextRenewalDate.toISOString() });
  }

  return subscriptions;
}

// History functions
export function getHistory(): RenewalHistory[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveHistory(history: RenewalHistory[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function addHistory(entry: RenewalHistory): void {
  const history = getHistory();
  history.push(entry);
  saveHistory(history);
}

export function getSubscriptionHistory(subscriptionId: string): RenewalHistory[] {
  return getHistory().filter(h => h.subscriptionId === subscriptionId);
}

// Date calculation functions
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

// Cost calculation functions
export function getTotalMonthlyCost(subscriptions: Subscription[]): number {
  return subscriptions
    .filter(s => s.enabled)
    .reduce((total, sub) => {
      let monthlyCost = sub.cost;

      // Convert to monthly equivalent
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

// Authentication functions
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Hash function for passphrase (simple hash for demo - in production use bcrypt or similar)
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
      // Block expired, reset attempts
      saveRateLimitData({ attempts: 0, lastAttempt: 0 });
      return { blocked: false };
    }
  }

  return { blocked: false };
}

export function verifyPassphrase(passphrase: string): { success: boolean; error?: string; remainingAttempts?: number } {
  if (typeof window === 'undefined') return { success: false, error: 'Environment not available' };

  // Check if blocked
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
    // Success - reset rate limit and create session
    saveRateLimitData({ attempts: 0, lastAttempt: 0 });
    const session: AuthSession = {
      authenticated: true,
      timestamp: Date.now()
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return { success: true };
  } else {
    // Failed attempt
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

    // Check if session is still valid
    if (session.authenticated && (now - session.timestamp) < SESSION_DURATION) {
      return true;
    }

    // Session expired
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
