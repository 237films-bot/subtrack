'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('app_authenticated') === 'true';
    if (isLoggedIn) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const correctPassword = process.env.NEXT_PUBLIC_APP_PASSWORD || 'admin';

    if (password === correctPassword) {
      // Set authenticated flag in localStorage
      localStorage.setItem('app_authenticated', 'true');
      toast.success('Connexion réussie !');
      router.push('/');
    } else {
      toast.error('Mot de passe incorrect');
      setPassword('');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Logo & Title */}
          <div className="text-center space-y-4">
            <div className="inline-flex p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
              <Sparkles className="size-12 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Credits Tracker
              </h1>
              <p className="text-muted-foreground mt-2">
                Entrez le mot de passe pour accéder
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Mot de passe
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez le mot de passe"
                required
                disabled={loading}
                className="h-12"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              disabled={loading || !password}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          {/* Info */}
          <div className="text-center text-sm text-muted-foreground pt-4 border-t">
            <p>🔒 Données partagées et protégées</p>
          </div>
        </div>
      </div>
    </div>
  );
}
