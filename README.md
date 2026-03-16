# Pharmacy Backend

Backend Node.js/Express pour la gestion de pharmacies, des médicaments et des stocks, avec authentification JWT et calcul de distance entre l'utilisateur et les pharmacies.

Ce projet permet notamment de :

- authentifier des utilisateurs avec JWT
- gérer deux rôles : `ADMIN` et `PHARMACY`
- créer des pharmacies depuis un compte administrateur
- créer automatiquement un utilisateur pharmacien lors de la création d'une pharmacie
- gérer les médicaments et le stock d'une pharmacie
- rechercher des médicaments disponibles dans les pharmacies
- calculer la distance entre l'utilisateur et les pharmacies avec la formule de Haversine
- trier les pharmacies du plus proche au plus loin

## 1. Présentation du projet

L'objectif de ce backend est de fournir une API REST simple pour une application de recherche et de gestion de pharmacies.

Le serveur :

- expose des routes d'authentification
- protège certaines routes avec un token JWT
- limite l'accès selon le rôle de l'utilisateur
- stocke les données dans PostgreSQL via Sequelize
- insère des données de démonstration au démarrage

Le projet a été pensé pour être facile à lancer localement, même si vous n'avez pas l'habitude des projets backend.

## 2. Technologies utilisées

- Node.js
- Express.js
- PostgreSQL
- Sequelize
- JWT pour l'authentification
- bcryptjs pour le hash des mots de passe
- cors
- dotenv
- nodemon pour le développement

## 3. Installation du projet

### Prérequis

Avant de commencer, installez :

- Node.js 18 ou plus récent
- npm
- PostgreSQL 14 ou plus récent

### Étapes d'installation

1. Cloner le projet :

```bash
git clone <url-du-repo>
cd pharmacy-backend
```

2. Installer les dépendances :

```bash
npm install
```

3. Créer le fichier `.env` à la racine du projet.

4. Configurer PostgreSQL avec les informations décrites plus bas.

5. Démarrer le serveur :

```bash
npm run dev
```

ou en mode normal :

```bash
npm start
```

Une fois lancé, le backend est disponible par défaut sur :

```text
http://localhost:5000
```

Vous pouvez tester rapidement l'API avec :

```text
GET http://localhost:5000/api/health
```

Réponse attendue :

```json
{
  "status": "ok"
}
```

## 4. Configuration de la base de données PostgreSQL

### Étape 1 : créer une base de données

Connectez-vous à PostgreSQL avec `psql`, pgAdmin, DBeaver ou un autre outil, puis créez la base :

```sql
CREATE DATABASE pharmacy_db;
```

### Étape 2 : créer un utilisateur PostgreSQL si nécessaire

Si vous n'avez pas encore d'utilisateur dédié :

```sql
CREATE USER admin WITH PASSWORD 'admin';
GRANT ALL PRIVILEGES ON DATABASE pharmacy_db TO admin;
```

Vous pouvez aussi utiliser votre propre utilisateur PostgreSQL existant. Dans ce cas, adaptez simplement les variables du fichier `.env`.

### Étape 3 : vérifier la connexion

Le backend utilise ces variables pour se connecter :

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

Au démarrage, Sequelize :

- teste la connexion à PostgreSQL
- crée automatiquement les tables si elles n'existent pas encore
- lance le seed de données de démonstration

## 5. Variables d'environnement (.env)

Créez un fichier `.env` à la racine du projet avec ce contenu :

```env
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=pharmacy_db
DB_USER=admin
DB_PASSWORD=admin

JWT_SECRET=change_me_super_secret

FORCE_SEED=false
```

### Description des variables

- `PORT` : port du serveur Express
- `DB_HOST` : hôte PostgreSQL
- `DB_PORT` : port PostgreSQL
- `DB_NAME` : nom de la base de données
- `DB_USER` : utilisateur PostgreSQL
- `DB_PASSWORD` : mot de passe PostgreSQL
- `JWT_SECRET` : clé utilisée pour signer les tokens JWT
- `FORCE_SEED` : si `true`, supprime les données existantes puis réinsère les données de démonstration

### Important à propos du seed

Au premier démarrage, le projet insère automatiquement des pharmacies, des médicaments, du stock et des comptes de test.

Si des utilisateurs existent déjà en base, le seed est ignoré pour éviter les doublons.

Si vous voulez réinsérer les données de test après une modification du fichier `backend/data.js`, mettez temporairement :

```env
FORCE_SEED=true
```

Puis redémarrez le serveur.

Ensuite, remettez `FORCE_SEED=false` pour éviter de réinitialiser les données à chaque lancement.

## 6. Commandes pour démarrer le serveur

### Mode développement

Redémarrage automatique avec nodemon :

```bash
npm run dev
```

### Mode normal

```bash
npm start
```

### Vérifier que le serveur fonctionne

```bash
curl http://localhost:5000/api/health
```

## 7. Structure du projet

```text
pharmacy-backend/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   └── pharmacyController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   ├── models/
│   │   ├── Medecine.js
│   │   ├── MedicineStock.js
│   │   ├── Pharmacy.js
│   │   └── User.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── pharmacy.js
│   │   └── search.js
│   ├── utils/
│   │   └── distance.js
│   ├── data.js
│   └── server.js
├── postman/
│   └── pharmacy-backend.postman_collection.json
├── package.json
└── README.md
```

