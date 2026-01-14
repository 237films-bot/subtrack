'use client';

import { useMemo } from 'react';
import { Subscription } from '@/lib/types';
import { getTotalMonthlyCost, getTotalYearlyCost, getCostByCategory } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import * as Icons from 'lucide-react';

interface CostOverviewProps {
  subscriptions: Subscription[];
}

export function CostOverview({ subscriptions }: CostOverviewProps) {
  const totalMonthly = getTotalMonthlyCost(subscriptions);
  const totalYearly = getTotalYearlyCost(subscriptions);
  const costsByCategory = getCostByCategory(subscriptions);

  const categoryData = useMemo(() => {
    return Object.entries(costsByCategory)
      .map(([category, cost]) => ({
        name: category,
        value: Number(cost.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value);
  }, [costsByCategory]);

  const subscriptionData = useMemo(() => {
    return subscriptions
      .filter(s => s.enabled)
      .map(sub => {
        let monthlyCost = sub.cost;
        if (sub.billingCycle === 'yearly') {
          monthlyCost = sub.cost / 12;
        } else if (sub.billingCycle === 'quarterly') {
          monthlyCost = sub.cost / 3;
        } else if (sub.billingCycle === 'custom' && sub.customCycleDays) {
          monthlyCost = (sub.cost / sub.customCycleDays) * 30;
        }
        return {
          name: sub.name,
          cost: Number(monthlyCost.toFixed(2)),
          category: sub.category,
          color: sub.color,
        };
      })
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);
  }, [subscriptions]);

  const COLORS = [
    '#6366f1', '#ec4899', '#10a37f', '#d97706', '#3b82f6',
    '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#06b6d4',
    '#84cc16', '#f59e0b', '#64748b',
  ];

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      EUR: '€',
      USD: '$',
      GBP: '£',
      CAD: '$',
    };
    return symbols[currency] || currency;
  };

  // Assume EUR for total calculations (can be improved later)
  const currency = subscriptions[0]?.currency || 'EUR';

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Coût mensuel total</CardDescription>
            <CardTitle className="text-3xl">
              {totalMonthly.toFixed(2)} {getCurrencySymbol(currency)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Icons.TrendingUp className="mr-2 h-4 w-4 text-green-500" />
              Basé sur {subscriptions.filter(s => s.enabled).length} abonnements actifs
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Coût annuel total</CardDescription>
            <CardTitle className="text-3xl">
              {totalYearly.toFixed(2)} {getCurrencySymbol(currency)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Icons.Calendar className="mr-2 h-4 w-4" />
              Projection sur 12 mois
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Coût moyen par abonnement</CardDescription>
            <CardTitle className="text-3xl">
              {subscriptions.length > 0
                ? (totalMonthly / subscriptions.filter(s => s.enabled).length).toFixed(2)
                : '0.00'}{' '}
              {getCurrencySymbol(currency)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Icons.DollarSign className="mr-2 h-4 w-4" />
              Par mois
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Coûts par catégorie</CardTitle>
            <CardDescription>Répartition mensuelle des dépenses</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number | undefined) =>
                      `${(value || 0).toFixed(2)} ${getCurrencySymbol(currency)}`
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Subscriptions Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 abonnements</CardTitle>
            <CardDescription>Par coût mensuel</CardDescription>
          </CardHeader>
          <CardContent>
            {subscriptionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subscriptionData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number | undefined) =>
                      `${(value || 0).toFixed(2)} ${getCurrencySymbol(currency)}`
                    }
                  />
                  <Bar dataKey="cost" radius={[0, 8, 8, 0]}>
                    {subscriptionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Détail par catégorie</CardTitle>
          <CardDescription>Analyse détaillée des coûts mensuels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm">
                  <th className="text-left p-3">Catégorie</th>
                  <th className="text-right p-3">Coût mensuel</th>
                  <th className="text-right p-3">Coût annuel</th>
                  <th className="text-right p-3">% du total</th>
                </tr>
              </thead>
              <tbody>
                {categoryData.map((cat, index) => (
                  <tr key={cat.name} className="border-b hover:bg-accent/50">
                    <td className="p-3 font-medium">{cat.name}</td>
                    <td className="p-3 text-right">
                      {cat.value.toFixed(2)} {getCurrencySymbol(currency)}
                    </td>
                    <td className="p-3 text-right">
                      {(cat.value * 12).toFixed(2)} {getCurrencySymbol(currency)}
                    </td>
                    <td className="p-3 text-right">
                      {((cat.value / totalMonthly) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
                <tr className="font-bold bg-accent/30">
                  <td className="p-3">TOTAL</td>
                  <td className="p-3 text-right">
                    {totalMonthly.toFixed(2)} {getCurrencySymbol(currency)}
                  </td>
                  <td className="p-3 text-right">
                    {totalYearly.toFixed(2)} {getCurrencySymbol(currency)}
                  </td>
                  <td className="p-3 text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
