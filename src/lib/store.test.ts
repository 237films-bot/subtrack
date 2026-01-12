import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSubscriptions,
  saveSubscriptions,
  addSubscription,
  updateSubscription,
  deleteSubscription,
  updateCredits,
  getHistory,
  saveHistory,
  addHistory,
  getSubscriptionHistory,
  getNextResetDate,
  getDaysUntilReset,
} from './store';
import { AISubscription } from './types';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('Store functions', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('getSubscriptions', () => {
    it('should return empty array when no data exists', () => {
      const result = getSubscriptions();
      expect(result).toEqual([]);
    });

    it('should return subscriptions from localStorage', () => {
      const mockSubscriptions: AISubscription[] = [
        {
          id: '1',
          name: 'Test Service',
          logo: 'sparkles',
          color: '#6366f1',
          totalCredits: 100,
          usedCredits: 50,
          resetDay: 1,
          resetType: 'monthly',
          enabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem('ai-credits-subscriptions', JSON.stringify(mockSubscriptions));

      const result = getSubscriptions();
      expect(result).toEqual(mockSubscriptions);
    });

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem('ai-credits-subscriptions', 'invalid json');
      const result = getSubscriptions();
      expect(result).toEqual([]);
    });
  });

  describe('saveSubscriptions', () => {
    it('should save subscriptions to localStorage', () => {
      const mockSubscriptions: AISubscription[] = [
        {
          id: '1',
          name: 'Test Service',
          logo: 'sparkles',
          color: '#6366f1',
          totalCredits: 100,
          usedCredits: 50,
          resetDay: 1,
          resetType: 'monthly',
          enabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      saveSubscriptions(mockSubscriptions);

      const stored = localStorage.getItem('ai-credits-subscriptions');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toEqual(mockSubscriptions);
    });
  });

  describe('addSubscription', () => {
    it('should add a new subscription', () => {
      const newSubscription: AISubscription = {
        id: '1',
        name: 'Test Service',
        logo: 'sparkles',
        color: '#6366f1',
        totalCredits: 100,
        usedCredits: 0,
        resetDay: 1,
        resetType: 'monthly',
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = addSubscription(newSubscription);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(newSubscription);

      // Verify it was saved to localStorage
      const stored = getSubscriptions();
      expect(stored).toHaveLength(1);
      expect(stored[0]).toEqual(newSubscription);
    });

    it('should add to existing subscriptions', () => {
      const existing: AISubscription = {
        id: '1',
        name: 'Existing',
        logo: 'sparkles',
        color: '#6366f1',
        totalCredits: 100,
        usedCredits: 0,
        resetDay: 1,
        resetType: 'monthly',
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveSubscriptions([existing]);

      const newSubscription: AISubscription = {
        ...existing,
        id: '2',
        name: 'New Service',
      };

      const result = addSubscription(newSubscription);

      expect(result).toHaveLength(2);
      expect(result[1].name).toBe('New Service');
    });
  });

  describe('updateSubscription', () => {
    it('should update an existing subscription', async () => {
      const subscription: AISubscription = {
        id: '1',
        name: 'Original Name',
        logo: 'sparkles',
        color: '#6366f1',
        totalCredits: 100,
        usedCredits: 50,
        resetDay: 1,
        resetType: 'monthly',
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveSubscriptions([subscription]);

      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = updateSubscription('1', { name: 'Updated Name', usedCredits: 75 });

      expect(result[0].name).toBe('Updated Name');
      expect(result[0].usedCredits).toBe(75);
      expect(result[0].updatedAt).not.toBe(subscription.updatedAt);
    });

    it('should not modify subscriptions if ID not found', () => {
      const subscription: AISubscription = {
        id: '1',
        name: 'Original Name',
        logo: 'sparkles',
        color: '#6366f1',
        totalCredits: 100,
        usedCredits: 50,
        resetDay: 1,
        resetType: 'monthly',
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveSubscriptions([subscription]);

      const result = updateSubscription('non-existent', { name: 'New Name' });

      expect(result[0].name).toBe('Original Name');
    });
  });

  describe('deleteSubscription', () => {
    it('should delete a subscription by ID', () => {
      const subscriptions: AISubscription[] = [
        {
          id: '1',
          name: 'Service 1',
          logo: 'sparkles',
          color: '#6366f1',
          totalCredits: 100,
          usedCredits: 50,
          resetDay: 1,
          resetType: 'monthly',
          enabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Service 2',
          logo: 'video',
          color: '#ec4899',
          totalCredits: 200,
          usedCredits: 100,
          resetDay: 1,
          resetType: 'monthly',
          enabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      saveSubscriptions(subscriptions);

      const result = deleteSubscription('1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });
  });

  describe('getNextResetDate', () => {
    it('should calculate next monthly reset date correctly', () => {
      const subscription: AISubscription = {
        id: '1',
        name: 'Test',
        logo: 'sparkles',
        color: '#6366f1',
        totalCredits: 100,
        usedCredits: 0,
        resetDay: 15,
        resetType: 'monthly',
        enabled: true,
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = getNextResetDate(subscription);

      expect(result).toBeInstanceOf(Date);
      expect(result.getDate()).toBe(15);
    });

    it('should calculate next weekly reset date correctly', () => {
      const subscription: AISubscription = {
        id: '1',
        name: 'Test',
        logo: 'sparkles',
        color: '#6366f1',
        totalCredits: 100,
        usedCredits: 0,
        resetDay: 1, // Monday
        resetType: 'weekly',
        enabled: true,
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = getNextResetDate(subscription);

      expect(result).toBeInstanceOf(Date);
      expect(result.getDay()).toBe(1); // Monday
    });
  });

  describe('getDaysUntilReset', () => {
    it('should return number of days until reset', () => {
      const subscription: AISubscription = {
        id: '1',
        name: 'Test',
        logo: 'sparkles',
        color: '#6366f1',
        totalCredits: 100,
        usedCredits: 0,
        resetDay: 1,
        resetType: 'monthly',
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = getDaysUntilReset(subscription);

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe('History functions', () => {
    it('should get empty history initially', () => {
      const result = getHistory();
      expect(result).toEqual([]);
    });

    it('should save and retrieve history', () => {
      const history = [
        {
          id: '1',
          subscriptionId: 'sub1',
          previousUsed: 0,
          newUsed: 10,
          change: 10,
          date: new Date().toISOString(),
        },
      ];

      saveHistory(history);
      const result = getHistory();

      expect(result).toEqual(history);
    });

    it('should add history entry', () => {
      const entry = {
        id: '1',
        subscriptionId: 'sub1',
        previousUsed: 0,
        newUsed: 10,
        change: 10,
        date: new Date().toISOString(),
      };

      addHistory(entry);
      const result = getHistory();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(entry);
    });

    it('should get subscription-specific history', () => {
      const history = [
        {
          id: '1',
          subscriptionId: 'sub1',
          previousUsed: 0,
          newUsed: 10,
          change: 10,
          date: new Date().toISOString(),
        },
        {
          id: '2',
          subscriptionId: 'sub2',
          previousUsed: 0,
          newUsed: 20,
          change: 20,
          date: new Date().toISOString(),
        },
      ];

      saveHistory(history);
      const result = getSubscriptionHistory('sub1');

      expect(result).toHaveLength(1);
      expect(result[0].subscriptionId).toBe('sub1');
    });
  });

  describe('updateCredits', () => {
    it('should update credits and create history entry', () => {
      const subscription: AISubscription = {
        id: '1',
        name: 'Test',
        logo: 'sparkles',
        color: '#6366f1',
        totalCredits: 100,
        usedCredits: 50,
        resetDay: 1,
        resetType: 'monthly',
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveSubscriptions([subscription]);

      const result = updateCredits('1', 75, 'Test note');

      expect(result[0].usedCredits).toBe(75);

      const history = getSubscriptionHistory('1');
      expect(history).toHaveLength(1);
      expect(history[0].previousUsed).toBe(50);
      expect(history[0].newUsed).toBe(75);
      expect(history[0].change).toBe(25);
      expect(history[0].note).toBe('Test note');
    });
  });
});
