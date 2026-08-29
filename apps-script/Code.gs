/**
 * Backend "invitations personnalisées" — Eunice & Eugène
 *
 * À coller dans un projet Google Apps Script lié au Google Sheet
 * contenant la liste des invités (voir apps-script/SETUP.md pour la
 * marche à suivre complète : création du Sheet, des colonnes, et
 * déploiement en Web App).
 *
 * Modèle : UNE LIGNE PAR GROUPE (un groupe = une personne seule, un
 * couple, ou une famille qui partage la même invitation). L'invité
 * tape son prénom (ou le nom de son groupe) ET une adresse email.
 *
 * Protection choisie : PAS de vérification préalable de l'email
 * (aucune inscription à l'avance nécessaire), mais VERROUILLAGE AU
 * PREMIER ENVOI — le premier email utilisé pour une invitation
 * donnée s'enregistre dans la colonne Email et devient la seule
 * adresse acceptée ensuite pour cette même invitation. Ce n'est PAS
 * une protection parfaite (la toute première personne à taper un
 * nom, même indiscrète, peut verrouiller l'invitation à sa propre
 * adresse avant l'invité réel) mais ça empêche toute consultation
 * répétée par des tiers une fois l'invitation réclamée.
 *
 * Colonnes attendues dans l'onglet "Invités" (ligne 1 = en-têtes) :
 *   A: Nom du groupe        (affiché sur l'invitation, ex. "Couple Mande")
 *   B: Noms (recherche)     (prénoms individuels séparés par virgules)
 *   C: Catégorie            (ex. Famille, Amis — informatif)
 *   D: Coutumier (Oui/Non)  E: Église (Oui/Non)
 *   F: Soirée (Oui/Non)     G: Commune (Oui/Non)
 *   H: Nombre de personnes invitées
 *   I: Email (verrouillage) J: Statut RSVP
 *   K: Nombre de personnes confirmées
 *   L: Nombre d'enfants     M: Message
 *
 * Deux parcours séparés, volontairement découplés :
 *   1. "Recevoir mon invitation" (nom + email) → unlockGuest() envoie
 *      l'invitation complète par email. Rien n'est affiché à l'écran.
 *   2. "Confirmer ma présence" (nom seul) → rsvpInfo() ne renvoie que
 *      le nom du groupe et le nombre de personnes invitées (pour
 *      plafonner le champ RSVP), jamais les événements ni l'email.
 */

var SHEET_NAME = 'Invités';

function doGet(e) {
  var action = e.parameter.action;
  if (action === 'search') {
    return respond(searchGuests(e.parameter.q || ''));
  }
  if (action === 'unlock') {
    return respond(unlockGuest(Number(e.parameter.id), e.parameter.email || ''));
  }
  if (action === 'rsvpInfo') {
    return respond(getRsvpInfo(Number(e.parameter.id)));
  }
  return respond({ error: 'Action inconnue.' });
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return respond({ error: 'Corps de requête invalide.' });
  }
  if (body.action === 'rsvp') {
    return respond(saveRsvp(body));
  }
  return respond({ error: 'Action inconnue.' });
}

function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function getAllRows() {
  var sheet = getSheet();
  var values = sheet.getDataRange().getValues();
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (!r[0]) continue;
    rows.push({
      id: i + 1,
      nomGroupe: String(r[0] || ''),
      noms: String(r[1] || ''),
      categorie: String(r[2] || ''),
      coutumier: normalizeBool(r[3]),
      eglise: normalizeBool(r[4]),
      soiree: normalizeBool(r[5]),
      commune: normalizeBool(r[6]),
      nombrePersonnesInvitees: r[7] || '',
      email: String(r[8] || ''),
      statut: String(r[9] || ''),
      nombrePersonnesConfirmees: r[10] || '',
      nombreEnfants: r[11] || '',
      message: String(r[12] || '')
    });
  }
  return rows;
}

function normalizeBool(v) {
  return String(v).trim().toLowerCase() === 'oui';
}

// Recherche large : nom du groupe OU un des prénoms individuels.
// Ne renvoie QUE le strict nécessaire à la désambiguïsation —
// jamais l'email, le statut RSVP ou les événements.
function searchGuests(query) {
  query = String(query).trim().toLowerCase();
  if (!query) return { results: [] };

  var results = getAllRows()
    .filter(function (r) {
      if (r.nomGroupe.toLowerCase().indexOf(query) !== -1) return true;
      var noms = r.noms.split(',').map(function (n) { return n.trim().toLowerCase(); });
      return noms.some(function (n) { return n && n.indexOf(query) !== -1; });
    })
    .map(function (r) {
      return { id: r.id, nom: r.nomGroupe };
    });

  return { results: results };
}

// Verrouille (ou vérifie) l'email pour UN SEUL groupe, puis renvoie
// son invitation complète. Jamais la liste des autres invités.
function unlockGuest(id, email) {
  email = String(email).trim().toLowerCase();
  if (!email) return { error: 'Adresse email requise.' };

  var sheet = getSheet();
  var rows = getAllRows();
  var guest = rows.filter(function (r) { return r.id === id; })[0];
  if (!guest) return { error: 'Invitation introuvable.' };

  var lockedEmail = guest.email.trim().toLowerCase();

  if (!lockedEmail) {
    // Première réclamation : on verrouille cette adresse.
    sheet.getRange(id, 9).setValue(email);
    guest.email = email;
  } else if (lockedEmail !== email) {
    return { error: "Cette invitation a déjà été envoyée à une autre adresse email. Si c'est une erreur, contactez-nous directement." };
  }

  return { guest: guest };
}

// Renvoie UNIQUEMENT le nom du groupe et le nombre de personnes
// invitées — pour afficher/plafonner le formulaire RSVP sans jamais
// exposer les événements, l'email ou le statut d'un groupe.
function getRsvpInfo(id) {
  var guest = getAllRows().filter(function (r) { return r.id === id; })[0];
  if (!guest) return { error: 'Invitation introuvable.' };
  return {
    guest: {
      id: guest.id,
      nomGroupe: guest.nomGroupe,
      nombrePersonnesInvitees: guest.nombrePersonnesInvitees
    }
  };
}

function saveRsvp(body) {
  var sheet = getSheet();
  var row = Number(body.id);
  if (!row || row < 2) return { error: 'ID invalide.' };

  var guest = getAllRows().filter(function (r) { return r.id === row; })[0];
  if (!guest) return { error: 'Invitation introuvable.' };

  var invited = Number(guest.nombrePersonnesInvitees) || 0;
  var confirmed = Number(body.nombrePersonnes) || 0;
  if (invited > 0 && confirmed > invited) {
    return { error: 'Le nombre de personnes dépasse le nombre de places invitées pour ce groupe (' + invited + ').' };
  }

  sheet.getRange(row, 10).setValue(body.presence || '');
  sheet.getRange(row, 11).setValue(body.nombrePersonnes || '');
  sheet.getRange(row, 12).setValue(body.nombreEnfants || '');
  sheet.getRange(row, 13).setValue(body.message || '');

  return { ok: true };
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
