# MonPotager - Docker Deployment

## Architecture

Cette application utilise Docker Compose avec 2 containers :

- **db** : PostgreSQL 15 (base de données)
- **app** : Node.js + Express (API backend) + Angular (frontend)

## Installation

### Prérequis

- Docker et Docker Compose installés
- Port 3000 et 5432 disponibles

### Démarrage

```bash
# Démarrer les containers
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les containers
docker-compose down

# Arrêter et supprimer les volumes (ATTENTION : supprime les données)
docker-compose down -v
```

### Accès

- **Application** : http://localhost:3000
- **Base de données** : localhost:5432
  - User: `monpotager`
  - Password: `monpotager_dev_password`
  - Database: `monpotager`

## Développement

### Reconstruire l'image après modifications

```bash
docker-compose up --build
```

### Accéder à la base de données

```bash
# Via Docker
docker-compose exec db psql -U monpotager

# Via client local (si psql installé)
psql postgresql://monpotager:monpotager_dev_password@localhost:5432/monpotager
```

### Voir les logs

```bash
# Tous les services
docker-compose logs -f

# Seulement l'app
docker-compose logs -f app

# Seulement la DB
docker-compose logs -f db
```

## Migrations de base de données

Les fichiers SQL dans `database/migrations/` sont automatiquement exécutés au démarrage du container PostgreSQL (uniquement à la première initialisation).

Pour ré-initialiser la base de données :

```bash
# Supprimer les volumes et redémarrer
docker-compose down -v
docker-compose up -d
```

## Production

Pour un déploiement en production :

1. Modifier les mots de passe dans `docker-compose.yml`
2. Utiliser un volume externe ou un service PostgreSQL managé
3. Configurer un reverse proxy (Nginx/Traefik) avec HTTPS
4. Utiliser `docker-compose -f docker-compose.prod.yml up -d`

## Volumes

- `postgres_data` : Données de la base (persistantes)
- `uploads` : Images uploadées (persistantes)

## Variables d'environnement

Voir `.env.example` pour la configuration.
