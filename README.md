# 🌿 GreenCarbon

GreenCarbon est une application web permettant aux utilisateurs de **suivre leur empreinte carbone** quotidienne en fonction de leurs dépenses, et aux administrateurs de **gérer les comptes** utilisateurs via une interface dédiée.

---

## ✨ Fonctionnalités principales

### 👤 Utilisateur
- Création de compte et connexion sécurisée
- Formulaire de saisie des dépenses (montant, catégorie, date)
- Calcul automatique des émissions CO₂
- Graphiques visuels avec [Chart.js](https://www.chartjs.org/)
- Recommandations personnalisées pour réduire l’impact
- Page d’accueil simple et engageante

### 🔐 Administrateur
- Détection automatique du rôle admin après connexion
- Tableau de bord listant tous les utilisateurs
- Suppression de comptes
- Protection des routes sensibles (`/all-users`, `/delete-user`)

---

## 🧰 Stack technique

- **Frontend** : HTML, CSS, JavaScript Vanilla
- **Backend** : Node.js, Express.js
- **Base de données** : MySQL
- **Sécurité** : Hash de mots de passe avec `bcryptjs`
- **Graphiques** : Chart.js

---

## 🚀 Lancer le projet en local

### 🔧 Prérequis :
- Node.js installé
- MySQL installé et configuré

### 📦 Installer les dépendances :
```bash
npm install