### Rôle des dossiers principaux

- `config/` : connexion à la base PostgreSQL
- `controllers/` : logique métier des routes
- `middleware/` : sécurité JWT et contrôle des rôles
- `models/` : modèles Sequelize
- `routes/` : définition des endpoints API
- `utils/` : fonctions utilitaires comme le calcul de distance
- `data.js` : données de démonstration injectées au démarrage

## 8. Description des principales routes API

Base URL locale :

```text
http://localhost:5000/api
```

### Authentification

#### POST `/auth/login`

Permet de se connecter et de récupérer un token JWT.

Exemple de body :

```json
{
  "email": "admin@pharma.ci",
  "password": "admin123"
}
```

Réponse :

```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "email": "admin@pharma.ci",
    "role": "ADMIN",
    "pharmacyId": null
  }
}
```

### Administration des pharmacies

Ces routes nécessitent :

- un token JWT valide
- un utilisateur avec le rôle `ADMIN`

#### GET `/admin/pharmacies`

Retourne la liste des pharmacies.

#### POST `/admin/pharmacies`

Crée une pharmacie et crée automatiquement un utilisateur pharmacien associé.

Exemple de body :

```json
{
  "name": "Pharmacie Angre 7e Tranche",
  "email": "angre@pharma.ci",
  "latitude": 5.41,
  "longitude": -3.96
}
```

Réponse :

```json
{
  "pharmacy": {
    "id": 7,
    "name": "Pharmacie Angre 7e Tranche",
    "address": "",
    "email": "angre@pharma.ci",
    "latitude": 5.41,
    "longitude": -3.96
  },
  "pharmacistUser": {
    "id": 8,
    "email": "angre@pharma.ci",
    "role": "PHARMACY",
    "temporaryPassword": "<mot-de-passe-temporaire>"
  }
}
```

#### PUT `/admin/pharmacies/:id`

Met à jour une pharmacie.

#### DELETE `/admin/pharmacies/:id`

Supprime une pharmacie et l'utilisateur pharmacien associé.

### Gestion des médicaments et du stock

Ces routes nécessitent :

- un token JWT valide
- un rôle `ADMIN` ou `PHARMACY`

#### GET `/pharmacy/:id/medicines`

Liste les médicaments d'une pharmacie avec leur stock.

#### POST `/pharmacy/:id/medicines`

Ajoute un médicament à une pharmacie ou met à jour son stock s'il existe déjà.

Exemple de body :

```json
{
  "name": "Doliprane",
  "stock": 25
}
```

#### PATCH `/pharmacy/:id/medicines/:medicineId`

Met à jour le stock d'un médicament dans une pharmacie.

Exemple de body :

```json
{
  "stock": 40
}
```

#### DELETE `/pharmacy/:id/medicines/:medicineId`

Supprime un médicament du stock d'une pharmacie.

### Recherche de médicaments

#### GET `/search`

Recherche les pharmacies et leurs médicaments. Si les coordonnées utilisateur sont fournies, l'API calcule la distance et trie les pharmacies de la plus proche à la plus lointaine.

Paramètres possibles :

- `medicine` : nom ou partie du nom du médicament recherché
- `userLat` : latitude de l'utilisateur
- `userLng` : longitude de l'utilisateur

Exemple :

```text
GET /api/search?medicine=para&userLat=5.35&userLng=-4.01
```

Exemple de réponse :

```json
[
  {
    "id": 1,
    "name": "Pharmacie Cocody Saint Jean",
    "lat": 5.354,
    "lng": -3.9815,
    "medicines": [
      {
        "id": 1,
        "name": "Paracetamol",
        "stock": 50
      }
    ],
    "distanceKm": 3.2
  }
]
```

## 9. Comptes de test

Le fichier de seed crée automatiquement les comptes suivants :

### Compte administrateur

- Email : `admin@pharma.ci`
- Mot de passe : `admin123`
- Rôle : `ADMIN`

### Comptes pharmacie

- Email : `cocody@pharma.ci`
- Mot de passe : `pharmacy123`
- Rôle : `PHARMACY`

- Email : `riviera@pharma.ci`
- Mot de passe : `pharmacy123`
- Rôle : `PHARMACY`

## Exemple rapide d'utilisation

### 1. Se connecter en admin

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pharma.ci","password":"admin123"}'
```

### 2. Copier le token reçu

Le token retourné doit ensuite être envoyé dans l'en-tête :

```text
Authorization: Bearer <token>
```

### 3. Créer une pharmacie

```bash
curl -X POST http://localhost:5000/api/admin/pharmacies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"Pharmacie Bingerville","email":"bingerville@pharma.ci","latitude":5.35,"longitude":-3.89}'
```

## Collection Postman

Une collection Postman est disponible dans le dossier suivant :

- `postman/pharmacy-backend.postman_collection.json`

Elle peut être importée dans Postman pour tester rapidement les endpoints.

## Conseils en cas de problème au démarrage

Si le serveur ne démarre pas :

1. Vérifiez que PostgreSQL est bien lancé.
2. Vérifiez que la base `pharmacy_db` existe.
3. Vérifiez que les valeurs du fichier `.env` sont correctes.
4. Vérifiez que le port `5000` n'est pas déjà utilisé.
5. Si vous avez modifié `backend/data.js`, relancez avec `FORCE_SEED=true`.

## Licence

Projet distribué sans licence spécifique définie pour le moment.