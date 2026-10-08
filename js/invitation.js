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
  var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzw9W9nKhtbvqaPzJmMYopQXoCOGywYyldGftONJ-4mv83Me0uJpZjkuZW--AK7mf45-w/exec';

  var EMAILJS_PUBLIC_KEY = '5sMglvaFz6l3sHO0h';
  var EMAILJS_SERVICE_ID = 'service_04i12bd';
  var EMAILJS_RSVP_TEMPLATE_ID = 'template_8hm8yhf'; // notifie Eunice & Eugène à chaque RSVP
  var EMAILJS_INVITATION_TEMPLATE_ID = 'template_0wy88fr'; // envoie l'invitation à l'invité (To Email = {{to_email}})

  // Lien Google Maps (marche à pied) du parking gratuit vers la salle,
  // construit à partir des adresses réelles indiquées sur le carton
  // "Accès & Parking" — reproduit le trajet du QR code papier.
  var PARKING_MAPS_URL = 'https://www.google.com/maps/dir/?api=1&origin=Parking+Charleroi+Expo,+Boulevard+Solvay,+6000+Charleroi&destination=Boulevard+Paul+Janson+5,+6000+Charleroi&travelmode=walking';

  // Monogramme "EE" intégré en SVG (pas <img src="...svg">) : html2canvas
  // ne capture pas de façon fiable les images SVG référencées par URL
  // (chargement asynchrone raté → logo tronqué). Réutilisé tel quel
  // pour tous les cartons imprimables.
  var LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 155 180" width="155" height="180" role="img" aria-label="Eunice &amp; Eugène"><g fill="#B58A4A" fill-rule="evenodd"><path d="M 115 114 L 115 97 L 114 98 L 114 99 L 111 102 L 110 102 L 109 103 L 107 103 L 106 104 L 91 104 L 90 105 L 91 106 L 93 106 L 94 107 L 97 107 L 98 108 L 110 108 L 111 109 L 112 109 L 114 111 L 114 113 Z M 96 89 L 95 90 L 86 90 L 85 91 L 84 91 L 83 90 L 82 91 L 82 94 L 83 95 L 84 94 L 87 94 L 88 95 L 96 95 Z M 108 68 L 113 73 L 113 76 L 114 77 L 114 87 L 115 88 L 115 87 L 114 86 L 115 85 L 115 68 L 114 68 L 113 69 L 111 69 L 110 68 Z M 138 58 L 135 61 L 117 61 L 116 62 L 103 62 L 102 63 L 90 63 L 87 61 L 85 61 L 84 62 L 69 62 L 68 61 L 67 61 L 67 62 L 69 62 L 75 68 L 75 69 L 71 73 L 71 74 L 69 76 L 69 78 L 68 79 L 68 81 L 67 82 L 67 93 L 68 94 L 68 96 L 70 98 L 70 99 L 76 105 L 75 106 L 74 106 L 68 112 L 68 113 L 67 114 L 67 116 L 66 117 L 66 120 L 65 121 L 65 131 L 66 132 L 66 134 L 67 135 L 67 136 L 68 137 L 69 140 L 73 144 L 73 145 L 74 146 L 75 146 L 80 150 L 82 150 L 83 151 L 84 151 L 85 152 L 87 152 L 88 153 L 144 153 L 144 131 L 145 130 L 145 128 L 144 128 L 144 131 L 143 132 L 143 135 L 142 136 L 142 137 L 141 138 L 140 141 L 134 147 L 133 147 L 130 149 L 126 149 L 125 150 L 101 150 L 100 149 L 98 149 L 97 148 L 95 148 L 94 147 L 91 146 L 83 138 L 83 137 L 80 132 L 80 129 L 79 128 L 79 115 L 80 114 L 80 112 L 82 110 L 82 109 L 86 105 L 87 105 L 86 104 L 85 104 L 82 101 L 82 100 L 80 98 L 80 96 L 79 95 L 79 84 L 80 83 L 80 81 L 81 80 L 81 79 L 82 78 L 83 75 L 90 68 L 91 68 L 94 66 L 96 66 L 97 65 L 104 65 L 105 64 L 106 64 L 107 65 L 125 65 L 126 66 L 127 66 L 128 67 L 131 68 L 134 71 L 134 72 L 136 75 L 136 77 L 137 78 L 137 81 L 138 82 L 138 84 Z M 24 22 L 26 22 L 27 23 L 30 23 L 34 27 L 34 29 L 35 30 L 35 144 L 34 145 L 34 146 L 30 150 L 25 150 L 26 151 L 33 151 L 34 152 L 37 153 L 45 161 L 46 161 L 50 165 L 51 165 L 53 167 L 56 168 L 58 170 L 60 170 L 63 172 L 65 172 L 66 173 L 68 173 L 69 174 L 73 174 L 74 175 L 80 175 L 81 176 L 91 176 L 92 175 L 99 175 L 100 174 L 104 174 L 105 173 L 107 173 L 108 172 L 110 172 L 111 171 L 113 171 L 114 170 L 115 170 L 116 169 L 119 168 L 121 166 L 124 165 L 126 163 L 126 162 L 123 165 L 122 165 L 117 168 L 115 168 L 112 170 L 110 170 L 109 171 L 107 171 L 106 172 L 102 172 L 101 173 L 84 173 L 83 172 L 80 172 L 79 171 L 77 171 L 76 170 L 74 170 L 73 169 L 72 169 L 71 168 L 70 168 L 69 167 L 66 166 L 64 164 L 63 164 L 55 156 L 55 155 L 53 153 L 53 152 L 51 149 L 51 147 L 50 146 L 50 144 L 49 143 L 49 138 L 48 137 L 48 96 L 49 95 L 65 95 L 65 94 L 64 93 L 64 90 L 49 90 L 48 89 L 48 31 L 49 30 L 49 28 L 50 27 L 50 26 L 51 25 L 97 25 L 98 26 L 102 26 L 103 27 L 105 27 L 106 28 L 107 28 L 111 32 L 111 33 L 113 35 L 113 37 L 114 38 L 115 38 L 115 22 Z"/></g></svg>';

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
    soiree: {
      icon: '🥂',
      title: 'Réception',
      place: 'Prestige Event Center',
      address: 'Boulevard Paul Janson 5<br>6000 Charleroi',
      time: 'Horaire : 18h30',
      note: 'Parking gratuit au Parking Charleroi Expo (Bd Solvay, 6000 Charleroi), à environ 300 m (4-5 min à pied) de la salle — suivez le Boulevard Paul Janson jusqu\'au n°5. <a href="' + PARKING_MAPS_URL + '" target="_blank" rel="noopener">Itinéraire à pied (Google Maps)</a>'
    },
    // Invités conviés uniquement à la soirée dansante (pas au repas) —
    // même lieu que "soiree" mais horaire plus tardif. Ne remplace
    // "soiree" que pour les groupes où guest.feteUniquement est vrai
    // (voir buildSoireeKey ci-dessous).
    fete: {
      icon: '🥂',
      title: 'La soirée dansante',
      place: 'Prestige Event Center',
      address: 'Boulevard Paul Janson 5<br>6000 Charleroi',
      time: 'Horaire : 23h00',
      note: 'Parking gratuit au Parking Charleroi Expo (Bd Solvay, 6000 Charleroi), à environ 300 m (4-5 min à pied) de la salle — suivez le Boulevard Paul Janson jusqu\'au n°5. <a href="' + PARKING_MAPS_URL + '" target="_blank" rel="noopener">Itinéraire à pied (Google Maps)</a>'
    }
  };

  // Renvoie 'fete' ou 'soiree' selon que l'invité est convié
  // uniquement à la soirée dansante (pas au repas) ou à la réception
  // complète — jamais les deux à la fois.
  function buildInvitedKeys(guest) {
    var keys = [];
    if (guest.commune) keys.push('commune');
    if (guest.eglise) keys.push('eglise');
    if (guest.soiree) keys.push(guest.feteUniquement ? 'fete' : 'soiree');
    return keys;
  }

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
    var noEmailBtn = document.getElementById('noEmailBtn');
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

      // Un seul aller-retour réseau (recherche + réclamation combinées
      // côté serveur) plutôt que deux séquentiels — Apps Script étant
      // lent, ça réduit sensiblement le temps d'attente pour le cas
      // courant (nom non ambigu).
      apiGet({ action: 'claimInvitation', q: query, email: email })
        .then(function (data) {
          if (data.error) { setFeedback(data.error, true); return; }
          if (data.guest) { showSuccess(data.guest, email); return; }
          var results = data.results || [];
          if (results.length === 0) {
            showNotFound(query, email);
          } else {
            setFeedback('Plusieurs invitations correspondent — sélectionnez la vôtre :');
            renderResults(results, email);
          }
        })
        .catch(function () {
          setFeedback("Une erreur est survenue. Merci de réessayer, ou de nous contacter directement.", true);
        });
    });

    // Nom absent de la liste : on propose tout de même une invitation
    // pour la cérémonie religieuse uniquement (voir createChurchInvitation
    // côté Apps Script) — jamais les autres événements.
    function showNotFound(query, email) {
      setFeedback(
        "Nous n'avons pas trouvé votre nom dans notre liste. Vérifiez l'orthographe, ou contactez-nous directement — coordonnées en bas de page." +
        '<span class="invitation-download-actions">' +
          '<button type="button" class="btn btn-secondary" id="churchInviteBtn">Recevoir une invitation pour la cérémonie religieuse</button>' +
        '</span>'
      );
      var btn = document.getElementById('churchInviteBtn');
      if (btn) {
        btn.addEventListener('click', function () {
          btn.disabled = true;
          btn.textContent = 'Envoi en cours…';
          apiGet({ action: 'churchInvitation', nom: query, email: email })
            .then(function (data) {
              if (data.error || !data.guest) { setFeedback(data.error || 'Une erreur est survenue.', true); return; }
              showSuccess(data.guest, email);
            })
            .catch(function () {
              setFeedback("Une erreur est survenue. Merci de réessayer, ou de nous contacter directement.", true);
            });
        });
      }
    }

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
          showSuccess(data.guest, email);
        })
        .catch(function () {
          setFeedback("Une erreur est survenue. Merci de réessayer, ou de nous contacter directement.", true);
        });
    }

    // "Je n'ai pas d'email" : verrouille l'invitation sans adresse
    // (débloque quand même la confirmation de présence) et notifie
    // les mariés par email pour qu'ils remettent une invitation papier
    // en main propre. Aucun email n'est envoyé à l'invité lui-même.
    if (noEmailBtn) {
      noEmailBtn.addEventListener('click', function () {
        clearResults();

        if (!isConfigured) {
          setFeedback("La recherche d'invitation n'est pas encore configurée. Merci de nous contacter directement — coordonnées en bas de page.", true);
          return;
        }

        var query = nameInput.value.trim();
        if (!query) {
          setFeedback('Merci de renseigner votre prénom (ou le nom de votre groupe) ci-dessus, puis de recliquer sur ce lien.', true);
          nameInput.focus();
          return;
        }

        setFeedback('Recherche…');

        apiGet({ action: 'search', q: query })
          .then(function (data) {
            if (data.error) { setFeedback(data.error, true); return; }
            var results = data.results || [];
            if (results.length === 0) {
              setFeedback("Nous n'avons pas trouvé votre nom dans notre liste. Vérifiez l'orthographe, ou contactez-nous directement — coordonnées en bas de page.", true);
            } else if (results.length === 1) {
              claimNoEmail(results[0].id);
            } else {
              setFeedback('Plusieurs invitations correspondent — sélectionnez la vôtre :');
              renderResultsNoEmail(results);
            }
          })
          .catch(function () {
            setFeedback("Une erreur est survenue. Merci de réessayer, ou de nous contacter directement.", true);
          });
      });
    }

    function renderResultsNoEmail(results) {
      resultsList.innerHTML = '';
      results.forEach(function (r) {
        var li = document.createElement('li');
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'guest-result-btn';
        btn.textContent = r.nom;
        btn.addEventListener('click', function () {
          clearResults();
          claimNoEmail(r.id);
        });
        li.appendChild(btn);
        resultsList.appendChild(li);
      });
      resultsList.hidden = false;
    }

    function claimNoEmail(id) {
      setFeedback('Envoi en cours…');
      apiGet({ action: 'noEmail', id: id })
        .then(function (data) {
          if (data.error || !data.guest) { setFeedback(data.error || 'Invitation introuvable.', true); return; }
          notifyNoEmail(data.guest);
          setFeedback(
            '📄 C\'est noté — vous n\'avez pas d\'adresse email. Les mariés ont été prévenus et vous remettront votre invitation en main propre. Vous pouvez dès à présent confirmer votre présence ci-dessous.' +
            '<span class="invitation-download-actions">' +
              '<button type="button" class="btn btn-secondary" id="downloadImageBtn">Télécharger en image</button>' +
              '<button type="button" class="btn btn-secondary" id="downloadPdfBtn">Télécharger en PDF</button>' +
            '</span>'
          );
          var imgBtn = document.getElementById('downloadImageBtn');
          var pdfBtn = document.getElementById('downloadPdfBtn');
          if (imgBtn) imgBtn.addEventListener('click', function () { downloadCard('png', data.guest); });
          if (pdfBtn) pdfBtn.addEventListener('click', function () { downloadCard('pdf', data.guest); });
        })
        .catch(function () {
          setFeedback("Une erreur est survenue. Merci de réessayer, ou de nous contacter directement.", true);
        });
    }

    // Notifie les mariés (pas l'invité) — réutilise le template EmailJS
    // existant "notification RSVP" plutôt que d'en créer un nouveau.
    function notifyNoEmail(guest) {
      if (!isConfigured || !window.emailjs) return;
      window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_RSVP_TEMPLATE_ID, {
        nom: guest.nomGroupe,
        presence: "📄 Pas d'adresse email — invitation papier à remettre en main propre",
        nombre_personnes: guest.nombrePersonnesInvitees || '',
        nombre_enfants: '',
        message: "Cet invité n'a pas d'adresse email. Il/elle peut déjà confirmer sa présence sur le site — pensez à lui remettre une invitation papier."
      }).catch(function () { /* la réclamation Sheet a déjà réussi, on n'échoue pas pour autant */ });
    }

    function showSuccess(guest, email) {
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
    }

    function sendInvitationEmail(guest, email) {
      if (!isConfigured || !window.emailjs || EMAILJS_INVITATION_TEMPLATE_ID.indexOf('COLLEZ_') === 0) return;

      var invitedKeys = buildInvitedKeys(guest);

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

      // Précise le nombre de personnes couvertes par l'invitation,
      // uniquement quand le groupe compte plus d'une personne (inutile
      // de le préciser pour une invitation solo).
      var nbInvites = Number(guest.nombrePersonnesInvitees) || 0;
      if (nbInvites > 1) {
        evenementsDetailHtml += (
          '<tr><td style="padding:12px 0 0;text-align:center;">' +
            '<div style="font-family:Arial,sans-serif;font-size:13px;color:#8C6A35;font-style:italic;">Cette invitation est valable pour ' + nbInvites + ' personnes.</div>' +
          '</td></tr>'
        );
      }

      // Bloc RSVP dynamique : si l'invité a déjà confirmé sa présence
      // (colonne "Statut RSVP" déjà remplie), on affiche un message de
      // confirmation au lieu de redemander de confirmer.
      var rsvpBlockHtml = guest.statut
        ? '<div style="font-family:Arial,sans-serif;font-size:14px;color:#3C6E47;background-color:#EAF3EC;border:1px solid #CFE3D4;border-radius:8px;padding:14px 18px;margin-top:20px;text-align:center;">✅ Votre présence a bien été confirmée. Merci !</div>'
        : '<div style="font-family:Arial,sans-serif;font-size:13px;color:#6E6858;line-height:1.6;margin-top:20px;">Merci de confirmer votre présence avant le <strong>15 octobre 2026</strong>.</div>' +
          '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;"><tr><td align="center">' +
            '<a href="https://www.maison-ee.be/#rsvp" style="display:inline-block;background-color:#15120E;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:999px;">Confirmer ma présence</a>' +
          '</td></tr></table>';

      window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_INVITATION_TEMPLATE_ID, {
        to_email: email,
        nom: guest.nomGroupe,
        evenements: invitedLabels,
        evenements_detail: '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + evenementsDetailHtml + '</table>',
        rsvp_block: rsvpBlockHtml
      }).catch(function () { /* le téléchargement reste possible même si l'email échoue */ });
    }

    // Construit le carton d'invitation hors-écran (jamais affiché) pour
    // le capturer en image/PDF, puis le retire du DOM. Reproduit le
    // design du carton physique (voir maquettes carton papier) ; une
    // seconde page "Accès & Parking" n'est ajoutée que si l'invité a
    // accès à la soirée (les autres cartons n'ont qu'une seule page).
    function downloadCard(type, guest) {
      if (!window.html2canvas) return;

      var invitedKeys = buildInvitedKeys(guest);

      var eventsHtml = invitedKeys.map(function (k, idx) {
        var ev = EVENTS[k];
        var timeLine = ev.time.replace(/^Horaire\s*:\s*/, '');
        var noteLine = ev.note ? ev.note.replace(/<a[^>]*>.*?<\/a>/g, '').trim() : '';
        return (
          '<div class="pcard-section">' +
            '<h2>' + ev.title + '</h2>' +
            '<b>' + timeLine + '</b>' +
            '<div class="pcard-place">' + ev.place + '</div>' +
            (ev.address ? '<div class="pcard-addr">' + ev.address.replace(/<br>/g, ', ') + '</div>' : '') +
            (noteLine ? '<div class="pcard-parking">' + noteLine + '</div>' : '') +
          '</div>' +
          (idx < invitedKeys.length - 1 ? '<div class="pcard-sep">✦</div>' : '')
        );
      }).join('');

      var wrapper = document.createElement('div');
      wrapper.className = 'invitation-printable-offscreen';

      var groupSizeHtml = Number(guest.nombrePersonnesInvitees) > 1
        ? '<div class="pcard-group-size">Cette invitation est valable pour ' + Number(guest.nombrePersonnesInvitees) + ' personnes</div>'
        : '';

      var footerHtml =
        '<div class="pcard-footer">' +
          '<div class="pcard-leaf">❧ &nbsp;&nbsp; ✦ &nbsp;&nbsp; ❧</div>' +
          '<div class="pcard-verse">« Ainsi ils ne sont plus deux, mais ils sont une seule chair.<br>Que l\'homme donc ne sépare pas ce que Dieu a joint. »</div>' +
          '<div class="pcard-marc">Matthieu 19:6</div>' +
          '<div class="pcard-rsvp">Merci de confirmer votre présence<br><span>avant le 15 octobre 2026</span></div>' +
          '<div class="pcard-restricted">✦ Afin de préserver l\'intimité de cette célébration, cette invitation est exclusivement réservée aux personnes conviées.</div>' +
        '</div>';

      var mainPage = document.createElement('div');
      mainPage.className = 'pcard-page';

      // Invités "fête uniquement" (voir buildInvitedKeys) : carton dédié
      // à la soirée dansante, distinct du carton multi-événements —
      // reproduit la maquette dédiée (un seul bloc centré, pas de liste
      // d'événements empilés).
      if (guest.feteUniquement && guest.soiree) {
        mainPage.innerHTML =
          '<div class="pcard-logo">' + LOGO_SVG + '</div>' +
          '<div class="pcard-names">Eunice &amp; Eugène</div>' +
          '<div class="pcard-orn">— ✦ —</div>' +
          '<div class="pcard-greeting">Cher(e) ' + escapeHtml(guest.nomGroupe) + ',</div>' +
          '<div class="pcard-families">Les familles Nkongolo et Béavogui</div>' +
          '<div class="pcard-invite">ont l\'honneur de vous convier à la soirée dansante<br>à l\'occasion du mariage de</div>' +
          '<div class="pcard-couple">Eunice &amp; Eugène</div>' +
          '<div class="pcard-date"><span>✦</span>Samedi 21 novembre 2026<span>✦</span></div>' +
          groupSizeHtml +
          '<div class="pcard-solo">' +
            '<div class="pcard-solo-eyebrow">Rejoignez-nous pour</div>' +
            '<div class="pcard-solo-title">La soirée dansante</div>' +
            '<div class="pcard-solo-time">23h00</div>' +
            '<div class="pcard-place">Prestige Event Center</div>' +
            '<div class="pcard-addr">Boulevard Paul Janson 5 · 6000 Charleroi</div>' +
            '<div class="pcard-parking">Parking Charleroi Expo gratuit à ± 300 m · Bd Solvay</div>' +
          '</div>' +
          footerHtml;
      } else {
        mainPage.innerHTML =
          '<div class="pcard-logo">' + LOGO_SVG + '</div>' +
          '<div class="pcard-names">Eunice &amp; Eugène</div>' +
          '<div class="pcard-orn">— ✦ —</div>' +
          '<div class="pcard-greeting">Cher(e) ' + escapeHtml(guest.nomGroupe) + ',</div>' +
          '<div class="pcard-families">Les familles Nkongolo et Béavogui</div>' +
          '<div class="pcard-invite">ont l\'honneur de vous convier à la célébration du mariage de</div>' +
          '<div class="pcard-couple">Eunice &amp; Eugène</div>' +
          '<div class="pcard-date"><span>✦</span>Samedi 21 novembre 2026<span>✦</span></div>' +
          groupSizeHtml +
          '<div class="pcard-events">' + eventsHtml + '</div>' +
          footerHtml;
      }
      wrapper.appendChild(mainPage);

      var annexPage = null;
      if (guest.soiree) {
        annexPage = document.createElement('div');
        annexPage.className = 'pcard-page pcard-annex';
        annexPage.innerHTML =
          '<h1>Accès &amp; Parking</h1>' +
          '<div class="pcard-sub">Réception · Prestige Event Center</div>' +
          '<h2>En voiture — d\'abord le parking</h2>' +
          '<div class="pcard-arrive">En venant de l\'autoroute, rejoignez le <b>Ring R9</b> et suivez la direction <b>Palais des Expositions / Charleroi Expo</b>. Garez-vous au <b>Parking Charleroi Expo — Bd Solvay, 6000 Charleroi</b>. Le parking est <b>gratuit</b>. Rejoignez ensuite la salle à pied.</div>' +
          '<div class="pcard-walk">' +
            '<div class="pcard-steps"><h2>Du parking à la salle — à pied</h2><ol>' +
              '<li>Depuis le <b>Parking Charleroi Expo</b>, suivez le trottoir en direction du Palais des Expositions.</li>' +
              '<li>Continuez en direction de <b>Charleroi Palais</b> jusqu\'au rond-point.</li>' +
              '<li>Rejoignez le <b>Boulevard Paul Janson</b>.</li>' +
              '<li>Suivez le boulevard jusqu\'au <b>n° 5 — Prestige Event Center</b>.</li>' +
            '</ol></div>' +
            '<div class="pcard-qr"><div id="pcardQrCanvas"></div>Scannez pour ouvrir le trajet exact dans Google Maps</div>' +
          '</div>' +
          '<div class="pcard-note">Les indications Google Maps restent prioritaires en cas de modification temporaire de circulation.</div>';
        wrapper.appendChild(annexPage);
      }

      document.body.appendChild(wrapper);

      if (annexPage && window.QRCode) {
        new window.QRCode(annexPage.querySelector('#pcardQrCanvas'), {
          text: PARKING_MAPS_URL,
          width: 110,
          height: 110,
          colorDark: '#171512',
          colorLight: '#f6f0e6'
        });
      }

      var filename = 'invitation-' + slugify(guest.nomGroupe);

      function cleanup() {
        if (wrapper.parentNode) document.body.removeChild(wrapper);
      }

      if (type === 'png') {
        html2canvas(wrapper, { backgroundColor: '#ffffff', scale: 2 }).then(function (canvas) {
          cleanup();
          var link = document.createElement('a');
          link.download = filename + '.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
        }).catch(cleanup);
      } else if (window.jspdf) {
        var pages = annexPage ? [mainPage, annexPage] : [mainPage];
        var canvases = [];
        (function captureNext(i) {
          if (i >= pages.length) {
            cleanup();
            var pdf = new window.jspdf.jsPDF({
              orientation: 'p',
              unit: 'px',
              format: [canvases[0].width, canvases[0].height]
            });
            canvases.forEach(function (canvas, idx) {
              if (idx > 0) pdf.addPage([canvas.width, canvas.height]);
              pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
            });
            pdf.save(filename + '.pdf');
            return;
          }
          html2canvas(pages[i], { backgroundColor: '#f6f0e6', scale: 2 }).then(function (canvas) {
            canvases.push(canvas);
            captureNext(i + 1);
          }).catch(cleanup);
        })(0);
      } else {
        cleanup();
      }
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

      // Un seul aller-retour réseau (recherche + lecture RSVP combinées
      // côté serveur) plutôt que deux séquentiels — réduit sensiblement
      // le temps d'attente pour le cas courant (nom non ambigu).
      apiGet({ action: 'rsvpLookup', q: query })
        .then(function (data) {
          if (data.error) { setFeedback(data.error, true); return; }
          if (data.guest) { setFeedback(''); renderRsvpForm(data.guest); return; }
          var results = data.results || [];
          if (results.length === 0) {
            setFeedback("Nous n'avons pas trouvé votre nom. Vérifiez l'orthographe, ou contactez-nous directement — coordonnées en bas de page.", true);
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
