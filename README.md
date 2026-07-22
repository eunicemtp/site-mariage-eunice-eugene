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
│   ├── rsvp.js         → formulaire RSVP (mailto)
│   └── nav.js          → menu mobile
├── images/              → photos optimisées (hero.jpg, gallery-1.jpg … gallery-8.jpg)
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

- [ ] **Email RSVP / contact** : remplacer `VOTRE-EMAIL@a-remplacer.be` dans `index.html` (2 occurrences) et dans `js/rsvp.js` (`RSVP_EMAIL`), une fois votre adresse liée au domaine créée.
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

## RSVP : mailto par défaut — limites réelles

Le formulaire RSVP (`#rsvp`) construit un lien `mailto:` au moment de l'envoi (voir `js/rsvp.js`) et l'ouvre dans le client mail par défaut de l'appareil du visiteur, avec le message pré-rempli.

**Avantages :** zéro backend, zéro service tiers, zéro inscription, gratuit à vie, aucune donnée transmise à un tiers.

**Limites honnêtes, noir sur blanc :**
- Ça dépend entièrement de l'**application mail configurée par défaut** sur l'appareil du visiteur (Mail, Outlook, Gmail app…). Si rien n'est configuré, le clic ne fait visiblement rien.
- Sur **mobile**, c'est particulièrement peu fiable : beaucoup de gens naviguent depuis un navigateur mobile sans app mail par défaut correctement associée (surtout sous Android avec plusieurs apps mail installées), ou depuis un webmail dans le navigateur (Gmail web) qui n'est pas déclenché par `mailto:`.
- Il n'y a **pas de liste centralisée automatique** : chaque RSVP arrive comme un email séparé dans votre boîte. Vous devrez les compiler vous-même (ex. dans un tableau).
- Aucune confirmation visuelle fiable que l'email a bien été envoyé (le visiteur doit lui-même cliquer "Envoyer" dans son client mail).

C'est pourquoi une note avec le contact direct (téléphone / email) est affichée sous le formulaire, en secours.

### Alternative plus fiable : EmailJS (gratuit, sans backend, mais service tiers)

[EmailJS](https://www.emailjs.com) permet d'envoyer l'email **directement depuis le JavaScript**, sans dépendre du client mail du visiteur, et vous donne une liste des réponses dans un tableau de bord. Plan gratuit : ~200 emails/mois, largement suffisant pour 200 invités.

**Différence importante avec le mailto :** EmailJS est un **service tiers** — vous créez un compte chez eux, votre clé publique API est visible dans le code source du site (normal et prévu pour leur usage, mais ce n'est plus "zéro tiers" comme le mailto), et l'envoi passe par leurs serveurs. Ce n'est pas strictement équivalent au mailto, juste un compromis différent : plus fiable, moins "pur".

Si vous voulez basculer :
1. Créez un compte gratuit sur [emailjs.com](https://www.emailjs.com).
2. Connectez votre boîte mail comme "Email Service".
3. Créez un "Email Template" avec les variables `{{Nom}}`, `{{Présence}}`, `{{Nombre de personnes}}`, `{{Message}}` (les mêmes noms que les attributs `name` des champs du formulaire dans `index.html`).
4. Ajoutez avant `</body>` dans `index.html` :
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
   ```
5. Remplacez le contenu de `js/rsvp.js` par le code d'exemple donné en commentaire en haut de ce même fichier (bloc EmailJS déjà rédigé, prêt à activer).

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
