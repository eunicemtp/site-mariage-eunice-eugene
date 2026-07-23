# Site de mariage — Eunice & Eugène

Site HTML/CSS/JS pur (aucun framework, aucun build, aucune dépendance à installer). 21 novembre 2026 — Andenne (cérémonies) & Charleroi (réception).

## Structure du projet

```
site-mariage-eunice-eugene/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── countdown.js   → compte à rebours
│   ├── gallery.js     → galerie + lightbox
│   ├── rsvp.js         → formulaire RSVP (EmailJS)
│   └── nav.js          → menu mobile
├── images/              → photos optimisées (hero.jpg, gallery-1.jpg … gallery-8.jpg)
├── emailjs-template.html → template email stylé à coller dans EmailJS (voir section RSVP)
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

- [ ] **EmailJS** : coller vos 3 identifiants (`EMAILJS_PUBLIC_KEY`, `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`) en haut de `js/rsvp.js` — voir section RSVP ci-dessous. Sans ça, le formulaire affiche un message d'erreur au lieu d'envoyer.
- [ ] **Email de contact** : remplacer `VOTRE-EMAIL@a-remplacer.be` dans `index.html` (section `#contact`) par votre adresse définitive, une fois créée avec le domaine.
- [ ] **Horaires exacts** des cérémonies (actuellement « à confirmer ») dans `index.html`, section `#details`.
- [ ] **Heure exacte** dans `js/countdown.js` (actuellement `10h00` par défaut, ligne `WEDDING_DATE`).
- [ ] **Détails parking** (accès précis, fléchage) — j'ai laissé un texte générique honnête plutôt que d'inventer des informations que je ne pouvais pas vérifier ; complétez-les vous-même dans `index.html`.
- [ ] **Section cadeaux** : à personnaliser ou remplacer par un lien de liste de mariage si vous en créez une.
- [ ] **Nom de domaine final** (voir section DNS ci-dessous).

## Photos : méthode utilisée et pourquoi

**Méthode choisie : vraies images dans le dossier `images/`, référencées par chemin relatif** (`<img src="images/hero.jpg">`), **pas de base64**.

Pourquoi pas le base64 : vous avez 9 photos (~1,3 Mo au total après compression). Encoder ça en base64 dans le HTML l'aurait gonflé de ~30 %, aurait empêché la mise en cache navigateur de chaque image séparément, et aurait rendu le fichier `index.html` illisible/impossible à modifier facilement. Le base64 n'a de sens que pour 1-2 toutes petites icônes.

Vos 9 photos originales (`/Users/eunice_mutope/Documents/Claude/photos-mariage/`) ont été **converties en JPEG, redimensionnées et compressées** (max ~1000-1400 px de large, qualité ~60-65 %) et copiées dans `images/`. Elles s'affichent déjà réellement dans `index.html` — ce n'est pas un placeholder.

**Comment ça reste valide une fois hébergé sur Hostinger :**
1. Uploadez tout le dossier `site-mariage-eunice-eugene` (avec son sous-dossier `images/`) dans `public_html/` via le gestionnaire de fichiers Hostinger ou FTP.
2. Gardez la même structure de dossiers (`images/` doit rester au même niveau que `index.html`). Comme les chemins sont relatifs, **rien à changer dans le code** — les photos s'afficheront à l'identique en ligne.

Si vous ajoutez d'autres photos plus tard : compressez-les d'abord (max ~1500 px de large, JPEG qualité 60-70) avant de les déposer dans `images/`, pour garder un site rapide.

## RSVP : envoi direct via EmailJS

