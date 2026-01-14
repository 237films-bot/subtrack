'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  isAuthenticated,
  isPassphraseSet,
  initializePassphrase,
  verifyPassphrase,
  isBlocked,
  getRemainingAttempts,
} from '@/lib/store';
import { Lock, AlertTriangle, Shield } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [passphraseSet, setPassphraseSet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [error, setError] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [blocked, setBlocked] = useState(false);
  const [blockTime, setBlockTime] = useState(0);

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const isAuth = isAuthenticated();
      const hasPassphrase = isPassphraseSet();
      setAuthenticated(isAuth);
      setPassphraseSet(hasPassphrase);
      setLoading(false);

      // Check if blocked
      const blockStatus = isBlocked();
      setBlocked(blockStatus.blocked);
      if (blockStatus.blocked && blockStatus.remainingTime) {
        setBlockTime(blockStatus.remainingTime);
      }

      // Update remaining attempts
      if (!isAuth && hasPassphrase) {
        setRemainingAttempts(getRemainingAttempts());
      }
    };

    checkAuth();

    // Update block timer every second
    const interval = setInterval(() => {
      const blockStatus = isBlocked();
      setBlocked(blockStatus.blocked);
      if (blockStatus.blocked && blockStatus.remainingTime) {
        setBlockTime(blockStatus.remainingTime);
      } else {
        setBlockTime(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSetupPassphrase = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (passphrase.length < 8) {
      setError('La passphrase doit contenir au moins 8 caractères');
      return;
    }

    if (passphrase !== confirmPassphrase) {
      setError('Les passphrases ne correspondent pas');
      return;
    }

    initializePassphrase(passphrase);
    setPassphraseSet(true);
    setPassphrase('');
    setConfirmPassphrase('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = verifyPassphrase(passphrase);

    if (result.success) {
      setAuthenticated(true);
      setPassphrase('');
    } else {
      setError(result.error || 'Erreur inconnue');
      if (result.remainingAttempts !== undefined) {
        setRemainingAttempts(result.remainingAttempts);
      }
      setPassphrase('');

      // Check if now blocked
      const blockStatus = isBlocked();
      if (blockStatus.blocked) {
        setBlocked(true);
        if (blockStatus.remainingTime) {
          setBlockTime(blockStatus.remainingTime);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <Shield className="size-12 mx-auto mb-4 animate-pulse text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (authenticated) {
    return <>{children}</>;
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mb-4">
            <Lock className="size-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Gestionnaire d'Abonnements</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {passphraseSet ? 'Authentification requise' : 'Configuration initiale'}
          </p>
        </div>

        {!passphraseSet ? (
          <form onSubmit={handleSetupPassphrase} className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                Créez une passphrase pour sécuriser l'accès à votre gestionnaire d'abonnements.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passphrase">Passphrase (min. 8 caractères)</Label>
              <Input
                id="passphrase"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Entrez votre passphrase"
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-passphrase">Confirmer la passphrase</Label>
              <Input
                id="confirm-passphrase"
                type="password"
                value={confirmPassphrase}
                onChange={(e) => setConfirmPassphrase(e.target.value)}
                placeholder="Confirmez votre passphrase"
                required
                minLength={8}
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg p-3">
                <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full">
              Créer la passphrase
            </Button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            {blocked && (
              <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="size-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                      Accès temporairement bloqué
                    </p>
                    <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                      Trop de tentatives échouées. Réessayez dans {formatTime(blockTime)}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="login-passphrase">Passphrase</Label>
              <Input
                id="login-passphrase"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Entrez votre passphrase"
                required
                disabled={blocked}
              />
            </div>

            {!blocked && remainingAttempts < 5 && (
              <div className="bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-900 rounded-lg p-3">
                <p className="text-sm text-orange-900 dark:text-orange-100">
                  {remainingAttempts} tentative{remainingAttempts > 1 ? 's' : ''} restante
                  {remainingAttempts > 1 ? 's' : ''}
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg p-3">
                <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={blocked}>
              {blocked ? 'Bloqué' : 'Se connecter'}
            </Button>

            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                Après 5 tentatives échouées, l'accès sera bloqué pendant 15 minutes.
              </p>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
