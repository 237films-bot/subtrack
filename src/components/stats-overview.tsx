'use client';

import { AISubscription } from '@/lib/types';
import { getDaysUntilReset } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Zap, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

interface StatsOverviewProps {
  subscriptions: AISubscription[];
}

export function StatsOverview({ subscriptions }: StatsOverviewProps) {
  const activeSubscriptions = subscriptions.filter(s => s.enabled);
  
  const totalCredits = activeSubscriptions.reduce((sum, s) => sum + s.totalCredits, 0);
  const totalUsed = activeSubscriptions.reduce((sum, s) => sum + s.usedCredits, 0);
  const totalRemaining = totalCredits - totalUsed;
  const overallPercent = totalCredits > 0 ? (totalUsed / totalCredits) * 100 : 0;
  
  // Find subscriptions running low (< 20% remaining)
  const lowCredits = activeSubscriptions.filter(s => {
    const remaining = s.totalCredits - s.usedCredits;
    return (remaining / s.totalCredits) < 0.2;
  });
  
  // Find next reset
  const nextReset = activeSubscriptions.reduce((closest, s) => {
    const days = getDaysUntilReset(s);
    if (!closest || days < closest.days) {
      return { subscription: s, days };
    }
    return closest;
  }, null as { subscription: AISubscription; days: number } | null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Credits */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Zap className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Crédits restants</p>
              <p className="text-2xl font-bold">{totalRemaining.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-3">
            <Progress value={overallPercent} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {totalUsed.toLocaleString()} / {totalCredits.toLocaleString()} utilisés
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Active Subscriptions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <TrendingUp className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Subscriptions actives</p>
              <p className="text-2xl font-bold">{activeSubscriptions.length}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {subscriptions.length - activeSubscriptions.length} inactive{subscriptions.length - activeSubscriptions.length > 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Next Reset */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Clock className="size-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Prochain reset</p>
              {nextReset ? (
                <>
                  <p className="text-2xl font-bold">{nextReset.days} jour{nextReset.days > 1 ? 's' : ''}</p>
                  <p className="text-xs text-muted-foreground">{nextReset.subscription.name}</p>
                </>
              ) : (
                <p className="text-lg text-muted-foreground">-</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Low Credits Warning */}
      <Card className={lowCredits.length > 0 ? 'border-orange-300 dark:border-orange-700' : ''}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              lowCredits.length > 0 
                ? 'bg-orange-100 dark:bg-orange-900' 
                : 'bg-gray-100 dark:bg-gray-800'
            }`}>
              <AlertTriangle className={`size-5 ${
                lowCredits.length > 0 
                  ? 'text-orange-600 dark:text-orange-400' 
                  : 'text-gray-400'
              }`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Crédits faibles</p>
              <p className="text-2xl font-bold">{lowCredits.length}</p>
            </div>
          </div>
          {lowCredits.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {lowCredits.slice(0, 3).map(s => (
                <span 
                  key={s.id}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: s.color + '20', color: s.color }}
                >
                  {s.name}
                </span>
              ))}
              {lowCredits.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{lowCredits.length - 3}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
