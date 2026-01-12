'use client';

import { useState, useEffect } from 'react';
import { AISubscription } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Minus, Plus, RotateCcw } from 'lucide-react';

interface UpdateCreditsDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdate: (usedCredits: number, note?: string) => void;
  subscription: AISubscription | null;
}

export function UpdateCreditsDialog({
  open,
  onClose,
  onUpdate,
  subscription,
}: UpdateCreditsDialogProps) {
  const [usedCredits, setUsedCredits] = useState(0);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (subscription) {
      setUsedCredits(subscription.usedCredits);
      setNote('');
    }
  }, [subscription, open]);

  if (!subscription) return null;

  const remaining = subscription.totalCredits - usedCredits;
  const percent = (usedCredits / subscription.totalCredits) * 100;

  const handleQuickAdd = (amount: number) => {
    setUsedCredits(Math.min(subscription.totalCredits, Math.max(0, usedCredits + amount)));
  };

  const handleReset = () => {
    setUsedCredits(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(usedCredits, note || undefined);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ color: subscription.color }}>
            {subscription.name}
          </DialogTitle>
          <DialogDescription>
            Mettre à jour les crédits utilisés
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current status */}
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Restants</span>
              <span className="text-2xl font-bold" style={{ color: subscription.color }}>
                {remaining.toLocaleString()}
              </span>
            </div>
            <Progress value={percent} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{usedCredits.toLocaleString()} utilisés</span>
              <span>{subscription.totalCredits.toLocaleString()} total</span>
            </div>
          </div>

          {/* Credits input */}
          <div className="space-y-3">
            <Label htmlFor="usedCredits">Crédits utilisés</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleQuickAdd(-10)}
                disabled={usedCredits < 10}
              >
                <Minus className="size-4" />
              </Button>
              <Input
                id="usedCredits"
                type="number"
                min="0"
                max={subscription.totalCredits}
                value={usedCredits}
                onChange={(e) => setUsedCredits(Math.min(subscription.totalCredits, parseInt(e.target.value) || 0))}
                className="text-center text-lg font-semibold"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleQuickAdd(10)}
                disabled={usedCredits >= subscription.totalCredits}
              >
                <Plus className="size-4" />
              </Button>
            </div>

            {/* Quick buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleQuickAdd(1)}
              >
                +1
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleQuickAdd(5)}
              >
                +5
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleQuickAdd(10)}
              >
                +10
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleQuickAdd(50)}
              >
                +50
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleQuickAdd(100)}
              >
                +100
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="ml-auto"
              >
                <RotateCcw className="size-3 mr-1" />
                Reset
              </Button>
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Note (optionnel)</Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Génération d'images..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              type="submit"
              style={{ backgroundColor: subscription.color }}
            >
              Mettre à jour
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
