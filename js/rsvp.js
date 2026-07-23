// ============================================================
// RSVP — envoi direct via EmailJS (service tiers, compte gratuit)
//
// Le formulaire est envoyé directement à votre adresse mail via
// l'API EmailJS, sans que le visiteur ait besoin d'un client mail
// configuré sur son appareil. C'est ce que vous avez choisi à la
// place du mailto (voir README.md pour la comparaison des deux
// approches et leurs limites respectives).
//
// ------------------------------------------------------------
// CONFIGURATION REQUISE (3 valeurs à coller ci-dessous) :
//
//   1. Créez un "Service" EmailJS (Email Services → Add New Service)
//      → connectez votre boîte Gmail → copiez le "Service ID".
//   2. Créez un "Template" (Email Templates → Create New Template)
//      avec un corps de mail utilisant ces variables :
//        {{nom}}, {{presence}}, {{nombre_personnes}}, {{message}}
//      → copiez le "Template ID".
//   3. Dans EmailJS → Account → General, copiez votre "Public Key".
//   4. Collez les 3 valeurs ci-dessous à la place des placeholders.
//
// Tant que ces 3 valeurs ne sont pas renseignées, le formulaire
// affichera un message d'erreur au lieu d'envoyer quoi que ce soit.
// ============================================================
(function () {
  var EMAILJS_PUBLIC_KEY = '5sMglvaFz6l3sHO0h';
  var EMAILJS_SERVICE_ID = 'service_04i12bd';
  var EMAILJS_TEMPLATE_ID = 'template_8hm8yhf';

  var form = document.getElementById('rsvpForm');
  var submitBtn = document.getElementById('rsvpSubmit');
  var feedback = document.getElementById('rsvpFeedback');
  if (!form) return;

  var isConfigured =
    EMAILJS_PUBLIC_KEY.indexOf('VOTRE_') !== 0 &&
    EMAILJS_SERVICE_ID.indexOf('VOTRE_') !== 0 &&
    EMAILJS_TEMPLATE_ID.indexOf('VOTRE_') !== 0;

  if (isConfigured && window.emailjs) {
    window.emailjs.init(EMAILJS_PUBLIC_KEY);
  }

  function setFeedback(message, type) {
    feedback.textContent = message;
    feedback.className = 'rsvp-feedback' + (type ? ' rsvp-feedback-' + type : '');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!isConfigured || !window.emailjs) {
      setFeedback(
        "Le formulaire n'est pas encore configuré (EmailJS). Merci de nous contacter directement par téléphone ou email — coordonnées en bas de page.",
        'error'
      );
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi en cours…';
    setFeedback('', '');

    window.emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form)
      .then(function () {
        setFeedback('Merci ! Votre réponse a bien été envoyée.', 'success');
        form.reset();
        submitBtn.textContent = 'Envoyer ma confirmation';
        submitBtn.disabled = false;
      })
      .catch(function () {
        setFeedback(
          "Une erreur est survenue lors de l'envoi. Merci de réessayer, ou de nous contacter directement — coordonnées en bas de page.",
          'error'
        );
        submitBtn.textContent = 'Envoyer ma confirmation';
        submitBtn.disabled = false;
      });
  });
})();
