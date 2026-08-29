// ============================================================
// Invitation personnalisée — deux parcours séparés
//
// 1. "Recevoir mon invitation" (nom + email) : l'invitation n'est
//    JAMAIS affichée comme texte visible sur la page — elle part
//    uniquement par email (template EmailJS dédié). Les boutons
//    "télécharger en image/PDF" génèrent le fichier à partir d'un
//    rendu hors-écran (jamais montré à l'utilisateur), donc aucune
//    adresse ni horaire n'apparaît en clair sur le site.
//    Protection : la première adresse email utilisée pour une
//    invitation donnée devient la seule acceptée ensuite (voir
//    apps-script/Code.gs) — pas une vérification a priori, d'où la
//    note affichée invitant chacun à ne pas réclamer l'invitation
//    d'un tiers.
//
// 2. "Confirmer ma présence" (nom seul → menu déroulant si
//    ambiguïté) : formulaire RSVP minimal, sans jamais révéler les
//    événements ni l'email. Le nombre de personnes qui confirment
//    est plafonné au nombre de personnes réellement invitées dans
//    ce groupe (vérifié aussi côté serveur).
// ============================================================
(function () {
  var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzxv8lIPRO7LYKllSuOLHDD89x691bLFRO0ugqCADHFo4L3DcCX7g05w_2XGNRs1Qa3-Q/exec';

  var EMAILJS_PUBLIC_KEY = '5sMglvaFz6l3sHO0h';
  var EMAILJS_SERVICE_ID = 'service_04i12bd';
  var EMAILJS_RSVP_TEMPLATE_ID = 'template_8hm8yhf'; // notifie Eunice & Eugène à chaque RSVP
  var EMAILJS_INVITATION_TEMPLATE_ID = 'COLLEZ_VOTRE_TEMPLATE_INVITATION'; // envoie l'invitation à l'invité (To Email = {{to_email}})

  // Lien Google Maps (marche à pied) du parking gratuit vers la salle,
  // construit à partir des adresses réelles indiquées sur le carton
  // "Accès & Parking" — reproduit le trajet du QR code papier.
  var PARKING_MAPS_URL = 'https://www.google.com/maps/dir/?api=1&origin=Parking+Charleroi+Expo,+Boulevard+Solvay,+6000+Charleroi&destination=Boulevard+Paul+Janson+5,+6000+Charleroi&travelmode=walking';

  var EVENTS = {
    commune: {
      icon: '💍',
      title: 'Cérémonie civile',
      place: 'Place du Chapitre 9',
      address: '5300 Andenne',
      time: 'Horaire : 10h00',
      note: 'Parking accessible à proximité.'
    },
    eglise: {
      icon: '⛪',
      title: 'Cérémonie religieuse',
      place: 'Église ADN',
      address: 'Rue de la Justice 11<br>5300 Andenne',
      time: 'Horaire : 13h30',
      note: 'Parking accessible à proximité.'
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
      time: 'Horaire : 18h00',
      note: 'Parking gratuit au Parking Charleroi Expo (Bd Solvay, 6000 Charleroi), à environ 300 m (4-5 min à pied) de la salle — suivez le Boulevard Paul Janson jusqu\'au n°5. <a href="' + PARKING_MAPS_URL + '" target="_blank" rel="noopener">Itinéraire à pied (Google Maps)</a>'
    }
  };

  var isConfigured = APPS_SCRIPT_URL.indexOf('COLLEZ_') !== 0;

  if (isConfigured && window.emailjs) {
    window.emailjs.init(EMAILJS_PUBLIC_KEY);
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

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function slugify(str) {
    return str.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // ==========================================================
  // 1. RECEVOIR MON INVITATION (nom + email, jamais affichée)
  // ==========================================================
  (function () {
    var form = document.getElementById('guestSearchForm');
    var nameInput = document.getElementById('guestSearchInput');
    var emailInput = document.getElementById('guestEmailInput');
    var feedback = document.getElementById('guestSearchFeedback');
    var resultsList = document.getElementById('guestResultsList');
    if (!form) return;

    function setFeedback(message, isError) {
      feedback.innerHTML = message;
      feedback.classList.toggle('is-error', !!isError);
    }

    function clearResults() {
      resultsList.hidden = true;
      resultsList.innerHTML = '';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearResults();

      if (!isConfigured) {
        setFeedback("La recherche d'invitation n'est pas encore configurée. Merci de nous contacter directement — coordonnées en bas de page.", true);
        return;
      }

      var query = nameInput.value.trim();
      var email = emailInput.value.trim();
      if (!query || !email) return;

      setFeedback('Recherche…');

      apiGet({ action: 'search', q: query })
        .then(function (data) {
          if (data.error) { setFeedback(data.error, true); return; }
          var results = data.results || [];
          if (results.length === 0) {
            setFeedback("Nous n'avons pas trouvé votre nom. Vérifiez l'orthographe, ou contactez-nous directement — coordonnées en bas de page.", true);
          } else if (results.length === 1) {
            unlock(results[0].id, email);
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
          unlock(r.id, email);
        });
        li.appendChild(btn);
        resultsList.appendChild(li);
      });
      resultsList.hidden = false;
    }

    function unlock(id, email) {
      setFeedback('Envoi en cours…');
      apiGet({ action: 'unlock', id: id, email: email })
        .then(function (data) {
          if (data.error || !data.guest) { setFeedback(data.error || 'Invitation introuvable.', true); return; }

          var guest = data.guest;
          sendInvitationEmail(guest, email);

          setFeedback(
            '✉️ Votre invitation vient d\'être envoyée à <strong>' + escapeHtml(email) + '</strong>. Vous pouvez aussi la télécharger ci-dessous.' +
            '<span class="invitation-download-actions">' +
              '<button type="button" class="btn btn-secondary" id="downloadImageBtn">Télécharger en image</button>' +
              '<button type="button" class="btn btn-secondary" id="downloadPdfBtn">Télécharger en PDF</button>' +
            '</span>'
          );

          var imgBtn = document.getElementById('downloadImageBtn');
          var pdfBtn = document.getElementById('downloadPdfBtn');
          if (imgBtn) imgBtn.addEventListener('click', function () { downloadCard('png', guest); });
          if (pdfBtn) pdfBtn.addEventListener('click', function () { downloadCard('pdf', guest); });
        })
        .catch(function () {
          setFeedback("Une erreur est survenue. Merci de réessayer, ou de nous contacter directement.", true);
        });
    }

    function sendInvitationEmail(guest, email) {
      if (!isConfigured || !window.emailjs || EMAILJS_INVITATION_TEMPLATE_ID.indexOf('COLLEZ_') === 0) return;

      var invitedKeys = ['commune', 'eglise', 'coutumier', 'soiree'].filter(function (k) { return guest[k]; });

      var invitedLabels = invitedKeys.map(function (k) { return EVENTS[k].title; }).join(', ');

      // Bloc HTML détaillé (adresse, horaire, parking) inséré tel
      // quel dans le template EmailJS via {{{evenements_detail}}}
      // (triple accolade = HTML brut, pas d'échappement).
      var evenementsDetailHtml = invitedKeys.map(function (k) {
        var ev = EVENTS[k];
        return (
          '<tr><td style="padding:14px 0;border-bottom:1px solid #E3DACB;">' +
            '<div style="font-family:Arial,sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#8C6A35;margin-bottom:4px;">' + ev.icon + ' ' + ev.title + '</div>' +
            '<div style="font-family:Arial,sans-serif;font-size:15px;color:#221E19;font-weight:bold;">' + ev.place + (ev.address ? ', ' + ev.address.replace(/<br>/g, ', ') : '') + '</div>' +
            '<div style="font-family:Arial,sans-serif;font-size:13px;color:#6E6858;margin-top:2px;">' + ev.time + (ev.note ? ' · ' + ev.note : '') + '</div>' +
          '</td></tr>'
        );
      }).join('');

      window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_INVITATION_TEMPLATE_ID, {
        to_email: email,
        nom: guest.nomGroupe,
        evenements: invitedLabels,
        evenements_detail: '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + evenementsDetailHtml + '</table>'
      }).catch(function () { /* le téléchargement reste possible même si l'email échoue */ });
    }

    // Construit la carte hors-écran (jamais affichée) pour la
    // capturer en image/PDF, puis la retire du DOM.
    function downloadCard(type, guest) {
      if (!window.html2canvas) return;

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

      var offscreen = document.createElement('div');
      offscreen.className = 'invitation-printable invitation-printable-offscreen';
      offscreen.innerHTML =
        '<div class="invitation-greeting">' +
          '<p class="eyebrow">Cher(e)</p>' +
          '<p class="invitation-name">' + escapeHtml(guest.nomGroupe) + '</p>' +
        '</div>' +
        '<p class="invitation-formula">Les familles Nkongolo et Béavogui ont le plaisir de vous convier à la célébration du mariage de Eunice &amp; Eugène :</p>' +
        '<div class="invitation-events">' + eventsHtml + '</div>' +
        '<p class="invitation-rsvp-deadline">Merci de confirmer votre présence avant le 1er octobre 2026.</p>';
      document.body.appendChild(offscreen);

      html2canvas(offscreen, { backgroundColor: '#FAF6F0', scale: 2 }).then(function (canvas) {
        document.body.removeChild(offscreen);
        var filename = 'invitation-' + slugify(guest.nomGroupe);
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
      }).catch(function () {
        if (offscreen.parentNode) document.body.removeChild(offscreen);
      });
    }
  })();

  // ==========================================================
  // 2. CONFIRMER MA PRÉSENCE (nom seul → RSVP plafonné)
  // ==========================================================
  (function () {
    var form = document.getElementById('rsvpSearchForm');
    var nameInput = document.getElementById('rsvpSearchInput');
    var feedback = document.getElementById('rsvpSearchFeedback');
    var selectWrap = document.getElementById('rsvpSelectWrap');
    var select = document.getElementById('rsvpResultsSelect');
    var selectConfirm = document.getElementById('rsvpSelectConfirm');
    var card = document.getElementById('invitationCard');
    if (!form) return;

    function setFeedback(message, isError) {
      feedback.textContent = message;
      feedback.classList.toggle('is-error', !!isError);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      card.hidden = true;
      selectWrap.hidden = true;

      if (!isConfigured) {
        setFeedback("La confirmation n'est pas encore configurée. Merci de nous contacter directement — coordonnées en bas de page.", true);
        return;
      }

      var query = nameInput.value.trim();
      if (!query) return;

      setFeedback('Recherche…');

      apiGet({ action: 'search', q: query })
        .then(function (data) {
          if (data.error) { setFeedback(data.error, true); return; }
          var results = data.results || [];
          if (results.length === 0) {
            setFeedback("Nous n'avons pas trouvé votre nom. Vérifiez l'orthographe, ou contactez-nous directement — coordonnées en bas de page.", true);
          } else if (results.length === 1) {
            setFeedback('');
            loadRsvpInfo(results[0].id);
          } else {
            setFeedback('Plusieurs invitations correspondent — sélectionnez la vôtre :');
            select.innerHTML = '<option value="">— Choisir —</option>' + results.map(function (r) {
              return '<option value="' + r.id + '">' + escapeHtml(r.nom) + '</option>';
            }).join('');
            selectWrap.hidden = false;
          }
        })
        .catch(function () {
          setFeedback("Une erreur est survenue. Merci de réessayer, ou de nous contacter directement.", true);
        });
    });

    selectConfirm.addEventListener('click', function () {
      var id = Number(select.value);
      if (!id) return;
      selectWrap.hidden = true;
      setFeedback('');
      loadRsvpInfo(id);
    });

    function loadRsvpInfo(id) {
      setFeedback('Chargement…');
      apiGet({ action: 'rsvpInfo', id: id })
        .then(function (data) {
          if (data.error || !data.guest) { setFeedback(data.error || 'Invitation introuvable.', true); return; }
          setFeedback('');
          renderRsvpForm(data.guest);
        })
        .catch(function () {
          setFeedback('Une erreur est survenue.', true);
        });
    }

    function renderRsvpForm(guest) {
      var maxCount = Number(guest.nombrePersonnesInvitees) || 20;
      var defaultCount = guest.nombrePersonnesInvitees || 1;

      card.innerHTML =
        '<div class="invitation-greeting">' +
          '<p class="eyebrow">Confirmation pour</p>' +
          '<p class="invitation-name">' + escapeHtml(guest.nomGroupe) + '</p>' +
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
            '<label for="guestCount">Nombre de personnes de votre groupe qui viendront (maximum ' + maxCount + ') *</label>' +
            '<input type="number" id="guestCount" min="0" max="' + maxCount + '" value="' + escapeHtml(String(defaultCount)) + '" required>' +
          '</div>' +
          '<div class="form-row">' +
            '<label for="guestChildren">Dont nombre d\'enfants</label>' +
            '<input type="number" id="guestChildren" min="0" max="' + maxCount + '" value="0">' +
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
            if (res.error) {
              rsvpFeedback.textContent = res.error;
              rsvpFeedback.className = 'rsvp-feedback rsvp-feedback-error';
              rsvpSubmit.textContent = 'Envoyer ma confirmation';
              rsvpSubmit.disabled = false;
              return;
            }

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
  })();
})();
