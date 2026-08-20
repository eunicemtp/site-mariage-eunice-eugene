// ============================================================
// Invitation personnalisée — recherche d'invité + RSVP
//
// Remplace l'ancien formulaire RSVP public par une expérience
// personnalisée : l'invité tape son prénom ou son nom, retrouve
// SA propre invitation (uniquement les événements auxquels il/elle
// est convié·e), puis confirme sa présence directement depuis
// cette carte.
//
// Backend : un Google Sheet + Google Apps Script (voir
// apps-script/SETUP.md pour la configuration complète). Tant que
// APPS_SCRIPT_URL n'est pas renseigné ci-dessous, la recherche
// affiche un message clair plutôt que d'échouer silencieusement.
//
// En parallèle de l'enregistrement dans le Sheet, une notification
// est aussi envoyée par email via EmailJS (déjà configuré) pour
// être prévenu instantanément — les deux mécanismes sont
// indépendants : si l'un échoue, l'autre peut quand même réussir.
// ============================================================
(function () {
  var APPS_SCRIPT_URL = 'COLLEZ_VOTRE_URL_APPS_SCRIPT';

  var EMAILJS_PUBLIC_KEY = '5sMglvaFz6l3sHO0h';
  var EMAILJS_SERVICE_ID = 'service_04i12bd';
  var EMAILJS_TEMPLATE_ID = 'template_8hm8yhf';

  var EVENTS = {
    civil: {
      icon: '💍',
      title: 'Cérémonie civile',
      place: "Hôtel de Ville d'Andenne",
      address: 'Place des Tilleuls 1<br>5300 Andenne',
      time: 'Horaire : <em>à confirmer</em>',
      note: ''
    },
    religieuse: {
      icon: '⛪',
      title: 'Cérémonie religieuse',
      place: "Église d'Andenne",
      address: 'Rue de la Justice 11<br>5300 Andenne',
      time: 'Horaire : <em>à confirmer</em>',
      note: "Un espace de parking est disponible à proximité de l'église."
    },
    reception: {
      icon: '🥂',
      title: 'Réception',
      place: 'Prestige Event Center',
      address: 'Boulevard Paul Janson 5<br>6000 Charleroi',
      time: 'Horaire : <em>à confirmer</em>',
      note: 'Un parking se trouve à proximité immédiate du Prestige Event Center. Fléchage et accès précis communiqués prochainement — merci de prévoir large en cas d\'affluence.'
    }
  };

  var form = document.getElementById('guestSearchForm');
  var input = document.getElementById('guestSearchInput');
  var feedback = document.getElementById('guestSearchFeedback');
  var resultsList = document.getElementById('guestResultsList');
  var card = document.getElementById('invitationCard');
  if (!form) return;

  var isConfigured = APPS_SCRIPT_URL.indexOf('COLLEZ_') !== 0;

  if (isConfigured && window.emailjs) {
    window.emailjs.init(EMAILJS_PUBLIC_KEY);
  }

  function setFeedback(message, isError) {
    feedback.textContent = message;
    feedback.classList.toggle('is-error', !!isError);
  }

  function clearResults() {
    resultsList.hidden = true;
    resultsList.innerHTML = '';
  }

  function apiGet(params) {
    var url = APPS_SCRIPT_URL + '?' + Object.keys(params).map(function (k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
    }).join('&');
    return fetch(url).then(function (r) { return r.json(); });
  }

  function apiPost(payload) {
    return fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    card.hidden = true;
    clearResults();

    if (!isConfigured) {
      setFeedback(
        "La recherche d'invitation n'est pas encore configurée. Merci de nous contacter directement — coordonnées en bas de page.",
        true
      );
      return;
    }

    var query = input.value.trim();
    if (!query) return;

    setFeedback('Recherche…');

    apiGet({ action: 'search', q: query })
      .then(function (data) {
        if (data.error) {
          setFeedback(data.error, true);
          return;
        }
        var results = data.results || [];
        if (results.length === 0) {
          setFeedback(
            "Nous n'avons pas trouvé votre nom. Vérifiez l'orthographe, ou contactez-nous directement — coordonnées en bas de page.",
            true
          );
        } else if (results.length === 1) {
          setFeedback('');
          selectGuest(results[0].id);
        } else {
          setFeedback('Plusieurs invités correspondent — sélectionnez votre nom :');
          renderResults(results);
        }
      })
      .catch(function () {
        setFeedback("Une erreur est survenue. Merci de réessayer, ou de nous contacter directement.", true);
      });
  });

  function renderResults(results) {
    resultsList.innerHTML = '';
    results.forEach(function (r) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'guest-result-btn';
      btn.textContent = r.prenom + ' ' + r.nom;
      btn.addEventListener('click', function () {
        clearResults();
        setFeedback('');
        selectGuest(r.id);
      });
      li.appendChild(btn);
      resultsList.appendChild(li);
    });
    resultsList.hidden = false;
  }

  function selectGuest(id) {
    setFeedback('Chargement de votre invitation…');
    apiGet({ action: 'get', id: id })
      .then(function (data) {
        if (data.error || !data.guest) {
          setFeedback(data.error || 'Invitation introuvable.', true);
          return;
        }
        setFeedback('');
        renderInvitation(data.guest);
      })
      .catch(function () {
        setFeedback("Une erreur est survenue en chargeant votre invitation.", true);
      });
  }

  function renderInvitation(guest) {
    var invitedKeys = ['civil', 'religieuse', 'reception'].filter(function (k) { return guest[k]; });

    var eventsHtml = invitedKeys.map(function (k) {
      var ev = EVENTS[k];
      return (
        '<div class="detail-card">' +
          '<div class="detail-icon">' + ev.icon + '</div>' +
          '<h3>' + ev.title + '</h3>' +
          '<p class="detail-place">' + ev.place + '</p>' +
          '<p class="detail-address">' + ev.address + '</p>' +
          '<p class="detail-time">' + ev.time + '</p>' +
          (ev.note ? '<p class="detail-note">' + ev.note + '</p>' : '') +
        '</div>'
      );
    }).join('');

    card.innerHTML =
      '<div class="invitation-greeting">' +
        '<p class="eyebrow">Cher(e)</p>' +
        '<p class="invitation-name">' + escapeHtml(guest.prenom) + ' ' + escapeHtml(guest.nom) + '</p>' +
      '</div>' +
      '<p class="invitation-formula">Avec la bénédiction de Dieu et entourés de leurs familles, Eunice &amp; Eugène ont la joie de vous convier :</p>' +
      '<div class="invitation-events">' + eventsHtml + '</div>' +
      '<form id="guestRsvpForm" class="rsvp-form">' +
        '<div class="form-row">' +
          '<label for="guestPresence">Serez-vous présent(e) ? *</label>' +
          '<select id="guestPresence" required>' +
            '<option value="">— Choisir —</option>' +
            '<option value="Je serai présent(e)">Je serai présent(e)</option>' +
            '<option value="Je ne pourrai pas venir">Je ne pourrai pas venir</option>' +
          '</select>' +
        '</div>' +
        '<div class="form-row">' +
          '<label for="guestCount">Nombre de personnes (vous inclus(e)) *</label>' +
          '<input type="number" id="guestCount" min="1" max="10" value="1" required>' +
        '</div>' +
        '<div class="form-row">' +
          '<label for="guestChildren">Dont nombre d\'enfants</label>' +
          '<input type="number" id="guestChildren" min="0" max="10" value="0">' +
        '</div>' +
        '<div class="form-row">' +
          '<label for="guestEmail">Votre email</label>' +
          '<input type="email" id="guestEmail" autocomplete="email">' +
        '</div>' +
        '<p class="invitation-newsletter-note">Utilisé uniquement pour vous prévenir d\'un éventuel changement, et vous envoyer le lien des photos après le mariage.</p>' +
        '<div class="form-row">' +
          '<label for="guestMessage">Message pour les mariés (facultatif)</label>' +
          '<textarea id="guestMessage" rows="4"></textarea>' +
        '</div>' +
        '<button type="submit" class="btn btn-primary" id="guestRsvpSubmit">Envoyer ma confirmation</button>' +
        '<p class="rsvp-feedback" id="guestRsvpFeedback" role="status"></p>' +
        '<p class="rsvp-note">Votre réponse est enregistrée directement pour Eunice et Eugène. Aucune liste publique n\'est constituée.</p>' +
      '</form>';

    card.hidden = false;
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });

    var rsvpForm = document.getElementById('guestRsvpForm');
    var rsvpSubmit = document.getElementById('guestRsvpSubmit');
    var rsvpFeedback = document.getElementById('guestRsvpFeedback');

    rsvpForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var payload = {
        action: 'rsvp',
        id: guest.id,
        presence: document.getElementById('guestPresence').value,
        nombrePersonnes: document.getElementById('guestCount').value,
        nombreEnfants: document.getElementById('guestChildren').value,
        email: document.getElementById('guestEmail').value.trim(),
        message: document.getElementById('guestMessage').value.trim()
      };

      rsvpSubmit.disabled = true;
      rsvpSubmit.textContent = 'Envoi en cours…';
      rsvpFeedback.textContent = '';
      rsvpFeedback.className = 'rsvp-feedback';

      apiPost(payload)
        .then(function (res) {
          if (res.error) throw new Error(res.error);

          // Notification email indépendante (best effort).
          if (isConfigured && window.emailjs) {
            window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
              nom: guest.prenom + ' ' + guest.nom,
              presence: payload.presence,
              nombre_personnes: payload.nombrePersonnes,
              nombre_enfants: payload.nombreEnfants,
              message: payload.message
            }).catch(function () { /* la persistance Sheet a déjà réussi, on n'échoue pas pour autant */ });
          }

          rsvpFeedback.textContent = 'Merci ! Votre réponse a bien été enregistrée.';
          rsvpFeedback.className = 'rsvp-feedback rsvp-feedback-success';
          rsvpSubmit.textContent = 'Envoyer ma confirmation';
          rsvpSubmit.disabled = false;
        })
        .catch(function () {
          rsvpFeedback.textContent = "Une erreur est survenue lors de l'envoi. Merci de réessayer, ou de nous contacter directement.";
          rsvpFeedback.className = 'rsvp-feedback rsvp-feedback-error';
          rsvpSubmit.textContent = 'Envoyer ma confirmation';
          rsvpSubmit.disabled = false;
        });
    });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
