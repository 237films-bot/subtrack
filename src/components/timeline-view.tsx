'use client';

import { useMemo } from 'react';
import { Subscription } from '@/lib/types';
import { getDaysUntilRenewal, calculateNextRenewalDate } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import * as Icons from 'lucide-react';
import { format, addMonths, startOfMonth, endOfMonth, eachMonthOfInterval, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TimelineViewProps {
  subscriptions: Subscription[];
}

export function TimelineView({ subscriptions }: TimelineViewProps) {
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

  // Calculate renewals for the next 12 months
  const renewalsData = useMemo(() => {
    const now = new Date();
    const months = eachMonthOfInterval({
      start: now,
      end: addMonths(now, 11),
    });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const renewalsInMonth = subscriptions.filter(sub => {
        if (!sub.enabled) return false;

        const renewalDate = new Date(sub.renewalDate);
        let currentRenewal = renewalDate;

        // Check all renewals for this subscription in this month
        while (currentRenewal <= monthEnd) {
          if (isWithinInterval(currentRenewal, { start: monthStart, end: monthEnd })) {
            return true;
          }
          currentRenewal = calculateNextRenewalDate({
            ...sub,
            renewalDate: currentRenewal.toISOString(),
          });
        }

        return false;
      });

      const totalCost = renewalsInMonth.reduce((sum, sub) => sum + sub.cost, 0);
      const count = renewalsInMonth.length;

      return {
        month: format(month, 'MMM yyyy', { locale: fr }),
        count,
        cost: Number(totalCost.toFixed(2)),
      };
    });
  }, [subscriptions]);

  // Upcoming renewals (next 30 days)
  const upcomingRenewals = useMemo(() => {
    return subscriptions
      .filter(sub => sub.enabled)
      .map(sub => ({
        ...sub,
        daysUntil: getDaysUntilRenewal(sub),
      }))
      .filter(sub => sub.daysUntil >= 0 && sub.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [subscriptions]);

  const totalUpcomingCost = upcomingRenewals.reduce((sum, sub) => sum + sub.cost, 0);
  const currency = subscriptions[0]?.currency || 'EUR';

  // Renewals by week (next 4 weeks)
  const weeklyRenewals = useMemo(() => {
    const weeks = ['Semaine 1', 'Semaine 2', 'Semaine 3', 'Semaine 4+'];
    return weeks.map((week, index) => {
      const minDays = index * 7;
      const maxDays = index === 3 ? 30 : (index + 1) * 7;

      const renewals = upcomingRenewals.filter(
        sub => sub.daysUntil >= minDays && sub.daysUntil < maxDays
      );

      return {
        week,
        count: renewals.length,
        cost: Number(renewals.reduce((sum, sub) => sum + sub.cost, 0).toFixed(2)),
      };
    });
  }, [upcomingRenewals]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Renouvellements à venir (30j)</CardDescription>
            <CardTitle className="text-3xl">{upcomingRenewals.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Icons.Calendar className="mr-2 h-4 w-4" />
              Coût total: {totalUpcomingCost.toFixed(2)} {getCurrencySymbol(currency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Plus proche renouvellement</CardDescription>
            <CardTitle className="text-3xl">
              {upcomingRenewals.length > 0
                ? `${upcomingRenewals[0].daysUntil}j`
                : 'N/A'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground truncate">
              <Icons.Clock className="mr-2 h-4 w-4" />
              {upcomingRenewals.length > 0 ? upcomingRenewals[0].name : 'Aucun'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Renouvellements cette semaine</CardDescription>
            <CardTitle className="text-3xl">
              {weeklyRenewals[0]?.count || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Icons.TrendingUp className="mr-2 h-4 w-4" />
              {weeklyRenewals[0]?.cost.toFixed(2)} {getCurrencySymbol(currency)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Renewals Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Renouvellements sur 12 mois</CardTitle>
            <CardDescription>Nombre et coût des renouvellements par mois</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={renewalsData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value: number | undefined, name: string | undefined) => {
                    if (name === 'count') return [`${value || 0} abonnements`, 'Nombre'];
                    return [`${(value || 0).toFixed(2)} ${getCurrencySymbol(currency)}`, 'Coût'];
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="count"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="count"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cost"
                  stroke="#10a37f"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="cost"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Prochaines 4 semaines</CardTitle>
            <CardDescription>Répartition des renouvellements à venir</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyRenewals}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip
                  formatter={(value: number | undefined, name: string | undefined) => {
                    if (name === 'count') return [`${value || 0} abonnements`, 'Nombre'];
                    return [`${(value || 0).toFixed(2)} ${getCurrencySymbol(currency)}`, 'Coût'];
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Renewals List */}
      <Card>
        <CardHeader>
          <CardTitle>Renouvellements à venir (30 prochains jours)</CardTitle>
          <CardDescription>
            Liste chronologique des {upcomingRenewals.length} prochains renouvellements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingRenewals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun renouvellement prévu dans les 30 prochains jours
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingRenewals.map(sub => {
                const IconComponent = getIcon(sub.logo);
                const isUrgent = sub.daysUntil <= 7;
                const isToday = sub.daysUntil === 0;

                return (
                  <div
                    key={sub.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      isToday
                        ? 'bg-orange-500/10 border-orange-500/50'
                        : isUrgent
                        ? 'bg-yellow-500/10 border-yellow-500/50'
                        : 'bg-accent/30'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="size-12 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: sub.color + '20' }}
                      >
                        <IconComponent
                          className="size-6"
                          style={{ color: sub.color }}
                        />
                      </div>
                      <div>
                        <div className="font-medium">{sub.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(sub.renewalDate), 'EEEE dd MMMM yyyy', {
                            locale: fr,
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {sub.cost.toFixed(2)} {getCurrencySymbol(sub.currency)}
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          isToday
                            ? 'text-orange-600 dark:text-orange-400'
                            : isUrgent
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {isToday
                          ? "Aujourd'hui"
                          : sub.daysUntil === 1
                          ? 'Demain'
                          : `Dans ${sub.daysUntil} jours`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
