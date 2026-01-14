'use client';

import { useState, useMemo } from 'react';
import { Subscription } from '@/lib/types';
import { getDaysUntilRenewal, isOverdue } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as Icons from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RenewalsTableProps {
  subscriptions: Subscription[];
  onEdit?: (subscription: Subscription) => void;
  onRenew?: (subscription: Subscription) => void;
}

type SortField = 'name' | 'renewalDate' | 'cost' | 'category';
type SortOrder = 'asc' | 'desc';

export function RenewalsTable({ subscriptions, onEdit, onRenew }: RenewalsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('renewalDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const getIcon = (iconName?: string) => {
    if (!iconName) return Icons.Package;
    const iconKey = iconName
      .split('-')
      .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
      .join('');
    const IconKey = iconKey.charAt(0).toUpperCase() + iconKey.slice(1);
    return (Icons as any)[IconKey] || Icons.Package;
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      EUR: '€',
      USD: '$',
      GBP: '£',
      CAD: '$',
    };
    return symbols[currency] || currency;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedSubscriptions = useMemo(() => {
    let filtered = subscriptions.filter(
      (sub) =>
        sub.enabled &&
        (sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sub.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sub.notes?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'renewalDate':
          comparison = new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime();
          break;
        case 'cost':
          comparison = a.cost - b.cost;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [subscriptions, searchQuery, sortField, sortOrder]);

  const getRenewalStatus = (subscription: Subscription) => {
    const days = getDaysUntilRenewal(subscription);
    if (days < 0) {
      return { label: 'En retard', variant: 'destructive' as const, class: 'bg-red-500/20 text-red-700 dark:text-red-300' };
    } else if (days === 0) {
      return { label: "Aujourd'hui", variant: 'destructive' as const, class: 'bg-orange-500/20 text-orange-700 dark:text-orange-300' };
    } else if (days <= 7) {
      return { label: `Dans ${days}j`, variant: 'default' as const, class: 'bg-orange-500/20 text-orange-700 dark:text-orange-300' };
    } else if (days <= 30) {
      return { label: `Dans ${days}j`, variant: 'secondary' as const, class: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300' };
    } else {
      return { label: `Dans ${days}j`, variant: 'outline' as const, class: 'bg-green-500/20 text-green-700 dark:text-green-300' };
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <Icons.ArrowUpDown className="ml-1 h-4 w-4 inline opacity-20" />;
    return sortOrder === 'asc' ? (
      <Icons.ArrowUp className="ml-1 h-4 w-4 inline" />
    ) : (
      <Icons.ArrowDown className="ml-1 h-4 w-4 inline" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tableau des renouvellements</CardTitle>
          <div className="flex items-center gap-2">
            <Icons.Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-sm">
                <th
                  className="text-left p-3 cursor-pointer hover:bg-accent"
                  onClick={() => handleSort('name')}
                >
                  Abonnement <SortIcon field="name" />
                </th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-accent"
                  onClick={() => handleSort('category')}
                >
                  Catégorie <SortIcon field="category" />
                </th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-accent"
                  onClick={() => handleSort('renewalDate')}
                >
                  Date de renouvellement <SortIcon field="renewalDate" />
                </th>
                <th className="text-left p-3">Statut</th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-accent"
                  onClick={() => handleSort('cost')}
                >
                  Coût <SortIcon field="cost" />
                </th>
                <th className="text-left p-3">Cycle</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-muted-foreground">
                    Aucun abonnement trouvé
                  </td>
                </tr>
              ) : (
                filteredAndSortedSubscriptions.map((sub) => {
                  const IconComponent = getIcon(sub.logo);
                  const status = getRenewalStatus(sub);
                  const daysUntil = getDaysUntilRenewal(sub);

                  return (
                    <tr
                      key={sub.id}
                      className="border-b hover:bg-accent/50 transition-colors"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="size-10 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: sub.color + '20' }}
                          >
                            <IconComponent
                              className="size-5"
                              style={{ color: sub.color }}
                            />
                          </div>
                          <div>
                            <div className="font-medium">{sub.name}</div>
                            {sub.notes && (
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {sub.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">{sub.category}</Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {format(new Date(sub.renewalDate), 'dd MMM yyyy', { locale: fr })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(sub.renewalDate), 'EEEE', { locale: fr })}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={status.class}>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">
                          {sub.cost.toFixed(2)} {getCurrencySymbol(sub.currency)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {sub.billingCycle === 'monthly' && 'Mensuel'}
                          {sub.billingCycle === 'quarterly' && 'Trimestriel'}
                          {sub.billingCycle === 'yearly' && 'Annuel'}
                          {sub.billingCycle === 'custom' && `${sub.customCycleDays}j`}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {onRenew && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onRenew(sub)}
                              title="Marquer comme renouvelé"
                            >
                              <Icons.Check className="h-4 w-4" />
                            </Button>
                          )}
                          {onEdit && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onEdit(sub)}
                              title="Modifier"
                            >
                              <Icons.Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {sub.url && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(sub.url, '_blank')}
                              title="Ouvrir le lien"
                            >
                              <Icons.ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
