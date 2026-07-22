// ============================================================
// RSVP — solution par défaut : mailto: (zéro backend, zéro inscription)
//
// Au submit, on construit un lien mailto: avec un sujet et un corps
// de message proprement formatés à partir des champs du formulaire,
// puis on ouvre ce lien. C'est plus fiable que de laisser le
// navigateur gérer seul action="mailto:" (qui produit un corps de
// mail mal formaté sur beaucoup de clients).
//
// Limite réelle : ça ouvre l'application mail PAR DÉFAUT de l'appareil
// du visiteur. Si l'invité n'en a pas de configurée (fréquent sur
// certains navigateurs mobiles), rien ne se passe visiblement — d'où
// la note affichée sous le formulaire avec le contact direct en secours.
//
// ------------------------------------------------------------
// POUR PASSER À EMAILJS (optionnel, plus fiable, toujours gratuit) :
// EmailJS envoie le mail directement depuis le JS, sans que le
// visiteur ait besoin d'un client mail configuré, et vous obtenez
// une liste centralisée des réponses dans votre tableau de bord
// EmailJS. Étapes :
//   1. Créer un compte gratuit sur https://www.emailjs.com
//      (plan gratuit : ~200 emails/mois)
//   2. Connecter votre boîte mail comme "Service" EmailJS
//   3. Créer un "Template" avec les variables {{nom}}, {{presence}},
//      {{personnes}}, {{message}}
//   4. Dans index.html, ajouter avant </body> :
//      <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
//   5. Remplacer le contenu de ce fichier par quelque chose comme :
//
//      emailjs.init('VOTRE_PUBLIC_KEY');
//      document.getElementById('rsvpForm').addEventListener('submit', function (e) {
//        e.preventDefault();
//        emailjs.sendForm('VOTRE_SERVICE_ID', 'VOTRE_TEMPLATE_ID', this)
//          .then(function () { alert('Merci, votre réponse a bien été envoyée !'); })
//          .catch(function () { alert("Une erreur est survenue, merci de réessayer."); });
//      });
//
//   Attention : EmailJS reste un service tiers (compte à créer, clé
//   publique visible côté client). Ce n'est pas "plus pur" que le
//   mailto, juste plus fiable pour la réception. À vous de choisir.
// ============================================================
(function () {
  var form = document.getElementById('rsvpForm');
  if (!form) return;

  var RSVP_EMAIL = 'VOTRE-EMAIL@a-remplacer.be';

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var name = form.querySelector('#rsvpName').value.trim();
    var attending = form.querySelector('#rsvpAttending').value;
    var guests = form.querySelector('#rsvpGuests').value;
    var message = form.querySelector('#rsvpMessage').value.trim();

    var subject = 'RSVP Mariage — ' + name;
    var body =
      'Nom : ' + name + '\n' +
      'Présence : ' + attending + '\n' +
      'Nombre de personnes : ' + guests + '\n' +
      'Message : ' + (message || '—');

    var mailtoLink =
      'mailto:' + RSVP_EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);

    window.location.href = mailtoLink;
  });
})();
