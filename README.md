# Site de mariage — Eunice & Eugène

Site HTML/CSS/JS pur (aucun framework, aucun build, aucune dépendance à installer). 21 novembre 2026 — Andenne (cérémonies) & Charleroi (réception).

## Structure du projet

```
site-mariage-eunice-eugene/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── countdown.js    → compte à rebours
│   ├── gallery.js      → galerie + lightbox
│   ├── invitation.js   → recherche d'invité + invitation personnalisée + RSVP
│   ├── music.js        → musique de fond (YouTube caché) + bouton flottant
│   └── nav.js          → menu mobile
├── images/              → photos optimisées + logo.svg
├── apps-script/
│   ├── Code.gs          → backend Google Apps Script (API du Google Sheet invités)
│   └── SETUP.md         → guide pas-à-pas : créer le Sheet + déployer le script
├── emailjs-template.html → template email "notification RSVP" (vers vous) à coller dans EmailJS
├── emailjs-invitation-template.html → template email "invitation" (vers l'invité) à coller dans EmailJS
└── README.md
```

## Ouvrir et modifier le site dans VS Code

1. Ouvrez le dossier `site-mariage-eunice-eugene` dans VS Code (`File > Open Folder…`).
2. Installez l'extension **Live Server** (Ritwick Dey) depuis l'onglet Extensions.
3. Clic droit sur `index.html` → **Open with Live Server**. Le site s'ouvre dans votre navigateur et se recharge automatiquement à chaque modification.
4. Tout le texte est directement dans `index.html` (sections commentées) : noms, adresses, horaires, textes. Les couleurs et polices sont dans `css/style.css` (variables en haut du fichier, sous `:root`).

Aucune commande `npm install` ni build n'est nécessaire — vous éditez les fichiers, vous rechargez la page, c'est tout.

## À FAIRE avant mise en ligne (TODO)

Le site contient volontairement des placeholders explicites à remplacer :

- [x] **Google Sheet + Apps Script** : backend déployé et connecté (`APPS_SCRIPT_URL` dans `js/invitation.js`), testé de bout en bout.
- [x] **EmailJS (notification RSVP)** : configuré.
- [x] **Adresses, horaires, parking** des 3 cérémonies (civile, religieuse, réception) : renseignés dans `js/invitation.js` (objet `EVENTS`), repris du carton d'invitation officiel — y compris l'itinéraire à pied depuis le Parking Charleroi Expo pour la réception.
- [ ] **Cérémonie coutumière** : toujours « à confirmer » (objet `EVENTS`, clé `coutumier`) — aucune adresse/horaire ne figurait sur le carton d'invitation fourni. Si elle a lieu séparément, dites-moi les détails ou laissez `Oui`/`Non` à jour dans le Google Sheet selon les groupes concernés.
- [ ] **EmailJS (envoi de l'invitation à l'invité)** : créer un second template (voir `apps-script/SETUP.md`) et coller son ID dans `EMAILJS_INVITATION_TEMPLATE_ID` (`js/invitation.js`). Sans ça, le téléchargement image/PDF fonctionne quand même, mais l'email n'est pas envoyé.
- [ ] **Email de contact** : remplacer `VOTRE-EMAIL@a-remplacer.be` dans `index.html` (section `#contact`) par votre adresse définitive, une fois créée avec le domaine.
- [ ] **Section cadeaux** : à personnaliser ou remplacer par un lien de liste de mariage si vous en créez une.
- [ ] **Nom de domaine final** (voir section DNS ci-dessous) — pensez aussi à remplacer `VOTRE-DOMAINE` dans `emailjs-invitation-template.html` une fois choisi.

## Photos : méthode utilisée et pourquoi

**Méthode choisie : vraies images dans le dossier `images/`, référencées par chemin relatif** (`<img src="images/hero.jpg">`), **pas de base64**.

Pourquoi pas le base64 : vous avez 9 photos (~1,3 Mo au total après compression). Encoder ça en base64 dans le HTML l'aurait gonflé de ~30 %, aurait empêché la mise en cache navigateur de chaque image séparément, et aurait rendu le fichier `index.html` illisible/impossible à modifier facilement. Le base64 n'a de sens que pour 1-2 toutes petites icônes.

Vos 9 photos originales (`/Users/eunice_mutope/Documents/Claude/photos-mariage/`) ont été **converties en JPEG, redimensionnées et compressées** (max ~1000-1400 px de large, qualité ~60-65 %) et copiées dans `images/`. Elles s'affichent déjà réellement dans `index.html` — ce n'est pas un placeholder.

**Comment ça reste valide une fois hébergé sur Hostinger :**
1. Uploadez tout le dossier `site-mariage-eunice-eugene` (avec son sous-dossier `images/`) dans `public_html/` via le gestionnaire de fichiers Hostinger ou FTP.
2. Gardez la même structure de dossiers (`images/` doit rester au même niveau que `index.html`). Comme les chemins sont relatifs, **rien à changer dans le code** — les photos s'afficheront à l'identique en ligne.

