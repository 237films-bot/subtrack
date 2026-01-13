'use client';

import { useState, useEffect } from 'react';
import { Subscription } from '@/lib/types';
import {
  getSubscriptions,
  addSubscription,
  updateSubscription,
  deleteSubscription,
  renewSubscription,
} from '@/lib/store';
import { SubscriptionForm } from '@/components/subscription-form';
import { RenewalsTable } from '@/components/renewals-table';
import { TimelineView } from '@/components/timeline-view';
import { CostOverview } from '@/components/cost-overview';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Plus,
  Moon,
  Sun,
  Calendar,
  Table,
  DollarSign,
  Clock,
} from 'lucide-react';

type ViewMode = 'timeline' | 'table' | 'costs';

export default function Home() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [darkMode, setDarkMode] = useState(false);

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  // Load subscriptions
  useEffect(() => {
    setSubscriptions(getSubscriptions());

    // Check for dark mode preference
    if (typeof window !== 'undefined') {
      const isDark =
        localStorage.getItem('dark-mode') === 'true' ||
        (!localStorage.getItem('dark-mode') &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('dark-mode', (!darkMode).toString());
    document.documentElement.classList.toggle('dark');
  };

  // Handlers
  const handleAddSubscription = () => {
    setEditingSubscription(null);
    setFormOpen(true);
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setFormOpen(true);
  };

  const handleSaveSubscription = (subscription: Subscription) => {
    if (editingSubscription) {
      setSubscriptions(updateSubscription(subscription.id, subscription));
    } else {
      setSubscriptions(addSubscription(subscription));
    }
  };

  const handleDeleteSubscription = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet abonnement ?')) {
      setSubscriptions(deleteSubscription(id));
    }
  };

  const handleRenewSubscription = (subscription: Subscription) => {
    if (
      confirm(
        `Marquer "${subscription.name}" comme renouvelé et calculer la prochaine date de renouvellement ?`
      )
    ) {
      setSubscriptions(renewSubscription(subscription.id, 'Renouvelé manuellement'));
    }
  };

  const tabs = [
    { id: 'timeline', label: 'Chronologie', icon: Clock },
    { id: 'table', label: 'Tableau', icon: Table },
    { id: 'costs', label: 'Coûts', icon: DollarSign },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Calendar className="size-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Gestionnaire d'Abonnements</h1>
                <p className="text-xs text-muted-foreground">
                  Suivez vos renouvellements et dépenses
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
                {darkMode ? <Sun className="size-5" /> : <Moon className="size-5" />}
              </Button>
              <Button onClick={handleAddSubscription}>
                <Plus className="size-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Navigation Tabs */}
        <Card className="p-1">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={viewMode === tab.id ? 'secondary' : 'ghost'}
                  className="flex-1"
                  onClick={() => setViewMode(tab.id as ViewMode)}
                >
                  <Icon className="size-4 mr-2" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </Card>

        {/* Content */}
        {subscriptions.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex p-4 bg-muted rounded-full mb-4">
              <Calendar className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucun abonnement</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par ajouter vos abonnements pour suivre vos renouvellements et
              dépenses
            </p>
            <Button onClick={handleAddSubscription}>
              <Plus className="size-4 mr-2" />
              Ajouter un abonnement
            </Button>
          </div>
        ) : (
          <>
            {viewMode === 'timeline' && <TimelineView subscriptions={subscriptions} />}
            {viewMode === 'table' && (
              <RenewalsTable
                subscriptions={subscriptions}
                onEdit={handleEditSubscription}
                onRenew={handleRenewSubscription}
              />
            )}
            {viewMode === 'costs' && <CostOverview subscriptions={subscriptions} />}
          </>
        )}
      </main>

      {/* Form Dialog */}
      <SubscriptionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveSubscription}
        subscription={editingSubscription}
      />
    </div>
  );
}
