# Configuration du backend "invitations personnalisées"

Ceci remplace la liste d'invités par un Google Sheet que vous gérez vous-même, connecté au site via un petit script gratuit (Google Apps Script). Aucun serveur à payer ni à maintenir.

## 1. Créer le Google Sheet

1. Allez sur [sheets.google.com](https://sheets.google.com) → nouveau classeur.
2. Renommez l'onglet du bas en **`Invités`** (exactement ce nom, avec l'accent).
3. Sur la ligne 1, entrez ces en-têtes de colonnes, dans cet ordre exact :

   | A | B | C | D | E | F | G | H | I | J |
   |---|---|---|---|---|---|---|---|---|---|
   | Prénom | Nom | Civil | Religieuse | Réception | Email | Statut RSVP | Nombre de personnes | Nombre d'enfants | Message |

4. À partir de la ligne 2, ajoutez une ligne par invité. Pour les colonnes **Civil / Religieuse / Réception**, écrivez exactement `Oui` ou `Non` selon les événements auxquels chaque personne est conviée.

   Exemple :

   | Prénom | Nom | Civil | Religieuse | Réception | Email | Statut RSVP | Nombre de personnes | Nombre d'enfants | Message |
   |---|---|---|---|---|---|---|---|---|---|
   | Jean | Mbayo | Non | Oui | Oui | | | | | |
   | Marie | Mbayo | Non | Oui | Non | | | | | |

   Les colonnes Email / Statut RSVP / Nombre de personnes / Nombre d'enfants / Message restent **vides** — elles se remplissent automatiquement quand l'invité confirme sa présence sur le site.

## 2. Créer le script

1. Dans ce même Google Sheet : menu **Extensions → Apps Script**.
2. Supprimez le contenu par défaut du fichier `Code.gs` qui s'ouvre.
3. Copiez-collez l'intégralité du contenu de [`apps-script/Code.gs`](Code.gs) (dans ce repo) à la place.
4. Cliquez sur l'icône disquette (💾) pour enregistrer.

## 3. Déployer en Web App

1. En haut à droite : **Déployer → Nouveau déploiement**.
2. Cliquez sur l'icône ⚙️ à côté de "Sélectionner le type" → choisissez **Application Web**.
3. Réglages :
   - **Exécuter en tant que** : Moi (votre compte)
   - **Qui a accès** : **Tout le monde** *(indispensable — sinon le site ne pourra jamais contacter le script)*
4. Cliquez sur **Déployer**.
5. Google vous demandera d'autoriser le script à accéder à votre Google Sheet — acceptez (c'est votre propre script, sur votre propre fichier).
6. Copiez l'**URL de l'application Web** affichée (elle ressemble à `https://script.google.com/macros/s/AKfycb.../exec`).

## 4. Connecter le site

Donnez-moi cette URL, je la colle dans `js/invitation.js` (constante `APPS_SCRIPT_URL`) à la place du placeholder, et l'invitation personnalisée sera fonctionnelle.

## Pour modifier la liste plus tard

Ouvrez simplement le Google Sheet et éditez les lignes — ajout d'invité, changement d'événements invités, etc. Aucune republication du script n'est nécessaire pour ces changements (seul un changement du **code** du script demanderait un nouveau déploiement).

## Confidentialité

Le script ne renvoie jamais la liste complète des invités au site : une recherche ne renvoie que les prénoms/noms correspondant à ce qui a été tapé (pour la désambiguïsation), et l'invitation détaillée (adresses, statut RSVP...) n'est renvoyée que pour **un seul invité à la fois**, après sélection.