Si vous ajoutez d'autres photos plus tard : compressez-les d'abord (max ~1500 px de large, JPEG qualité 60-70) avant de les déposer dans `images/`, pour garder un site rapide.

## Invitations personnalisées : architecture

Plutôt qu'un site public affichant les adresses/horaires à n'importe qui, le site propose **deux parcours séparés**, tous deux basés sur une recherche par prénom (ou nom de groupe/famille) :

1. **« Recevoir mon invitation »** (section *Votre invitation*) : nom + email → l'invitation part par email, elle **ne s'affiche jamais comme texte sur le site**. Les boutons télécharger image/PDF génèrent le fichier à partir d'un rendu hors-écran, jamais montré à l'écran — aucune adresse ni horaire n'apparaît donc en clair sur la page.
2. **« Confirmer ma présence »** (section *RSVP*) : nom seul (menu déroulant si plusieurs correspondances) → formulaire de confirmation minimal (présence, nombre de personnes, enfants, message) — sans jamais réafficher les événements ni l'email. Le nombre de personnes qui confirment est plafonné au nombre réellement invité pour ce groupe (vérifié aussi côté serveur, pas seulement dans le formulaire).

Un couple ou une famille invités ensemble partagent la même invitation, retrouvable sous le nom du groupe (ex. « Couple Mande ») ou le prénom de chacun de ses membres.

**Ce que ça implique techniquement :** garder une liste de ~157 groupes/305 personnes confidentielle (qui est invité à quoi) n'est pas possible avec du HTML/CSS/JS 100 % statique — un fichier JS public serait lisible par n'importe qui via le code source. Le site s'appuie donc sur un petit backend gratuit :

- **Google Sheet** : la liste d'invités (un groupe par ligne — personne seule, couple, ou famille), que vous éditez vous-même comme un tableau normal.
- **Google Apps Script** : un petit script (gratuit, pas de serveur à payer) qui expose ce Sheet au site sous forme d'API — recherche par nom, déblocage d'une invitation, enregistrement d'une réponse RSVP.
- Le script ne renvoie **jamais** la liste complète : une recherche ne renvoie que les noms correspondant à ce qui a été tapé, et le détail d'une invitation n'est renvoyé que pour le groupe sélectionné.

**Protection par email (verrouillage au premier envoi) :** en plus du nom, l'invité doit fournir un email pour débloquer son invitation. La première adresse utilisée pour une invitation donnée devient la seule acceptée ensuite — toute autre adresse est refusée. Ce n'est pas une vérification a priori (rien n'empêche la toute première personne à taper un nom d'utiliser sa propre adresse), d'où la note affichée sur le site invitant chacun à ne consulter que sa propre invitation. Détails dans [`apps-script/SETUP.md`](apps-script/SETUP.md).

**Configuration complète (Sheet + script + déploiement) : voir [`apps-script/SETUP.md`](apps-script/SETUP.md).** Une fois l'URL du script obtenue, collez-la dans `js/invitation.js` (`APPS_SCRIPT_URL`, en haut du fichier).

### Réception de l'invitation : email, image, PDF (jamais à l'écran)

Une fois nom + email validés (première adresse = verrouillage définitif pour ce groupe) :
- Une copie complète (avec les événements) est envoyée par email à l'adresse fournie (second template EmailJS dédié — voir SETUP.md).
- L'invité peut aussi la télécharger en **image (PNG)** ou en **PDF** directement depuis la page. La génération se fait côté navigateur (html2canvas + jsPDF) à partir d'un élément construit hors de l'écran visible, jamais rendu à l'écran — donc jamais lisible en clair sur le site, même par la personne qui vient de faire la demande.

### RSVP séparé, plafonné au nombre de places invitées

La confirmation de présence est un parcours à part (section *RSVP*, nom seul) qui ne redemande pas l'email et ne réaffiche jamais les événements — seulement : présence, nombre de personnes (avec un maximum = nombre de personnes invitées pour ce groupe, appliqué à la fois dans le formulaire et vérifié côté serveur au moment de l'enregistrement), enfants, message. À la soumission, deux choses se passent en parallèle (indépendantes — si l'une échoue, l'autre peut quand même réussir) :

