'use client';

import { AISubscription } from '@/lib/types';
import { getDaysUntilReset, getNextResetDate } from '@/lib/store';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sparkles,
  Video,
  MessageCircle,
  Brain,
  Image,
  Palette,
  Clapperboard,
  Mic,
  Search,
  Film,
  Music,
  Headphones,
  Pencil,
  Trash2,
  ExternalLink,
  Clock,
  Zap,
  RotateCcw,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  video: Video,
  'message-circle': MessageCircle,
  brain: Brain,
  image: Image,
  palette: Palette,
  clapperboard: Clapperboard,
  mic: Mic,
  search: Search,
  film: Film,
  music: Music,
  headphones: Headphones,
};

interface SubscriptionCardProps {
  subscription: AISubscription;
  onEdit: (subscription: AISubscription) => void;
  onDelete: (id: string) => void;
  onUpdateCredits: (id: string) => void;
}

export function SubscriptionCard({
  subscription,
  onEdit,
  onDelete,
  onUpdateCredits,
}: SubscriptionCardProps) {
  const creditsUsedPercent = subscription.totalCredits > 0 
    ? (subscription.usedCredits / subscription.totalCredits) * 100 
    : 0;
  
  const creditsRemaining = subscription.totalCredits - subscription.usedCredits;
  const daysUntilReset = getDaysUntilReset(subscription);
  const nextResetDate = getNextResetDate(subscription);
  
  const IconComponent = subscription.logo ? iconMap[subscription.logo] : Zap;
  
  // Determine status color based on credits remaining
  const getStatusColor = () => {
    const remainingPercent = (creditsRemaining / subscription.totalCredits) * 100;
    if (remainingPercent <= 10) return 'bg-red-500';
    if (remainingPercent <= 30) return 'bg-orange-500';
    return 'bg-green-500';
  };
  
  // Determine progress bar color
  const getProgressColor = () => {
    if (creditsUsedPercent >= 90) return 'bg-red-500';
    if (creditsUsedPercent >= 70) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  return (
    <Card className={`w-full transition-all duration-200 hover:shadow-lg ${!subscription.enabled ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div 
              className="relative size-14 rounded-xl flex items-center justify-center shadow-sm"
              style={{ backgroundColor: subscription.color + '20' }}
            >
              <div className={`absolute -top-1 -right-1 size-3 rounded-full ${getStatusColor()} ring-2 ring-background`} />
              {IconComponent && (
                <IconComponent 
                  className="size-7" 
                  style={{ color: subscription.color }}
                />
              )}
            </div>
            <div className="flex flex-col">
              <CardTitle className="text-xl">{subscription.name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-3" />
                <span>Reset dans {daysUntilReset} jour{daysUntilReset > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
          {subscription.url && (
            <a 
              href={subscription.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="size-4" />
            </a>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Credits display */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-3xl font-bold" style={{ color: subscription.color }}>
              {creditsRemaining.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">
              / {subscription.totalCredits.toLocaleString()} crédits
            </span>
          </div>
          
          <div className="relative">
            <Progress 
              value={creditsUsedPercent} 
              className="h-3"
            />
            <div 
              className={`absolute top-0 left-0 h-full rounded-full transition-all ${getProgressColor()}`}
              style={{ width: `${Math.min(creditsUsedPercent, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{subscription.usedCredits.toLocaleString()} utilisés</span>
            <span>{creditsUsedPercent.toFixed(1)}%</span>
          </div>
        </div>
        
        {/* Reset info */}
        <div className="flex items-center gap-2 text-sm">
          <RotateCcw className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">Prochain reset:</span>
          <Badge variant="secondary">
            {format(nextResetDate, 'd MMMM yyyy', { locale: fr })}
          </Badge>
        </div>
        
        {subscription.notes && (
          <p className="text-sm text-muted-foreground italic">{subscription.notes}</p>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col gap-3 pt-3">
        <Separator />
        <div className="flex items-center justify-between w-full gap-2">
          <Button 
            variant="default" 
            size="sm"
            onClick={() => onUpdateCredits(subscription.id)}
            style={{ backgroundColor: subscription.color }}
          >
            <Zap className="size-4 mr-1" />
            Mettre à jour
          </Button>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onEdit(subscription)}
            >
              <Pencil className="size-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => onDelete(subscription.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
