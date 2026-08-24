# Configuration du backend "invitations personnalisées"

Ceci remplace la liste d'invités par un Google Sheet que vous gérez vous-même, connecté au site via un petit script gratuit (Google Apps Script). Aucun serveur à payer ni à maintenir.

## 1. Créer le Google Sheet

**Modèle : une ligne = un groupe** (une personne seule, un couple, ou une famille qui partage la même invitation), pas une ligne par personne. C'est le nom du groupe qui s'affiche sur l'invitation ; la recherche fonctionne aussi par prénom individuel grâce à la colonne "Noms (recherche)".

1. Allez sur [sheets.google.com](https://sheets.google.com) → nouveau classeur.
2. Renommez l'onglet du bas en **`Invités`** (exactement ce nom, avec l'accent).
3. Sur la ligne 1, entrez ces en-têtes de colonnes, dans cet ordre exact :

   | A | B | C | D | E | F | G | H | I | J | K | L | M |
   |---|---|---|---|---|---|---|---|---|---|---|---|---|
   | Nom du groupe | Noms (recherche) | Catégorie | Coutumier | Église | Soirée | Commune | Nombre de personnes invitées | Email | Statut RSVP | Nombre de personnes confirmées | Nombre d'enfants | Message |

4. À partir de la ligne 2, une ligne par groupe :
   - **Nom du groupe** : ce qui s'affiche sur l'invitation (ex. `Couple Mande`, `Anderson & Mado`, ou juste `Bayo` pour une personne seule).
   - **Noms (recherche)** : les prénoms individuels séparés par des virgules (ex. `Marie Claire, Patrick`), pour que chacun retrouve l'invitation en tapant son propre prénom. Laissez vide si le nom du groupe suffit.
   - **Catégorie** : informatif (Famille, Amis…), non affiché sur le site.
   - **Coutumier / Église / Soirée / Commune** : écrivez exactement `Oui` ou `Non`.
   - **Nombre de personnes invitées** : le nombre de places prévues pour ce groupe (pré-remplit le formulaire RSVP, modifiable par l'invité).
   - Les colonnes Email / Statut RSVP / Nombre de personnes confirmées / Nombre d'enfants / Message restent **vides** — elles se remplissent automatiquement à la confirmation.

   Exemple :

   | Nom du groupe | Noms (recherche) | Catégorie | Coutumier | Église | Soirée | Commune | Nombre de personnes invitées |
   |---|---|---|---|---|---|---|---|
   | Couple Mande | Marie Claire, Patrick | Famille | Oui | Oui | Oui | Oui | 2 |
   | Bayo | | Famille (Fiancé) | Oui | Oui | Oui | Oui | 1 |

**Import rapide depuis votre liste existante :** si vous avez déjà un fichier "Répartition invités/événements" (comme celui de test que vous m'avez donné), je peux vous générer un CSV prêt à coller dans ce Sheet, dans ce format exact, à partir de vos données réelles — dites-le-moi.

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
