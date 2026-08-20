/**
 * Backend "invitations personnalisées" — Eunice & Eugène
 *
 * À coller dans un projet Google Apps Script lié au Google Sheet
 * contenant la liste des invités (voir apps-script/SETUP.md pour la
 * marche à suivre complète : création du Sheet, des colonnes, et
 * déploiement en Web App).
 *
 * Colonnes attendues dans l'onglet "Invités" (ligne 1 = en-têtes) :
 *   A: Prénom          B: Nom             C: Civil (Oui/Non)
 *   D: Religieuse (Oui/Non)               E: Réception (Oui/Non)
 *   F: Email            G: Statut RSVP     H: Nombre de personnes
 *   I: Nombre d'enfants J: Message
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
    if (!r[0] && !r[1]) continue;
    rows.push({
      id: i + 1,
      prenom: String(r[0] || ''),
      nom: String(r[1] || ''),
      civil: normalizeBool(r[2]),
      religieuse: normalizeBool(r[3]),
      reception: normalizeBool(r[4]),
      email: String(r[5] || ''),
      statut: String(r[6] || ''),
      nombrePersonnes: r[7] || '',
      nombreEnfants: r[8] || '',
      message: String(r[9] || '')
    });
  }
  return rows;
}

function normalizeBool(v) {
  return String(v).trim().toLowerCase() === 'oui';
}

// Recherche large (prénom OU nom), ne renvoie QUE le strict nécessaire
// à la désambiguïsation — jamais l'email, le statut RSVP ou les
// événements des autres invités.
function searchGuests(query) {
  query = String(query).trim().toLowerCase();
  if (!query) return { results: [] };

  var results = getAllRows()
    .filter(function (r) {
      return r.prenom.toLowerCase().indexOf(query) !== -1 ||
             r.nom.toLowerCase().indexOf(query) !== -1;
    })
    .map(function (r) {
      return { id: r.id, prenom: r.prenom, nom: r.nom };
    });

  return { results: results };
}

// Renvoie l'invitation complète d'UN SEUL invité (jamais la liste).
function getGuest(id) {
  var guest = getAllRows().filter(function (r) { return r.id === id; })[0];
  if (!guest) return { error: 'Invité introuvable.' };
  return { guest: guest };
}

function saveRsvp(body) {
  var sheet = getSheet();
  var row = Number(body.id);
  if (!row || row < 2) return { error: 'ID invalide.' };

  sheet.getRange(row, 6).setValue(body.email || '');
  sheet.getRange(row, 7).setValue(body.presence || '');
  sheet.getRange(row, 8).setValue(body.nombrePersonnes || '');
  sheet.getRange(row, 9).setValue(body.nombreEnfants || '');
  sheet.getRange(row, 10).setValue(body.message || '');

  return { ok: true };
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
