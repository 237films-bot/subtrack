# Configuration Supabase pour SubTrack

Ce guide vous aide à configurer la base de données Supabase et l'authentification pour votre application SubTrack.

## 🚀 Étapes de configuration

### 1. Créer les tables dans Supabase

1. Connectez-vous à votre projet Supabase: https://alofokzpswpwzavdmhxh.supabase.co
2. Allez dans **SQL Editor** (icône de base de données dans le menu)
3. Cliquez sur **New Query**
4. Copiez-collez le contenu complet du fichier `supabase-schema.sql`
5. Cliquez sur **Run** pour exécuter le script

Le script va créer:
- ✅ La table `subscriptions` pour stocker vos abonnements IA
- ✅ La table `credit_history` pour l'historique des modifications
- ✅ Les politiques de sécurité RLS (Row Level Security)
- ✅ Les indexes pour optimiser les performances
- ✅ Les triggers pour mettre à jour automatiquement les timestamps

### 2. Vérifier les tables créées

1. Allez dans **Table Editor** dans le menu Supabase
2. Vous devriez voir deux tables:
   - `subscriptions`
   - `credit_history`
3. Vérifiez que les politiques RLS sont activées (icône de cadenas)

### 3. Configurer les variables d'environnement sur Vercel

1. Allez sur votre projet Vercel: https://vercel.com
2. Sélectionnez votre projet SubTrack
3. Allez dans **Settings** > **Environment Variables**
4. Ajoutez ces deux variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://alofokzpswpwzavdmhxh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsb2Zva3pwc3dwd3phdmRtaHhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMDU5MTksImV4cCI6MjA4Mzc4MTkxOX0.NOTJUKmyfCp1kcqhOEKhyCf9rmrB4ntminPJpdnP9tU
```

5. Cliquez sur **Save**
6. Redéployez votre application pour que les variables prennent effet

### 4. Tester l'application

#### En local:

```bash
npm run dev
```

1. Ouvrez http://localhost:3000
2. Vous serez automatiquement redirigé vers `/auth`
3. Créez un compte avec votre email et un mot de passe
4. Une fois connecté, vous serez redirigé vers la page principale
5. Testez d'ajouter un abonnement IA

#### En production (Vercel):

1. Une fois déployé, visitez votre URL Vercel
2. Vous serez redirigé vers la page d'authentification
3. Créez un compte ou connectez-vous
4. Vos données seront maintenant persistées dans Supabase!

## 🔒 Sécurité

### Row Level Security (RLS)

Les politiques RLS garantissent que:
- ✅ Chaque utilisateur ne voit que ses propres données
- ✅ Impossible d'accéder aux données d'un autre utilisateur
- ✅ Protection automatique au niveau de la base de données

### Protection de la page

- ✅ La page principale est protégée par authentification
- ✅ Redirection automatique vers `/auth` si non connecté
- ✅ Vérification de session à chaque chargement de page

## 📝 Fonctionnalités ajoutées

### Authentification
- Page de login/signup à `/auth`
- Email + mot de passe
- Session persistante
- Auto-refresh du token
- Bouton de déconnexion

### Base de données
- Migration complète de localStorage vers Supabase PostgreSQL
- Toutes les opérations sont maintenant asynchrones
- Gestion d'erreurs améliorée avec notifications toast
- Historique des modifications de crédits

### Protection
- RLS activé sur toutes les tables
- Isolation complète des données utilisateur
- Pas d'accès public aux données

## 🔧 Configuration Next.js

**Important**: Le fichier `next.config.ts` a été modifié pour supprimer `output: 'export'` car l'export statique n'est pas compatible avec l'authentification côté serveur.

## 🐛 Dépannage

### Erreur "Session expired"
- Reconnectez-vous à `/auth`
- Vérifiez que les variables d'environnement sont correctes

### Erreur réseau
- Vérifiez votre connexion internet
- Vérifiez que l'URL Supabase est correcte
- Vérifiez que le projet Supabase est actif

### Les données ne se sauvegardent pas
- Vérifiez que le SQL schema a été exécuté
- Vérifiez les politiques RLS dans Supabase
- Vérifiez la console du navigateur pour les erreurs

## 📚 Documentation

- [Documentation Supabase](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## ✅ Checklist de migration

- [ ] Exécuter le SQL schema dans Supabase
- [ ] Vérifier que les tables sont créées
- [ ] Configurer les variables d'environnement sur Vercel
- [ ] Redéployer sur Vercel
- [ ] Tester la création de compte
- [ ] Tester l'ajout d'un abonnement
- [ ] Vérifier la persistance des données
- [ ] Tester la déconnexion/reconnexion

## 🎉 Succès!

Une fois toutes ces étapes complétées, votre application SubTrack aura:
- ✅ Persistance des données (PostgreSQL via Supabase)
- ✅ Protection par authentification
- ✅ Sécurité RLS au niveau base de données
- ✅ Déploiement sur Vercel avec variables d'environnement
