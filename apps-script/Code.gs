/**
 * Backend "invitations personnalisées" — Eunice & Eugène
 *
 * À coller dans un projet Google Apps Script lié au Google Sheet
 * contenant la liste des invités (voir apps-script/SETUP.md pour la
 * marche à suivre complète : création du Sheet, des colonnes, et
 * déploiement en Web App).
 *
 * Modèle : UNE LIGNE PAR GROUPE (un groupe = une personne seule, un
 * couple, ou une famille qui partage la même invitation). La
 * recherche se fait par prénom individuel (colonne "Noms") OU par
 * nom du groupe — les deux ramènent à la même invitation partagée.
 *
 * Colonnes attendues dans l'onglet "Invités" (ligne 1 = en-têtes) :
 *   A: Nom du groupe        (affiché sur l'invitation, ex. "Couple Mande")
 *   B: Noms (recherche)     (prénoms individuels séparés par virgules, ex. "Marie Claire, Patrick")
 *   C: Catégorie            (ex. Famille, Amis — informatif)
 *   D: Coutumier (Oui/Non)  E: Église (Oui/Non)
 *   F: Soirée (Oui/Non)     G: Commune (Oui/Non)
 *   H: Nombre de personnes invitées
 *   I: Email                J: Statut RSVP
 *   K: Nombre de personnes confirmées
 *   L: Nombre d'enfants     M: Message
 */

var SHEET_NAME = 'Invités';

function doGet(e) {
  var action = e.parameter.action;
  if (action === 'search') {
    return respond(searchGuests(e.parameter.q || ''));
  }
  if (action === 'get') {
    return respond(getGuest(Number(e.parameter.id)));
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

// Recherche large : nom du groupe OU un des prénoms individuels
// listés dans "Noms (recherche)". Ne renvoie QUE le strict
// nécessaire à la désambiguïsation — jamais l'email, le statut
// RSVP ou les événements des autres groupes.
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

// Renvoie l'invitation complète d'UN SEUL groupe (jamais la liste).
function getGuest(id) {
  var guest = getAllRows().filter(function (r) { return r.id === id; })[0];
  if (!guest) return { error: 'Invitation introuvable.' };
  return { guest: guest };
}

function saveRsvp(body) {
  var sheet = getSheet();
  var row = Number(body.id);
  if (!row || row < 2) return { error: 'ID invalide.' };

  sheet.getRange(row, 9).setValue(body.email || '');
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
