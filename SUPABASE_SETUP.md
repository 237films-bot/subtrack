# Configuration Supabase

Ce guide explique comment configurer Supabase pour le gestionnaire d'abonnements.

## Prérequis

1. Un compte Supabase (gratuit) : https://supabase.com

## Étapes de configuration

### 1. Créer un projet Supabase

1. Allez sur https://app.supabase.com
2. Cliquez sur "New Project"
3. Choisissez un nom pour votre projet
4. Définissez un mot de passe de base de données
5. Sélectionnez une région proche de vous
6. Cliquez sur "Create new project"

### 2. Exécuter le schéma SQL

1. Dans votre projet Supabase, allez dans **SQL Editor** (dans le menu de gauche)
2. Cliquez sur **New query**
3. Copiez-collez le contenu du fichier `supabase/schema.sql`
4. Cliquez sur **Run** pour exécuter le script

Cela va créer :
- Table `subscriptions` : stocke vos abonnements
- Table `renewal_history` : stocke l'historique des renouvellements
- Indexes pour les performances
- Row Level Security (RLS) avec policies permettant toutes les opérations

### 3. Récupérer les clés API

1. Allez dans **Project Settings** (icône engrenage en bas à gauche)
2. Cliquez sur **API** dans le menu de gauche
3. Vous verrez deux clés importantes :
   - **Project URL** : `https://xxxxxxxxxxxx.supabase.co`
   - **anon public** (clé publique)

### 4. Configurer les variables d'environnement

1. Copiez le fichier `.env.example` vers `.env.local` :
   ```bash
   cp .env.example .env.local
   ```

2. Éditez `.env.local` et ajoutez vos clés Supabase :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_publique
   ```

### 5. Tester l'installation

1. Redémarrez le serveur de développement :
   ```bash
   npm run dev
   ```

2. Ouvrez l'application dans votre navigateur
3. Configurez votre passphrase
4. Ajoutez un abonnement de test
5. Vérifiez dans Supabase (Table Editor) que les données apparaissent

## Migration depuis localStorage

Si vous avez déjà des données dans localStorage, l'application propose une fonction de migration automatique.

Pour l'utiliser, ajoutez ce code temporaire dans votre console du navigateur :
```javascript
import { migrateFromLocalStorage } from '@/lib/store';
const result = await migrateFromLocalStorage();
console.log(result);
```

Ou créez un bouton temporaire dans l'interface pour déclencher la migration.

## Architecture

### Authentification
- **Passphrase** : stockée dans localStorage (hashée)
- **Session** : stockée dans localStorage (24h)
- **Rate limiting** : stocké dans localStorage

### Données
- **Subscriptions** : stockées dans Supabase
- **Renewal history** : stocké dans Supabase

## Sécurité

### Row Level Security (RLS)

Les tables ont RLS activé avec des policies permettant toutes les opérations. Comme vous êtes le seul utilisateur, cela est suffisant.

Si vous souhaitez partager l'application plus tard, vous devrez :
1. Implémenter Supabase Auth
2. Modifier les RLS policies pour filtrer par user_id

### Passphrase

La passphrase utilise actuellement un hash simple pour la démonstration. Pour une sécurité renforcée en production :
1. Utilisez Supabase Auth avec email/password
2. Ou utilisez bcrypt pour hasher la passphrase

## Sauvegarde

Vos données sont automatiquement sauvegardées dans Supabase. Vous pouvez :
- Télécharger une sauvegarde depuis le Table Editor
- Configurer des backups automatiques dans les paramètres du projet Supabase

## Dépannage

### "Error fetching subscriptions"

Vérifiez que :
1. Les variables d'environnement sont correctement définies
2. Le serveur de développement a été redémarré après l'ajout du `.env.local`
3. Les tables ont été créées avec le script SQL

### "Error: invalid API key"

1. Vérifiez que vous utilisez la clé **anon public** (pas la clé service_role)
2. Assurez-vous qu'il n'y a pas d'espaces avant/après les clés dans `.env.local`

### Les données n'apparaissent pas

1. Ouvrez les DevTools (F12)
2. Vérifiez la console pour les erreurs
3. Allez dans Supabase > Table Editor > subscriptions pour voir si les données sont bien insérées

## Support

Pour plus d'informations :
- Documentation Supabase : https://supabase.com/docs
- Documentation Next.js : https://nextjs.org/docs
