'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { Sparkles } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast.success('Connexion réussie !');
        router.push('/');
      } else {
        // Signup
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        toast.success('Compte créé ! Vérifiez vos emails pour confirmer.');
        setIsLogin(true);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || 'Erreur d\'authentification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10">
      <div className="w-full max-w-md">
        <div className="bg-background/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center size-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 mb-4">
              <Sparkles className="size-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              SubTrack
            </h1>
            <p className="text-muted-foreground mt-2">
              Gérez vos crédits IA en un clin d'œil
            </p>
          </div>

          {/* Auth Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
              {!isLogin && (
                <p className="text-xs text-muted-foreground">
                  Minimum 6 caractères
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              disabled={loading}
            >
              {loading ? 'Chargement...' : isLogin ? 'Se connecter' : 'Créer un compte'}
            </Button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              disabled={loading}
            >
              {isLogin ? (
                <>
                  Pas encore de compte ?{' '}
                  <span className="font-semibold text-indigo-500">Créez-en un</span>
                </>
              ) : (
                <>
                  Déjà un compte ?{' '}
                  <span className="font-semibold text-indigo-500">Connectez-vous</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Vos données sont sécurisées et privées
        </p>
      </div>
    </div>
  );
}
