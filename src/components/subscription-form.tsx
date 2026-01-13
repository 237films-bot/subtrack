'use client';

import { useState, useEffect } from 'react';
import { Subscription, SUBSCRIPTION_PRESETS, SUBSCRIPTION_CATEGORIES, BILLING_CYCLES } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import * as Icons from 'lucide-react';

interface SubscriptionFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (subscription: Subscription) => void;
  subscription?: Subscription | null;
}

export function SubscriptionForm({
  open,
  onClose,
  onSave,
  subscription,
}: SubscriptionFormProps) {
  const [formData, setFormData] = useState<Partial<Subscription>>({
    name: '',
    category: 'SaaS',
    cost: 0,
    currency: 'EUR',
    billingCycle: 'monthly',
    renewalDate: new Date().toISOString(),
    autoRenew: true,
    color: '#6366f1',
    logo: 'package',
    enabled: true,
  });

  useEffect(() => {
    if (subscription) {
      setFormData(subscription);
    } else {
      setFormData({
        name: '',
        category: 'SaaS',
        cost: 0,
        currency: 'EUR',
        billingCycle: 'monthly',
        renewalDate: new Date().toISOString(),
        autoRenew: true,
        color: '#6366f1',
        logo: 'package',
        enabled: true,
      });
    }
  }, [subscription, open]);

  const handlePresetSelect = (presetName: string) => {
    const preset = SUBSCRIPTION_PRESETS.find(p => p.name === presetName);
    if (preset) {
      setFormData({
        ...formData,
        ...preset,
        renewalDate: formData.renewalDate,
        cost: formData.cost,
        currency: formData.currency,
        enabled: formData.enabled,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date().toISOString();
    const newSubscription: Subscription = {
      id: subscription?.id || crypto.randomUUID?.() || Date.now().toString(),
      name: formData.name || 'Sans nom',
      category: formData.category || 'SaaS',
      cost: Number(formData.cost) || 0,
      currency: formData.currency || 'EUR',
      billingCycle: formData.billingCycle || 'monthly',
      customCycleDays: formData.customCycleDays,
      renewalDate: formData.renewalDate || new Date().toISOString(),
      autoRenew: formData.autoRenew ?? true,
      color: formData.color || '#6366f1',
      logo: formData.logo,
      url: formData.url,
      notes: formData.notes,
      enabled: formData.enabled ?? true,
      createdAt: subscription?.createdAt || now,
      updatedAt: now,
    };

    onSave(newSubscription);
    onClose();
  };

  const getIcon = (iconName?: string) => {
    if (!iconName) return Icons.Package;
    const iconKey = iconName
      .split('-')
      .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
      .join('');
    const IconKey = iconKey.charAt(0).toUpperCase() + iconKey.slice(1);
    return (Icons as any)[IconKey] || Icons.Package;
  };

  const IconComponent = getIcon(formData.logo);

  const colorOptions = [
    '#6366f1', '#ec4899', '#10a37f', '#d97706', '#3b82f6',
    '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#000000',
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {subscription ? 'Modifier l\'abonnement' : 'Ajouter un abonnement'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Presets */}
          {!subscription && (
            <div className="space-y-2">
              <Label>Services prédéfinis</Label>
              <div className="flex flex-wrap gap-2">
                {SUBSCRIPTION_PRESETS.map((preset) => (
                  <Badge
                    key={preset.name}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    style={{ borderColor: preset.color, color: preset.color }}
                    onClick={() => handlePresetSelect(preset.name!)}
                  >
                    {preset.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Name & Icon preview */}
          <div className="flex items-center gap-4">
            <div
              className="size-16 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: formData.color + '20' }}
            >
              <IconComponent
                className="size-8"
                style={{ color: formData.color }}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="name">Nom de l'abonnement</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Microsoft 365, Slack..."
                required
              />
            </div>
          </div>

          {/* Category & Billing Cycle */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBSCRIPTION_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingCycle">Facturation</Label>
              <Select
                value={formData.billingCycle}
                onValueChange={(value: any) => setFormData({ ...formData, billingCycle: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_CYCLES.map((cycle) => (
                    <SelectItem key={cycle.value} value={cycle.value}>
                      {cycle.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom cycle days */}
          {formData.billingCycle === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="customCycleDays">Nombre de jours du cycle</Label>
              <Input
                id="customCycleDays"
                type="number"
                min="1"
                value={formData.customCycleDays || ''}
                onChange={(e) =>
                  setFormData({ ...formData, customCycleDays: Number(e.target.value) })
                }
                placeholder="ex: 60"
              />
            </div>
          )}

          {/* Cost & Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Coût par période</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CAD">CAD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Renewal Date */}
          <div className="space-y-2">
            <Label htmlFor="renewalDate">Prochaine date de renouvellement</Label>
            <Input
              id="renewalDate"
              type="date"
              value={
                formData.renewalDate
                  ? new Date(formData.renewalDate).toISOString().split('T')[0]
                  : ''
              }
              onChange={(e) => setFormData({ ...formData, renewalDate: new Date(e.target.value).toISOString() })}
              required
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Couleur</Label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`size-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    formData.color === color ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div className="space-y-2">
            <Label htmlFor="logo">Icône (nom Lucide)</Label>
            <Input
              id="logo"
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              placeholder="ex: package, cloud, github, etc."
            />
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url">URL (optionnel)</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informations supplémentaires..."
            />
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoRenew"
                checked={formData.autoRenew}
                onChange={(e) => setFormData({ ...formData, autoRenew: e.target.checked })}
                className="size-4"
              />
              <Label htmlFor="autoRenew">Renouvellement automatique</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="size-4"
              />
              <Label htmlFor="enabled">Abonnement actif</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              {subscription ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