Vous avez choisi l'envoi direct (le visiteur n'a pas besoin d'un client mail configuré) plutôt que le `mailto:`. C'est fait avec [EmailJS](https://www.emailjs.com) : le formulaire envoie les données directement depuis le JavaScript vers votre boîte mail (`mtpeunice@gmail.com` par défaut, à ajuster si besoin), via les serveurs EmailJS.

**Ce que ça implique, pour rester transparent :** EmailJS est un **service tiers** — vous avez créé un compte chez eux, et une clé publique API sera visible dans le code source du site une fois configurée (normal, prévue pour cet usage : elle ne permet que d'envoyer via votre template, pas d'accéder à votre boîte). Plan gratuit : ~200 emails/mois, largement suffisant pour 200 invités.

### Configuration (à faire une fois, dans votre dashboard EmailJS)

1. Connectez-vous sur [dashboard.emailjs.com](https://dashboard.emailjs.com).
2. **Email Services** → *Add New Service* → connectez votre boîte Gmail (ou celle liée à votre futur domaine). Notez le **Service ID** généré.
3. **Email Templates** → *Create New Template*. Dans le corps du template, utilisez ces variables (mêmes noms que les champs du formulaire dans `index.html`) :
   ```
   Nom : {{nom}}
   Présence : {{presence}}
   Nombre de personnes : {{nombre_personnes}}
   Dont nombre d'enfants : {{nombre_enfants}}
   Message : {{message}}
   ```
   **Important :** le destinataire ("To Email") se configure dans l'onglet **Settings** du template (pas dans le corps du message) → mettez `mtpeunice@gmail.com`. Sans ça, l'envoi échoue avec l'erreur "The recipients address is empty". Notez aussi le **Template ID**.
4. **Account** → **General** → copiez votre **Public Key**.
5. Ouvrez `js/rsvp.js` et remplacez les 3 placeholders en haut du fichier :
   ```js
   var EMAILJS_PUBLIC_KEY = 'VOTRE_PUBLIC_KEY';
   var EMAILJS_SERVICE_ID = 'VOTRE_SERVICE_ID';
   var EMAILJS_TEMPLATE_ID = 'VOTRE_TEMPLATE_ID';
   ```
6. Rechargez la page (Live Server) et testez une soumission réelle — vous devriez recevoir l'email.

Tant que ces 3 valeurs ne sont pas renseignées, le formulaire affiche un message d'erreur clair au visiteur plutôt que d'échouer silencieusement.

### Template stylé (habillage visuel de l'email reçu)

Le fichier [emailjs-template.html](emailjs-template.html) contient un template HTML habillé aux couleurs du site (vert sauge, doré, blanc cassé) plutôt qu'un email texte brut. Pour l'utiliser : ouvrez votre template EmailJS → onglet **Content** → basculez en mode code/HTML → copiez-collez le contenu du `<table>...</table>` de ce fichier (pas les balises `<!DOCTYPE>`/`<head>`/`<body>`, qui ne servent qu'à prévisualiser localement). Le fichier n'est pas utilisé par le site lui-même, uniquement comme source à coller dans EmailJS.

### Pourquoi pas le mailto (pour info)

L'alternative "zéro tiers" reste le `mailto:` (ouvre le client mail du visiteur avec un message pré-rempli) : plus "pur" côté vie privée, mais peu fiable sur mobile et sans liste centralisée des réponses. Vous l'avez écarté au profit d'EmailJS pour la fiabilité — c'est documenté ici au cas où vous changiez d'avis ; le code correspondant reste simple à réintroduire si besoin (demandez, on peut le remettre en option).

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

- Aucune librairie externe chargée sauf les polices Google Fonts (`Cormorant Garamond` + `Jost`, ~30 Ko), avec repli sur polices système si indisponible.
- 9 photos compressées : ~1,3 Mo au total.
- Zéro framework JS, code natif uniquement (~4 Ko de JS au total).

## Vérification responsive

Testé et validé sur trois largeurs : 375px (mobile), 768px (tablette), 1280px (desktop) — voir le récapitulatif fourni avec la livraison. Aucun débordement de texte, images en `object-fit: cover` dans des conteneurs à ratio fixe (jamais déformées), menu mobile en burger sous 768px.
