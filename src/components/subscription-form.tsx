'use client';

import { useState, useEffect } from 'react';
import { AISubscription, AI_SERVICES_PRESETS } from '@/lib/types';
import { sanitizeInput, sanitizeUrl } from '@/lib/utils';
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
  Zap,
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

const iconOptions = [
  { value: 'sparkles', label: 'Sparkles' },
  { value: 'video', label: 'Video' },
  { value: 'message-circle', label: 'Message' },
  { value: 'brain', label: 'Brain' },
  { value: 'image', label: 'Image' },
  { value: 'palette', label: 'Palette' },
  { value: 'clapperboard', label: 'Clapperboard' },
  { value: 'mic', label: 'Microphone' },
  { value: 'search', label: 'Search' },
  { value: 'film', label: 'Film' },
  { value: 'music', label: 'Music' },
  { value: 'headphones', label: 'Headphones' },
];

const colorOptions = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#10a37f', // Green (OpenAI)
  '#d97706', // Amber
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ef4444', // Red
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#000000', // Black
];

interface SubscriptionFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (subscription: AISubscription) => void;
  subscription?: AISubscription | null;
}

export function SubscriptionForm({
  open,
  onClose,
  onSave,
  subscription,
}: SubscriptionFormProps) {
  const [formData, setFormData] = useState<Partial<AISubscription>>({
    name: '',
    logo: 'sparkles',
    color: '#6366f1',
    totalCredits: 100,
    usedCredits: 0,
    resetDay: 1,
    resetType: 'monthly',
    url: '',
    notes: '',
    enabled: true,
  });

  useEffect(() => {
    if (subscription) {
      setFormData(subscription);
    } else {
      setFormData({
        name: '',
        logo: 'sparkles',
        color: '#6366f1',
        totalCredits: 100,
        usedCredits: 0,
        resetDay: 1,
        resetType: 'monthly',
        url: '',
        notes: '',
        enabled: true,
      });
    }
  }, [subscription, open]);

  const handlePresetSelect = (preset: Partial<AISubscription>) => {
    setFormData({
      ...formData,
      name: preset.name || '',
      logo: preset.logo || 'sparkles',
      color: preset.color || '#6366f1',
      url: preset.url || '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date().toISOString();

    // Sanitize all user inputs to prevent XSS attacks
    const sanitizedName = sanitizeInput(formData.name);
    const sanitizedUrl = sanitizeUrl(formData.url);
    const sanitizedNotes = sanitizeInput(formData.notes);

    const newSubscription: AISubscription = {
      id: subscription?.id || crypto.randomUUID?.() || Date.now().toString(),
      name: sanitizedName || 'Sans nom',
      logo: formData.logo,
      color: formData.color || '#6366f1',
      totalCredits: formData.totalCredits || 100,
      usedCredits: formData.usedCredits || 0,
      resetDay: formData.resetDay || 1,
      resetType: formData.resetType || 'monthly',
      customResetDays: formData.customResetDays,
      url: sanitizedUrl,
      notes: sanitizedNotes,
      enabled: formData.enabled ?? true,
      createdAt: subscription?.createdAt || now,
      updatedAt: now,
    };

    onSave(newSubscription);
    onClose();
  };

  const IconComponent = formData.logo ? iconMap[formData.logo] : Zap;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {subscription ? 'Modifier la subscription' : 'Ajouter une subscription'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Presets */}
          {!subscription && (
            <div className="space-y-2">
              <Label>Services prédéfinis</Label>
              <div className="flex flex-wrap gap-2">
                {AI_SERVICES_PRESETS.map((preset) => (
                  <Badge
                    key={preset.name}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    style={{ borderColor: preset.color, color: preset.color }}
                    onClick={() => handlePresetSelect(preset)}
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
              {IconComponent && (
                <IconComponent 
                  className="size-8" 
                  style={{ color: formData.color }}
                />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="name">Nom du service</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: ChatGPT, Midjourney..."
                required
              />
            </div>
          </div>
          
          {/* Icon & Color */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Icône</Label>
              <Select
                value={formData.logo}
                onValueChange={(value) => setFormData({ ...formData, logo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((icon) => {
                    const Icon = iconMap[icon.value];
                    return (
                      <SelectItem key={icon.value} value={icon.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="size-4" />
                          {icon.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
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
          </div>
          
          {/* Credits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalCredits">Crédits totaux</Label>
              <Input
                id="totalCredits"
                type="number"
                min="1"
                value={formData.totalCredits}
                onChange={(e) => setFormData({ ...formData, totalCredits: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="usedCredits">Crédits utilisés</Label>
              <Input
                id="usedCredits"
                type="number"
                min="0"
                max={formData.totalCredits}
                value={formData.usedCredits}
                onChange={(e) => setFormData({ ...formData, usedCredits: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          
          {/* Reset settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type de reset</Label>
              <Select
                value={formData.resetType}
                onValueChange={(value: 'monthly' | 'weekly' | 'yearly' | 'custom') => 
                  setFormData({ ...formData, resetType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="yearly">Annuel</SelectItem>
                  <SelectItem value="custom">Personnalisé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              {formData.resetType === 'monthly' && (
                <>
                  <Label htmlFor="resetDay">Jour du mois</Label>
                  <Select
                    value={String(formData.resetDay)}
                    onValueChange={(value) => setFormData({ ...formData, resetDay: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={String(day)}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
              
              {formData.resetType === 'weekly' && (
                <>
                  <Label>Jour de la semaine</Label>
                  <Select
                    value={String(formData.resetDay)}
                    onValueChange={(value) => setFormData({ ...formData, resetDay: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Lundi</SelectItem>
                      <SelectItem value="2">Mardi</SelectItem>
                      <SelectItem value="3">Mercredi</SelectItem>
                      <SelectItem value="4">Jeudi</SelectItem>
                      <SelectItem value="5">Vendredi</SelectItem>
                      <SelectItem value="6">Samedi</SelectItem>
                      <SelectItem value="0">Dimanche</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
              
              {formData.resetType === 'custom' && (
                <>
                  <Label htmlFor="customDays">Tous les X jours</Label>
                  <Input
                    id="customDays"
                    type="number"
                    min="1"
                    value={formData.customResetDays || 30}
                    onChange={(e) => setFormData({ ...formData, customResetDays: parseInt(e.target.value) || 30 })}
                  />
                </>
              )}
            </div>
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
              placeholder="Notes sur cette subscription..."
            />
          </div>
          
          {/* Enabled toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="size-4"
            />
            <Label htmlFor="enabled">Subscription active</Label>
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
