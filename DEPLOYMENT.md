# Guide de déploiement Vercel

## Étapes pour déployer sur Vercel

### 1. Créer un compte Vercel (gratuit)
- Allez sur https://vercel.com
- Cliquez sur "Sign Up"
- Connectez-vous avec GitHub (recommandé)

### 2. Importer votre projet
- Sur le dashboard Vercel, cliquez sur **"Add New..."** → **"Project"**
- Sélectionnez le repository GitHub : **237films-bot/subtrack**
- Cliquez sur **"Import"**

### 3. Configurer le projet
- **Framework Preset**: Next.js (détecté automatiquement)
- **Root Directory**: `./` (laisser par défaut)
- **Build Command**: `npm run build` (par défaut)
- **Output Directory**: `.next` (par défaut)

### 4. **IMPORTANT : Ajouter les variables d'environnement**

Avant de cliquer sur "Deploy", vous DEVEZ ajouter vos variables d'environnement :

1. Cliquez sur **"Environment Variables"**
2. Ajoutez ces 2 variables :

   **Variable 1:**
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://yumdljpwwwpvnfpvmfdy.supabase.co`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

   **Variable 2:**
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1bWRsanB3d3dwdm5mcHZtZmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MTczNTYsImV4cCI6MjA4Mzk5MzM1Nn0.TBm4NVLJygQ8lYU9OWmEcudWUJClhfksNf6VFxNbkyw`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

### 5. Déployer
- Cliquez sur **"Deploy"**
- Attendez 2-3 minutes que le build se termine
- ✅ Votre site sera en ligne !

### 6. Accéder à votre site
Vercel vous donnera une URL comme :
- `https://subtrack-xxxx.vercel.app`

Vous pourrez ensuite :
- Configurer un domaine personnalisé (optionnel)
- Voir les logs de déploiement
- Configurer des déploiements automatiques

## Déploiements automatiques

Une fois configuré, **chaque push sur la branche** déclenchera automatiquement un nouveau déploiement !

## Alternative : Déploiement via CLI

Si vous préférez utiliser la ligne de commande :

```bash
npm i -g vercel
vercel login
vercel
```

Puis suivez les instructions.

## Support

En cas de problème :
- Dashboard Vercel : https://vercel.com/dashboard
- Logs : Disponibles dans chaque déploiement
- Documentation : https://vercel.com/docs
