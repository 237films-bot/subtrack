'use client';

import { AISubscription, CreditHistory } from './types';
import { supabase } from './supabase';
import toast from 'react-hot-toast';

/**
 * Handle database errors gracefully
 * @param error - The error that occurred
 * @param fallbackValue - The value to return if operation fails
 */
function handleDatabaseError<T>(error: unknown, fallbackValue: T): T {
  console.error('Database error:', error);

  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  // Show user-friendly error message
  if (errorMessage.includes('network')) {
    toast.error('Erreur réseau. Vérifiez votre connexion.');
  } else {
    toast.error('Erreur lors de la sauvegarde des données.');
  }

  return fallbackValue;
}

/**
 * Convert database row to AISubscription format
 */
function dbToSubscription(row: any): AISubscription {
  return {
    id: row.id,
    name: row.name,
    logo: row.logo,
    color: row.color,
    totalCredits: row.total_credits,
    usedCredits: row.used_credits,
    resetDay: row.reset_day,
    resetType: row.reset_type,
    customResetDays: row.custom_reset_days,
    url: row.url,
    notes: row.notes,
    enabled: row.enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert AISubscription to database format (without user_id)
 */
function subscriptionToDb(subscription: AISubscription) {
  return {
    id: subscription.id,
    name: subscription.name,
    logo: subscription.logo,
    color: subscription.color,
    total_credits: subscription.totalCredits,
    used_credits: subscription.usedCredits,
    reset_day: subscription.resetDay,
    reset_type: subscription.resetType,
    custom_reset_days: subscription.customResetDays,
    url: subscription.url,
    notes: subscription.notes,
    enabled: subscription.enabled,
  };
}

export async function getSubscriptions(): Promise<AISubscription[]> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(dbToSubscription);
  } catch (error) {
    return handleDatabaseError(error, []);
  }
}

export async function addSubscription(subscription: AISubscription): Promise<AISubscription[]> {
  try {
    const dbSubscription = subscriptionToDb(subscription);

    const { error } = await supabase
      .from('subscriptions')
      .insert([dbSubscription]);

    if (error) throw error;

    toast.success('Subscription ajoutée !');
    return await getSubscriptions();
  } catch (error) {
    return handleDatabaseError(error, await getSubscriptions());
  }
}

export async function updateSubscription(
  id: string,
  updates: Partial<AISubscription>
): Promise<AISubscription[]> {
  try {
    // Convert camelCase to snake_case for database
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.logo !== undefined) dbUpdates.logo = updates.logo;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.totalCredits !== undefined) dbUpdates.total_credits = updates.totalCredits;
    if (updates.usedCredits !== undefined) dbUpdates.used_credits = updates.usedCredits;
    if (updates.resetDay !== undefined) dbUpdates.reset_day = updates.resetDay;
    if (updates.resetType !== undefined) dbUpdates.reset_type = updates.resetType;
    if (updates.customResetDays !== undefined) dbUpdates.custom_reset_days = updates.customResetDays;
    if (updates.url !== undefined) dbUpdates.url = updates.url;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.enabled !== undefined) dbUpdates.enabled = updates.enabled;

    const { error } = await supabase
      .from('subscriptions')
      .update(dbUpdates)
      .eq('id', id);

    if (error) throw error;

    return await getSubscriptions();
  } catch (error) {
    return handleDatabaseError(error, await getSubscriptions());
  }
}

export async function deleteSubscription(id: string): Promise<AISubscription[]> {
  try {
    // Delete subscription (history will be deleted automatically via CASCADE)
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    toast.success('Subscription supprimée !');
    return await getSubscriptions();
  } catch (error) {
    return handleDatabaseError(error, await getSubscriptions());
  }
}

