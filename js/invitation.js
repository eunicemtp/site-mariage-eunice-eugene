// ============================================================
// Invitation personnalisée — recherche + email + RSVP
//
// L'invité tape son prénom (ou le nom de son groupe/famille) et son
// email. Protection choisie : PAS de vérification préalable de
// l'email, mais VERROUILLAGE AU PREMIER ENVOI — la première adresse
// utilisée pour une invitation devient la seule acceptée ensuite
// (voir apps-script/Code.gs). Ce n'est pas une protection parfaite,
// d'où la note affichée invitant chacun à ne consulter/télécharger
// que sa propre invitation.
//
// Une fois l'invitation débloquée : affichage à l'écran, envoi
// d'une copie par email (EmailJS, template dédié — voir
// apps-script/SETUP.md), et boutons de téléchargement image/PDF de
// la partie "carte d'invitation" (sans le formulaire RSVP).
// ============================================================
(function () {
  var APPS_SCRIPT_URL = 'COLLEZ_VOTRE_URL_APPS_SCRIPT';

  var EMAILJS_PUBLIC_KEY = '5sMglvaFz6l3sHO0h';
  var EMAILJS_SERVICE_ID = 'service_04i12bd';
  var EMAILJS_RSVP_TEMPLATE_ID = 'template_8hm8yhf'; // notifie Eunice & Eugène à chaque RSVP
  var EMAILJS_INVITATION_TEMPLATE_ID = 'COLLEZ_VOTRE_TEMPLATE_INVITATION'; // envoie l'invitation au invité (To Email = {{to_email}})

  var EVENTS = {
    commune: {
      icon: '💍',
      title: 'Cérémonie civile',
      place: "Hôtel de Ville d'Andenne",
      address: 'Place des Tilleuls 1<br>5300 Andenne',
      time: 'Horaire : <em>à confirmer</em>',
      note: ''
    },
    eglise: {
      icon: '⛪',
      title: 'Cérémonie religieuse',
      place: "Église d'Andenne",
      address: 'Rue de la Justice 11<br>5300 Andenne',
      time: 'Horaire : <em>à confirmer</em>',
      note: "Un espace de parking est disponible à proximité de l'église."
    },
    coutumier: {
      icon: '🌿',
      title: 'Cérémonie coutumière',
      place: '<em>Lieu à confirmer</em>',
      address: '',
      time: 'Horaire : <em>à confirmer</em>',
      note: ''
    },
    soiree: {
      icon: '🥂',
      title: 'Réception',
      place: 'Prestige Event Center',
      address: 'Boulevard Paul Janson 5<br>6000 Charleroi',
      time: 'Horaire : <em>à confirmer</em>',
      note: 'Un parking se trouve à proximité immédiate du Prestige Event Center. Fléchage et accès précis communiqués prochainement — merci de prévoir large en cas d\'affluence.'
    }
  };

  var form = document.getElementById('guestSearchForm');
  var nameInput = document.getElementById('guestSearchInput');
  var emailInput = document.getElementById('guestEmailInput');
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

    var query = nameInput.value.trim();
    var email = emailInput.value.trim();
    if (!query || !email) return;

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
          unlockGuest(results[0].id, email);
        } else {
          setFeedback('Plusieurs invitations correspondent — sélectionnez la vôtre :');
          renderResults(results, email);
        }
      })
      .catch(function () {
        setFeedback("Une erreur est survenue. Merci de réessayer, ou de nous contacter directement.", true);
      });
  });

  function renderResults(results, email) {
    resultsList.innerHTML = '';
    results.forEach(function (r) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'guest-result-btn';
      btn.textContent = r.nom;
      btn.addEventListener('click', function () {
        clearResults();
        unlockGuest(r.id, email);
      });
      li.appendChild(btn);
      resultsList.appendChild(li);
    });
    resultsList.hidden = false;
  }

  function unlockGuest(id, email) {
    setFeedback('Chargement de votre invitation…');
    apiGet({ action: 'unlock', id: id, email: email })
      .then(function (data) {
        if (data.error || !data.guest) {
          setFeedback(data.error || 'Invitation introuvable.', true);
          return;
        }
        setFeedback('');
        renderInvitation(data.guest, email);
        sendInvitationEmail(data.guest, email);
      })
      .catch(function () {
        setFeedback("Une erreur est survenue en chargeant votre invitation.", true);
      });
  }

  function sendInvitationEmail(guest, email) {
    if (!isConfigured || !window.emailjs || EMAILJS_INVITATION_TEMPLATE_ID.indexOf('COLLEZ_') === 0) return;

    var invitedLabels = ['commune', 'eglise', 'coutumier', 'soiree']
      .filter(function (k) { return guest[k]; })
      .map(function (k) { return EVENTS[k].title; })
      .join(', ');

    window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_INVITATION_TEMPLATE_ID, {
      to_email: email,
      nom: guest.nomGroupe,
      evenements: invitedLabels
    }).catch(function () { /* l'affichage à l'écran a déjà réussi, on n'échoue pas pour autant */ });
  }

  function renderInvitation(guest, email) {
    var invitedKeys = ['commune', 'eglise', 'coutumier', 'soiree'].filter(function (k) { return guest[k]; });

    var eventsHtml = invitedKeys.map(function (k) {
      var ev = EVENTS[k];
      return (
        '<div class="detail-card">' +
          '<div class="detail-icon">' + ev.icon + '</div>' +
          '<h3>' + ev.title + '</h3>' +
          '<p class="detail-place">' + ev.place + '</p>' +
          (ev.address ? '<p class="detail-address">' + ev.address + '</p>' : '') +
          '<p class="detail-time">' + ev.time + '</p>' +
          (ev.note ? '<p class="detail-note">' + ev.note + '</p>' : '') +
        '</div>'
      );
    }).join('');

    var defaultCount = guest.nombrePersonnesInvitees || 1;

    card.innerHTML =
      '<div class="invitation-printable" id="invitationPrintable">' +
        '<div class="invitation-greeting">' +
          '<p class="eyebrow">Cher(e)</p>' +
          '<p class="invitation-name">' + escapeHtml(guest.nomGroupe) + '</p>' +
        '</div>' +
        '<p class="invitation-formula">Avec la bénédiction de Dieu et entourés de leurs familles, Eunice &amp; Eugène ont la joie de vous convier :</p>' +
        '<div class="invitation-events">' + eventsHtml + '</div>' +
      '</div>' +

      '<p class="invitation-sent-note">✉️ Une copie de votre invitation vient d\'être envoyée à <strong>' + escapeHtml(email) + '</strong>.</p>' +

      '<div class="invitation-download-actions">' +
        '<button type="button" class="btn btn-secondary" id="downloadImageBtn">Télécharger en image</button>' +
        '<button type="button" class="btn btn-secondary" id="downloadPdfBtn">Télécharger en PDF</button>' +
      '</div>' +

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
          '<label for="guestCount">Nombre de personnes de votre groupe qui viendront *</label>' +
          '<input type="number" id="guestCount" min="0" max="20" value="' + escapeHtml(String(defaultCount)) + '" required>' +
        '</div>' +
        '<div class="form-row">' +
          '<label for="guestChildren">Dont nombre d\'enfants</label>' +
          '<input type="number" id="guestChildren" min="0" max="20" value="0">' +
        '</div>' +
        '<div class="form-row">' +
          '<label for="guestMessage">Message pour les mariés (facultatif)</label>' +
          '<textarea id="guestMessage" rows="4"></textarea>' +
        '</div>' +
        '<button type="submit" class="btn btn-primary" id="guestRsvpSubmit">Envoyer ma confirmation</button>' +
        '<p class="rsvp-feedback" id="guestRsvpFeedback" role="status"></p>' +
        '<p class="rsvp-note">Une seule confirmation par groupe suffit. Aucune liste publique n\'est constituée.</p>' +
      '</form>';

    card.hidden = false;
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });

    document.getElementById('downloadImageBtn').addEventListener('click', function () {
      downloadCard('png', guest.nomGroupe);
    });
    document.getElementById('downloadPdfBtn').addEventListener('click', function () {
      downloadCard('pdf', guest.nomGroupe);
    });

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
        message: document.getElementById('guestMessage').value.trim()
      };

      rsvpSubmit.disabled = true;
      rsvpSubmit.textContent = 'Envoi en cours…';
      rsvpFeedback.textContent = '';
      rsvpFeedback.className = 'rsvp-feedback';

      apiPost(payload)
        .then(function (res) {
          if (res.error) throw new Error(res.error);

          if (isConfigured && window.emailjs) {
            window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_RSVP_TEMPLATE_ID, {
              nom: guest.nomGroupe,
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

  function slugify(str) {
    return str.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function downloadCard(type, nomGroupe) {
    var target = document.getElementById('invitationPrintable');
    if (!target || !window.html2canvas) return;

    html2canvas(target, { backgroundColor: '#FAF6F0', scale: 2 }).then(function (canvas) {
      var filename = 'invitation-' + slugify(nomGroupe);
      if (type === 'png') {
        var link = document.createElement('a');
        link.download = filename + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else if (window.jspdf) {
        var imgData = canvas.toDataURL('image/png');
        var pdf = new window.jspdf.jsPDF({
          orientation: canvas.width > canvas.height ? 'l' : 'p',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(filename + '.pdf');
      }
    });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