1. La réponse est enregistrée dans le Google Sheet (colonnes Statut RSVP / Nombre de personnes / Nombre d'enfants / Message de la ligne correspondante).
2. Une notification est envoyée par email via [EmailJS](https://www.emailjs.com) (déjà configuré dans `js/invitation.js` avec vos identifiants existants) pour être prévenu instantanément.

### Newsletter (mises à jour + photos après le mariage)

Le champ email collecté dans l'invitation personnalisée atterrit dans la colonne **Email** du Google Sheet — c'est votre liste de diffusion. Pour envoyer une mise à jour groupée (changement d'horaire, lien des photos après le mariage), **exportez cette colonne** et importez-la dans un outil d'emailing gratuit le moment venu (Mailchimp ou Brevo, gratuits jusqu'à plusieurs centaines de contacts). Je n'ai pas construit d'envoi de masse automatique dans ce projet — c'est un besoin ponctuel (quelques fois avant/après le mariage), pas quelque chose qui justifie de le complexifier davantage ; dites-moi si vous voulez que je l'ajoute quand même.

### Template email stylé (habillage visuel de la notification reçue)

Le fichier [emailjs-template.html](emailjs-template.html) contient un template HTML habillé aux couleurs du site plutôt qu'un email texte brut. Pour l'utiliser : ouvrez votre template EmailJS → onglet **Content** → basculez en mode code/HTML → copiez-collez le contenu du `<table>...</table>` de ce fichier. Le fichier n'est pas utilisé par le site lui-même, uniquement comme source à coller dans EmailJS.

## Nom de domaine et configuration DNS

Vous hésitiez entre un monogramme stylisé (« E-O-carré ») et `eunice-et-eugene` : un nom de domaine ne peut contenir que des lettres, chiffres et tirets (pas de « & », « ² » ou espaces). Le monogramme peut rester un élément visuel/logo dans le design (déjà présent dans le header : `E & E`), mais pour l'URL, `eunice-et-eugene.be` (ou une variante proche, ex. `eunice-eugene.be`) est le choix le plus lisible et mémorisable pour vos invités. Vérifiez sa disponibilité sur Hostinger avant d'acheter.

Le code du site (`index.html`) n'a besoin d'**aucune modification** selon le choix de domaine — seule la configuration DNS/hébergement change.

### Option A — Sous-domaine gratuit (`mariage.eunice-mutope-nkongolo.be`)

Cela suppose que `eunice-mutope-nkongolo.be` est un domaine que vous possédez déjà chez Hostinger.

1. Connectez-vous à **hPanel** (Hostinger) → **Domaines** → sélectionnez `eunice-mutope-nkongolo.be`.
2. Allez dans **Sous-domaines** → créez `mariage` comme nom de sous-domaine.
3. Hostinger crée automatiquement un dossier dédié, généralement `public_html/mariage/`.
4. Uploadez le contenu du dossier `site-mariage-eunice-eugene` (index.html, css/, js/, images/) directement dans ce dossier `public_html/mariage/` (le contenu, pas le dossier parent lui-même).
5. Propagation DNS : en général quasi instantanée en interne chez Hostinger (sous-domaine sur domaine déjà actif chez eux), parfois jusqu'à quelques heures.
6. Résultat : `https://mariage.eunice-mutope-nkongolo.be`.

### Option B — Domaine dédié acheté (ex. `eunice-et-eugene.be`, ~12 €/an)

1. Dans hPanel → **Domaines** → **Acheter un nouveau domaine**, recherchez `eunice-et-eugene.be`, achetez-le (il sera lié automatiquement au même compte Hostinger).
2. Si l'hébergement web est sur le même compte Hostinger : le domaine est en général **connecté automatiquement** à votre hébergement (nameservers déjà pointés vers Hostinger, `ns1.dns-parking.com` / `ns2.dns-parking.com` ou équivalents Hostinger).
3. hPanel → **Domaines** → **eunice-et-eugene.be** → assurez-vous qu'il est bien assigné à votre hébergement (menu "Gérer" → vérifier que le domaine pointe vers votre plan d'hébergement, pas seulement enregistré).
4. Créez le dossier `public_html/` s'il ne correspond pas déjà à la racine du domaine, et uploadez-y le contenu de `site-mariage-eunice-eugene`.
5. Si le domaine a été acheté **ailleurs** (autre registrar) et que seul l'hébergement est chez Hostinger : chez le registrar, changez les **nameservers (NS)** vers ceux fournis par Hostinger (visibles dans hPanel → Hébergement → Détails de l'hébergement), typiquement de la forme `ns1.hostinger.com` / `ns2.hostinger.com`. Propagation DNS : jusqu'à 24–48h.
6. Résultat : `https://eunice-et-eugene.be` (pensez à activer le certificat SSL gratuit dans hPanel → Sécurité → SSL, généralement automatique chez Hostinger).

## Poids de page

- Polices Google Fonts (`Cormorant Garamond` + `Jost`, ~30 Ko), avec repli sur polices système si indisponible.
- 9 photos compressées : ~1,3 Mo au total.
- Code natif uniquement pour le site lui-même (~6 Ko de JS).
- Quelques librairies externes légères chargées via CDN pour des fonctionnalités précises (EmailJS, QR code cadeaux, lecteur musique YouTube) plus **html2canvas + jsPDF** (~200 Ko à elles deux) pour le téléchargement image/PDF de l'invitation — chargées une seule fois, mises en cache par le navigateur après la première visite.

## Vérification responsive

Testé et validé sur trois largeurs : 375px (mobile), 768px (tablette), 1280px (desktop) — voir le récapitulatif fourni avec la livraison. Aucun débordement de texte, images en `object-fit: cover` dans des conteneurs à ratio fixe (jamais déformées), menu mobile en burger sous 768px.
