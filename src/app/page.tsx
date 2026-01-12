'use client';

import { useState, useEffect } from 'react';
import { AISubscription } from '@/lib/types';
import {
  getSubscriptions,
  addSubscription,
  updateSubscription,
  deleteSubscription,
  updateCredits,
} from '@/lib/store';
import { SubscriptionCard } from '@/components/subscription-card';
import { SubscriptionForm } from '@/components/subscription-form';
import { UpdateCreditsDialog } from '@/components/update-credits-dialog';
import { StatsOverview } from '@/components/stats-overview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Zap,
  Moon,
  Sun,
  SortAsc,
  LayoutGrid,
  List,
} from 'lucide-react';

type SortOption = 'name' | 'credits-remaining' | 'reset-date' | 'usage';
type ViewMode = 'grid' | 'list';

export default function Home() {
  const [subscriptions, setSubscriptions] = useState<AISubscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<AISubscription[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('reset-date');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [darkMode, setDarkMode] = useState(false);
  
  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<AISubscription | null>(null);
  const [updateCreditsOpen, setUpdateCreditsOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<AISubscription | null>(null);

  // Load subscriptions
  useEffect(() => {
    setSubscriptions(getSubscriptions());
    
    // Check for dark mode preference
    if (typeof window !== 'undefined') {
      const isDark = localStorage.getItem('dark-mode') === 'true' ||
        (!localStorage.getItem('dark-mode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  // Filter and sort subscriptions
  useEffect(() => {
    let result = [...subscriptions];
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.notes?.toLowerCase().includes(query)
      );
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'credits-remaining':
          return (b.totalCredits - b.usedCredits) - (a.totalCredits - a.usedCredits);
        case 'usage':
          const aPercent = a.usedCredits / a.totalCredits;
          const bPercent = b.usedCredits / b.totalCredits;
          return bPercent - aPercent;
        case 'reset-date':
        default:
          // This requires the store function, we'll sort by reset day for simplicity
          return a.resetDay - b.resetDay;
      }
    });
    
    setFilteredSubscriptions(result);
  }, [subscriptions, searchQuery, sortBy]);

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

  const handleEditSubscription = (subscription: AISubscription) => {
    setEditingSubscription(subscription);
    setFormOpen(true);
  };

  const handleSaveSubscription = (subscription: AISubscription) => {
    if (editingSubscription) {
      setSubscriptions(updateSubscription(subscription.id, subscription));
    } else {
      setSubscriptions(addSubscription(subscription));
    }
  };

  const handleDeleteSubscription = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette subscription ?')) {
      setSubscriptions(deleteSubscription(id));
    }
  };

  const handleOpenUpdateCredits = (id: string) => {
    const subscription = subscriptions.find(s => s.id === id);
    if (subscription) {
      setSelectedSubscription(subscription);
      setUpdateCreditsOpen(true);
    }
  };

  const handleUpdateCredits = (usedCredits: number, note?: string) => {
    if (selectedSubscription) {
      setSubscriptions(updateCredits(selectedSubscription.id, usedCredits, note));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Zap className="size-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AI Credits Tracker</h1>
                <p className="text-xs text-muted-foreground">Gérez vos crédits IA</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
              >
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
        {/* Stats Overview */}
        <StatsOverview subscriptions={subscriptions} />

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-full sm:w-48">
                <SortAsc className="size-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reset-date">Date de reset</SelectItem>
                <SelectItem value="name">Nom</SelectItem>
                <SelectItem value="credits-remaining">Crédits restants</SelectItem>
                <SelectItem value="usage">Utilisation %</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="size-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Subscriptions Grid/List */}
        {filteredSubscriptions.length > 0 ? (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'flex flex-col gap-4'
          }>
            {filteredSubscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
                onEdit={handleEditSubscription}
                onDelete={handleDeleteSubscription}
                onUpdateCredits={handleOpenUpdateCredits}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex p-4 bg-muted rounded-full mb-4">
              <Zap className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'Aucun résultat' : 'Aucune subscription'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? 'Essayez une autre recherche'
                : 'Commencez par ajouter vos services IA préférés'
              }
            </p>
            {!searchQuery && (
              <Button onClick={handleAddSubscription}>
                <Plus className="size-4 mr-2" />
                Ajouter une subscription
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Dialogs */}
      <SubscriptionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveSubscription}
        subscription={editingSubscription}
      />
      
      <UpdateCreditsDialog
        open={updateCreditsOpen}
        onClose={() => setUpdateCreditsOpen(false)}
        onUpdate={handleUpdateCredits}
        subscription={selectedSubscription}
      />
    </div>
  );
}
