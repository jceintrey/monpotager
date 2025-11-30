# Configuration de Neon Database avec Netlify

Ce guide explique comment intégrer Neon (PostgreSQL serverless) avec votre application Mon Potager déployée sur Netlify.

## Étapes de configuration

### 1. Créer un compte Neon

1. Allez sur [https://console.neon.tech](https://console.neon.tech)
2. Créez un compte gratuit (0.5GB de stockage inclus)
3. Créez un nouveau projet appelé `monpotager`

### 2. Obtenir la chaîne de connexion

1. Dans le dashboard Neon, cliquez sur votre projet
2. Allez dans **Settings** > **Connection Details**
3. Copiez la **Connection String** (elle ressemble à ceci) :
   ```
   postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

### 3. Initialiser le schéma de base de données

1. Dans le dashboard Neon, allez dans **SQL Editor**
2. Copiez et exécutez le contenu du fichier `netlify/schema.sql`
3. Cliquez sur **Run** pour créer les tables et insérer les données par défaut

### 4. Configurer Netlify

#### 4a. Variables d'environnement sur Netlify

1. Allez sur [https://app.netlify.com](https://app.netlify.com)
2. Sélectionnez votre site `monpotager`
3. Allez dans **Site configuration** > **Environment variables**
4. Cliquez sur **Add a variable**
5. Ajoutez :
   - **Key**: `DATABASE_URL`
   - **Value**: Votre chaîne de connexion Neon (celle copiée à l'étape 2)
   - **Scopes**: Cochez `Production`, `Deploy previews`, et `Branch deploys`
6. Cliquez sur **Create variable**

#### 4b. Intégration automatique (alternative)

Netlify propose une intégration automatique avec Neon :

1. Dans Netlify, allez dans **Integrations**
2. Cherchez **Neon**
3. Cliquez sur **Enable** et suivez les instructions
4. Cette méthode configurera automatiquement la variable `DATABASE_URL`

### 5. Déployer la branche

```bash
# Assurez-vous d'être sur la branche feature/neon-integration
git checkout feature/neon-integration

# Commitez vos changements si nécessaire
git add .
git commit -m "feat: add Neon database integration"

# Poussez la branche sur GitHub
git push origin feature/neon-integration
```

### 6. Tester en local (optionnel)

Pour tester l'intégration en local avant de déployer :

1. Créez un fichier `.env` à la racine du projet :
   ```bash
   cp .env.example .env
   ```

2. Modifiez `.env` et ajoutez votre chaîne de connexion :
   ```
   DATABASE_URL=postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

3. Installez Netlify CLI si ce n'est pas déjà fait :
   ```bash
   npm install -g netlify-cli
   ```

4. Démarrez le serveur de développement Netlify :
   ```bash
   netlify dev
   ```

5. Ouvrez votre navigateur sur `http://localhost:8888`

### 7. Vérifier le déploiement

1. Une fois la branche poussée, Netlify créera automatiquement un **deploy preview**
2. Vous recevrez un lien comme `https://deploy-preview-X--monpotager.netlify.app`
3. Testez l'application pour vérifier que :
   - Les légumes s'affichent correctement
   - Vous pouvez ajouter/modifier/supprimer des légumes
   - Les récoltes fonctionnent
   - Les données persistent après rafraîchissement

### 8. Fusionner en production

Une fois que tout fonctionne :

```bash
# Retournez sur la branche main
git checkout main

# Fusionnez la branche feature
git merge feature/neon-integration

# Poussez sur GitHub
git push origin main
```

Netlify déploiera automatiquement la nouvelle version en production.

## Architecture

L'application utilise maintenant :

- **Frontend**: Angular 21 (client-side)
- **API**: Netlify Functions (serverless TypeScript)
- **Database**: Neon PostgreSQL (serverless)
- **Hosting**: Netlify

### Flux de données

```
Angular App → Netlify Function → Neon Database
     ↑              ↓
  Browser      HTTP/JSON
```

## Endpoints API

- `GET /api/vegetables` - Liste tous les légumes
- `POST /api/vegetables` - Crée/met à jour un légume
- `DELETE /api/vegetables` - Supprime un légume
- `GET /api/harvests` - Liste toutes les récoltes
- `POST /api/harvests` - Crée une récolte
- `DELETE /api/harvests/:id` - Supprime une récolte

## Avantages de cette architecture

✅ **Données persistantes** : Les données sont stockées dans une vraie base de données
✅ **Multi-appareil** : Accédez à vos données depuis n'importe quel appareil
✅ **Gratuit** : Neon offre 0.5GB gratuit, largement suffisant pour cette app
✅ **Serverless** : Pas de serveur à gérer, tout est automatique
✅ **Scalable** : La base de données s'adapte automatiquement à la charge
✅ **Sécurisé** : Les credentials ne sont jamais exposés côté client

## Dépannage

### Erreur "Internal server error"

- Vérifiez que la variable `DATABASE_URL` est bien configurée dans Netlify
- Vérifiez les logs dans Netlify : **Functions** > Sélectionnez une fonction > **Logs**

### Erreur de connexion à la base de données

- Vérifiez que votre chaîne de connexion est correcte
- Vérifiez que votre projet Neon est actif (les projets inactifs peuvent être mis en pause)

### Les données ne persistent pas

- Vérifiez que vous utilisez bien l'API et non localStorage
- Ouvrez la console du navigateur pour voir les erreurs réseau

## Migration des données localStorage

Si vous avez déjà des données dans localStorage et souhaitez les migrer vers Neon :

1. Exportez vos données via la page **Import/Export**
2. Téléchargez le fichier Excel
3. Une fois Neon configuré, importez le fichier via la même page
4. Les données seront automatiquement envoyées à la base de données Neon

## Support

Pour toute question ou problème :
- Consultez la [documentation Neon](https://neon.tech/docs)
- Consultez la [documentation Netlify Functions](https://docs.netlify.com/functions/overview/)
