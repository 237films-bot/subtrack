'use client';

import { AISubscription, CreditHistory } from './types';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'ai-credits-subscriptions';
const HISTORY_KEY = 'ai-credits-history';

/**
 * Handle localStorage errors gracefully
 * @param error - The error that occurred
 * @param fallbackValue - The value to return if storage fails
 */
function handleStorageError<T>(error: unknown, fallbackValue: T): T {
  console.error('Storage error:', error);

  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  // Show user-friendly error message
  if (errorMessage.includes('quota') || errorMessage.includes('QuotaExceededError')) {
    toast.error('Stockage plein. Veuillez libérer de l\'espace.');
  } else if (errorMessage.includes('SecurityError')) {
    toast.error('Accès au stockage bloqué. Vérifiez vos paramètres.');
  } else {
    toast.error('Erreur lors de la sauvegarde des données.');
  }

  return fallbackValue;
}

export function getSubscriptions(): AISubscription[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const parsed = JSON.parse(data);
    // Validate that it's an array
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return handleStorageError(error, []);
  }
}

export function saveSubscriptions(subscriptions: AISubscription[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
  } catch (error) {
    handleStorageError(error, undefined);
  }
}

export function addSubscription(subscription: AISubscription): AISubscription[] {
  try {
    const subscriptions = getSubscriptions();
    subscriptions.push(subscription);
    saveSubscriptions(subscriptions);
    return subscriptions;
  } catch (error) {
    return handleStorageError(error, getSubscriptions());
  }
}

export function updateSubscription(id: string, updates: Partial<AISubscription>): AISubscription[] {
  try {
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
  } catch (error) {
    return handleStorageError(error, getSubscriptions());
  }
}

export function deleteSubscription(id: string): AISubscription[] {
  try {
    let subscriptions = getSubscriptions();
    subscriptions = subscriptions.filter(s => s.id !== id);
    saveSubscriptions(subscriptions);

    // Also delete related history
    let history = getHistory();
    history = history.filter(h => h.subscriptionId !== id);
    saveHistory(history);

    return subscriptions;
  } catch (error) {
    return handleStorageError(error, getSubscriptions());
  }
}

export function updateCredits(id: string, usedCredits: number, note?: string): AISubscription[] {
  try {
    const subscriptions = getSubscriptions();
    const subscription = subscriptions.find(s => s.id === id);

    if (subscription) {
      // Record history
      const historyEntry: CreditHistory = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        subscriptionId: id,
        previousUsed: subscription.usedCredits,
        newUsed: usedCredits,
        change: usedCredits - subscription.usedCredits,
        date: new Date().toISOString(),
        note,
      };
      addHistory(historyEntry);

      // Update subscription
      return updateSubscription(id, { usedCredits });
    }

    return subscriptions;
  } catch (error) {
    return handleStorageError(error, getSubscriptions());
  }
}

// History functions
export function getHistory(): CreditHistory[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(HISTORY_KEY);
    if (!data) return [];

    const parsed = JSON.parse(data);
    // Validate that it's an array
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return handleStorageError(error, []);
  }
}

export function saveHistory(history: CreditHistory[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    handleStorageError(error, undefined);
  }
}

export function addHistory(entry: CreditHistory): void {
  try {
    const history = getHistory();
    history.push(entry);
    saveHistory(history);
  } catch (error) {
    handleStorageError(error, undefined);
  }
}

export function getSubscriptionHistory(subscriptionId: string): CreditHistory[] {
  try {
    return getHistory().filter(h => h.subscriptionId === subscriptionId);
  } catch (error) {
    return handleStorageError(error, []);
  }
}

// Reset logic
export function getNextResetDate(subscription: AISubscription): Date {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  if (subscription.resetType === 'monthly') {
    let resetDay = Math.min(subscription.resetDay, 28); // Handle months with fewer days
    
    if (currentDay < resetDay) {
      // Reset is later this month
      return new Date(currentYear, currentMonth, resetDay);
    } else {
      // Reset is next month
      return new Date(currentYear, currentMonth + 1, resetDay);
    }
  }
  
  if (subscription.resetType === 'weekly') {
    const dayOfWeek = now.getDay();
    const targetDay = subscription.resetDay; // 0-6 (Sunday-Saturday)
    let daysUntilReset = targetDay - dayOfWeek;
    if (daysUntilReset <= 0) daysUntilReset += 7;
    const nextReset = new Date(now);
    nextReset.setDate(now.getDate() + daysUntilReset);
    return nextReset;
  }
  
  if (subscription.resetType === 'yearly') {
    const resetMonth = Math.floor(subscription.resetDay / 100) - 1; // Month encoded as MMDD
    const resetDayOfMonth = subscription.resetDay % 100;
    let year = currentYear;
    if (currentMonth > resetMonth || (currentMonth === resetMonth && currentDay >= resetDayOfMonth)) {
      year++;
    }
    return new Date(year, resetMonth, resetDayOfMonth);
  }
  
  if (subscription.resetType === 'custom' && subscription.customResetDays) {
    // Calculate based on creation date
    const created = new Date(subscription.createdAt);
    const daysSinceCreation = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    const daysUntilReset = subscription.customResetDays - (daysSinceCreation % subscription.customResetDays);
    const nextReset = new Date(now);
    nextReset.setDate(now.getDate() + daysUntilReset);
    return nextReset;
  }
  
  // Default: next month same day
  return new Date(currentYear, currentMonth + 1, subscription.resetDay);
}

export function getDaysUntilReset(subscription: AISubscription): number {
  const nextReset = getNextResetDate(subscription);
  const now = new Date();
  const diffTime = nextReset.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getResetProgress(subscription: AISubscription): number {
  // Progress of the billing cycle (0-100)
  const now = new Date();
  const nextReset = getNextResetDate(subscription);
  
  let cycleDays = 30; // Default monthly
  if (subscription.resetType === 'weekly') cycleDays = 7;
  if (subscription.resetType === 'yearly') cycleDays = 365;
  if (subscription.resetType === 'custom') cycleDays = subscription.customResetDays || 30;
  
  const daysUntilReset = getDaysUntilReset(subscription);
  const daysPassed = cycleDays - daysUntilReset;
  
  return Math.min(100, Math.max(0, (daysPassed / cycleDays) * 100));
}