export async function updateCredits(
  id: string,
  usedCredits: number,
  note?: string
): Promise<AISubscription[]> {
  try {
    // Get current subscription to create history
    const subscriptions = await getSubscriptions();
    const subscription = subscriptions.find(s => s.id === id);

    if (subscription) {
      // Create history entry (without user_id)
      const historyEntry = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        subscription_id: id,
        previous_used: subscription.usedCredits,
        new_used: usedCredits,
        change: usedCredits - subscription.usedCredits,
        date: new Date().toISOString(),
        note,
      };

      await supabase
        .from('credit_history')
        .insert([historyEntry]);

      // Update subscription
      return await updateSubscription(id, { usedCredits });
    }

    return subscriptions;
  } catch (error) {
    return handleDatabaseError(error, await getSubscriptions());
  }
}

// History functions
export async function getHistory(): Promise<CreditHistory[]> {
  try {
    const { data, error } = await supabase
      .from('credit_history')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      subscriptionId: row.subscription_id,
      previousUsed: row.previous_used,
      newUsed: row.new_used,
      change: row.change,
      date: row.date,
      note: row.note,
    }));
  } catch (error) {
    return handleDatabaseError(error, []);
  }
}

export async function getSubscriptionHistory(subscriptionId: string): Promise<CreditHistory[]> {
  try {
    const { data, error } = await supabase
      .from('credit_history')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      subscriptionId: row.subscription_id,
      previousUsed: row.previous_used,
      newUsed: row.new_used,
      change: row.change,
      date: row.date,
      note: row.note,
    }));
  } catch (error) {
    return handleDatabaseError(error, []);
  }
}

// These functions don't need database access, keep them as is
export function getNextResetDate(subscription: AISubscription): Date {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  if (subscription.resetType === 'monthly') {
    let resetDay = Math.min(subscription.resetDay, 28);

    if (currentDay < resetDay) {
      return new Date(currentYear, currentMonth, resetDay);
    } else {
      return new Date(currentYear, currentMonth + 1, resetDay);
    }
  }

  if (subscription.resetType === 'weekly') {
    const dayOfWeek = now.getDay();
    const targetDay = subscription.resetDay;
    let daysUntilReset = targetDay - dayOfWeek;
    if (daysUntilReset <= 0) daysUntilReset += 7;
    const nextReset = new Date(now);
    nextReset.setDate(now.getDate() + daysUntilReset);
    return nextReset;
  }

  if (subscription.resetType === 'yearly') {
    const resetMonth = Math.floor(subscription.resetDay / 100) - 1;
    const resetDayOfMonth = subscription.resetDay % 100;
    let year = currentYear;
    if (currentMonth > resetMonth || (currentMonth === resetMonth && currentDay >= resetDayOfMonth)) {
      year++;
    }
    return new Date(year, resetMonth, resetDayOfMonth);
  }

  if (subscription.resetType === 'custom' && subscription.customResetDays) {
    const created = new Date(subscription.createdAt);
    const daysSinceCreation = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    const daysUntilReset = subscription.customResetDays - (daysSinceCreation % subscription.customResetDays);
    const nextReset = new Date(now);
    nextReset.setDate(now.getDate() + daysUntilReset);
    return nextReset;
  }

  return new Date(currentYear, currentMonth + 1, subscription.resetDay);
}

export function getDaysUntilReset(subscription: AISubscription): number {
  const nextReset = getNextResetDate(subscription);
  const now = new Date();
  const diffTime = nextReset.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getResetProgress(subscription: AISubscription): number {
  const now = new Date();
  const nextReset = getNextResetDate(subscription);

  let cycleDays = 30;
  if (subscription.resetType === 'weekly') cycleDays = 7;
  if (subscription.resetType === 'yearly') cycleDays = 365;
  if (subscription.resetType === 'custom') cycleDays = subscription.customResetDays || 30;

  const daysUntilReset = getDaysUntilReset(subscription);
  const daysPassed = cycleDays - daysUntilReset;

  return Math.min(100, Math.max(0, (daysPassed / cycleDays) * 100));
}
