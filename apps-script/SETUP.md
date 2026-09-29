# Configuration du backend "invitations personnalisées"

Ceci remplace la liste d'invités par un Google Sheet que vous gérez vous-même, connecté au site via un petit script gratuit (Google Apps Script). Aucun serveur à payer ni à maintenir.

## 1. Créer le Google Sheet

**Modèle : une ligne = un groupe** (une personne seule, un couple, ou une famille qui partage la même invitation), pas une ligne par personne. C'est le nom du groupe qui s'affiche sur l'invitation ; la recherche fonctionne aussi par prénom individuel grâce à la colonne "Noms (recherche)".

1. Allez sur [sheets.google.com](https://sheets.google.com) → nouveau classeur.
2. Renommez l'onglet du bas en **`Invités`** (exactement ce nom, avec l'accent).
3. Sur la ligne 1, entrez ces en-têtes de colonnes, dans cet ordre exact :

   | A | B | C | D | E | F | G | H | I | J | K | L | M | N |
   |---|---|---|---|---|---|---|---|---|---|---|---|---|---|
   | Nom du groupe | Noms (recherche) | Catégorie | Coutumier | Église | Soirée | Commune | Fête uniquement | Nombre de personnes invitées | Email | Statut RSVP | Nombre de personnes confirmées | Nombre d'enfants | Message |

