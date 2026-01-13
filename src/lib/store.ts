'use client';

import { Subscription, RenewalHistory } from './types';

const STORAGE_KEY = 'subscriptions';
const HISTORY_KEY = 'renewal-history';

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