4. À partir de la ligne 2, une ligne par groupe :
   - **Nom du groupe** : ce qui s'affiche sur l'invitation (ex. `Couple Mande`, `Anderson & Mado`, ou juste `Bayo` pour une personne seule).
   - **Noms (recherche)** : les prénoms individuels séparés par des virgules (ex. `Marie Claire, Patrick`), pour que chacun retrouve l'invitation en tapant son propre prénom. Laissez vide si le nom du groupe suffit.
   - **Catégorie** : informatif (Famille, Amis…), non affiché sur le site.
   - **Coutumier / Église / Soirée / Commune** : écrivez exactement `Oui` ou `Non`.
   - **Fête uniquement** : `Oui` ou `Non` — uniquement pertinent si **Soirée** = `Oui`. Si `Oui`, le groupe reçoit un carton dédié "soirée dansante" (00h00, sans le repas) au lieu du carton complet ; sinon `Non` ou vide = réception complète (18h30) comme d'habitude.
   - **Nombre de personnes invitées** : le nombre de places prévues pour ce groupe (pré-remplit le formulaire RSVP, modifiable par l'invité).
   - Les colonnes Email / Statut RSVP / Nombre de personnes confirmées / Nombre d'enfants / Message restent **vides** — elles se remplissent automatiquement à la confirmation.

   Exemple :

   | Nom du groupe | Noms (recherche) | Catégorie | Coutumier | Église | Soirée | Commune | Fête uniquement | Nombre de personnes invitées | ... |
   |---|---|---|---|---|---|---|---|---|---|
   | Couple Mande | Marie Claire, Patrick | Famille | Oui | Oui | Oui | Oui | Non | 2 | ... |
   | Bayo | | Famille (Fiancé) | Oui | Oui | Oui | Oui | Non | 1 | ... |
   | Junior | | Amis | Non | Non | Oui | Non | Oui | 1 | ... |

**Import rapide depuis votre liste existante :** si vous avez déjà un fichier "Répartition invités/événements" (comme celui de test que vous m'avez donné), je peux vous générer un CSV prêt à coller dans ce Sheet, dans ce format exact, à partir de vos données réelles — dites-le-moi.

## 2. Créer le script

1. Dans ce même Google Sheet : menu **Extensions → Apps Script**.
2. Supprimez le contenu par défaut du fichier `Code.gs` qui s'ouvre.
3. Copiez-collez l'intégralité du contenu de [`apps-script/Code.gs`](Code.gs) (dans ce repo) à la place.
4. Récupérez l'**ID de votre Google Sheet** : dans l'URL du Sheet (`https://docs.google.com/spreadsheets/d/`**`CETTE-PARTIE-ICI`**`/edit`), copiez la partie entre `/d/` et `/edit`.
5. Dans le code collé, remplacez la ligne :
   ```js
   var SPREADSHEET_ID = 'COLLEZ_ID_DE_VOTRE_GOOGLE_SHEET';
   ```
   par l'ID copié (entre guillemets).
6. Cliquez sur l'icône disquette (💾) pour enregistrer.

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

## Si vous modifiez le code (Code.gs) après le premier déploiement

Contrairement aux données du Sheet (toujours lues en direct), le **code** du script reste figé à sa version déployée. Après avoir collé une nouvelle version de `Code.gs` :

1. **Déployer → Gérer les déploiements**.
2. Cliquez sur le crayon (✏️) à côté du déploiement existant.
3. En haut, changez **Version** sur **Nouvelle version**.
4. **Déployer**.

L'URL `/exec` reste la même — pas besoin de me la redonner, sauf si vous créez un déploiement complètement nouveau plutôt que d'éditer l'existant.

## Confidentialité

Le script ne renvoie jamais la liste complète des invités au site : une recherche ne renvoie que les prénoms/noms correspondant à ce qui a été tapé (pour la désambiguïsation), et l'invitation détaillée (adresses, statut RSVP...) n'est renvoyée que pour **un seul invité à la fois**, après sélection.

**Verrouillage par email :** en plus du nom, l'invité doit fournir un email pour débloquer son invitation. La **première** adresse utilisée pour une invitation donnée s'enregistre dans la colonne Email et devient la seule acceptée ensuite pour cette même invitation (toute autre adresse est refusée avec un message clair). Ce n'est pas une vérification a priori — rien n'empêche la toute première personne qui tape un nom d'utiliser sa propre adresse — mais ça empêche la consultation répétée par des tiers une fois l'invitation réclamée par le bon invité. Une note est affichée sur le site pour dissuader toute consultation de l'invitation d'quelqu'un d'autre.

## Envoyer l'invitation par email (deuxième template EmailJS)

En plus du template EmailJS existant (qui vous notifie, vous, à chaque RSVP), il en faut un **second**, dédié à l'envoi de l'invitation à l'invité lui-même :

1. Dans votre dashboard EmailJS → **Email Templates** → *Create New Template*.
2. Onglet **Settings** du template → champ **"To Email"** → mettez `{{to_email}}` (une variable, pas une adresse fixe cette fois — c'est ce qui permet d'envoyer à l'adresse de chaque invité). Champ **"Subject"** → `Votre invitation — Eunice & Eugène`.
3. Onglet **Content** → basculez en mode code/HTML → copiez-collez le contenu du `<table>...</table>` de [`emailjs-invitation-template.html`](../emailjs-invitation-template.html) (déjà prêt, aux couleurs du site, variables `{{nom}}` et `{{evenements}}` déjà en place). Pensez à remplacer `VOTRE-DOMAINE` par le vrai domaine du site une fois en ligne (lien "Confirmer ma présence").
4. Notez le **Template ID** de ce nouveau template.
5. Ouvrez `js/invitation.js` et remplacez le placeholder :
   ```js
   var EMAILJS_INVITATION_TEMPLATE_ID = 'COLLEZ_VOTRE_TEMPLATE_INVITATION';
   ```
   par l'ID obtenu.

Tant que ce champ reste un placeholder, l'invitation s'affiche normalement à l'écran mais aucun email n'est envoyé (pas d'erreur visible pour l'invité).

## Repérer les prénoms en double (homonymes)

Le site accepte volontairement une recherche par simple prénom (certains invités n'ont pas de nom de famille connu). Si deux invités différents partagent exactement le même prénom, ils pourraient être confondus à la recherche. Pour vérifier :

1. Ouvrez le projet dans l'éditeur Apps Script.
2. En haut, dans le menu déroulant des fonctions, sélectionnez **`auditDoublonsPrenoms`**.
3. Cliquez sur ▶ **Exécuter**.
4. Retournez dans votre Google Sheet : un nouvel onglet **"Doublons"** apparaît (en bas, à côté de l'onglet "Invités") avec le résultat — la liste des prénoms qui apparaissent dans plusieurs groupes, avec le nom de groupe et le numéro de ligne de chacun.

Cette fonction ne modifie jamais la liste d'invités et n'est jamais appelée par le site — c'est un outil de diagnostic ponctuel, à relancer (même bouton ▶ Exécuter) chaque fois que la liste change ; l'onglet "Doublons" est réécrit à chaque exécution. Pour les prénoms signalés en double, ajoutez le nom de famille dans la colonne "Noms (recherche)" **uniquement pour ces cas-là** (ex. `Marie Kabongo` au lieu de `Marie`) — pas besoin d'y toucher pour tout le monde.
