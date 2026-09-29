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
 *   H: Fête uniquement (Oui/Non) — pour un groupe déjà "Soirée: Oui",
 *      précise s'il est convié seulement à la soirée dansante (00h00,
 *      pas le repas) plutôt qu'à la réception complète (18h30). Sans
 *      effet si "Soirée" est "Non".
 *   I: Nombre de personnes invitées
 *   J: Email (verrouillage) K: Statut RSVP
 *   L: Nombre de personnes confirmées
 *   M: Nombre d'enfants     N: Message
 *
 * Deux parcours séparés, volontairement découplés :
 *   1. "Recevoir mon invitation" (nom + email, ou nom seul via "Je n'ai
 *      pas d'email") → unlockGuest() / claimWithoutEmail() envoie
 *      l'invitation complète par email, ou verrouille la colonne Email
 *      avec le marqueur NO_EMAIL_MARKER et notifie les mariés par email
 *      (côté site) qu'une invitation papier doit être remise en main
 *      propre. Rien n'est affiché à l'écran.
 *   2. "Confirmer ma présence" (nom seul) → rsvpInfo() ne renvoie que
 *      le nom du groupe et le nombre de personnes invitées (pour
 *      plafonner le champ RSVP), jamais les événements ni l'email —
 *      mais REFUSE si l'invitation n'a pas encore été réclamée (colonne
 *      Email vide), pour éviter qu'un invité confirme sa présence sans
 *      avoir d'abord reçu (ou signalé ne pas avoir) son invitation.
 */

var SHEET_NAME = 'Invités';

// ID du Google Sheet (dans l'URL du Sheet, entre /d/ et /edit) —
// utilisé plutôt que "le classeur actif" pour que ça fonctionne
// que le script soit lié au Sheet ou créé comme projet indépendant.
var SPREADSHEET_ID = 'COLLEZ_ID_DE_VOTRE_GOOGLE_SHEET';

// Valeur écrite dans la colonne Email quand un invité n'a pas d'adresse
// email (bouton "Je n'ai pas d'email") : verrouille quand même
// l'invitation (comme un vrai email) pour débloquer le RSVP, sans
// jamais être utilisée pour un envoi réel.
var NO_EMAIL_MARKER = '(papier - sans email)';

function doGet(e) {
  var action = e.parameter.action;
  if (action === 'search') {
    return respond(searchGuests(e.parameter.q || ''));
  }
  if (action === 'unlock') {
    return respond(unlockGuest(Number(e.parameter.id), e.parameter.email || ''));
  }
  if (action === 'noEmail') {
    return respond(claimWithoutEmail(Number(e.parameter.id)));
  }
  if (action === 'rsvpInfo') {
    return respond(getRsvpInfo(Number(e.parameter.id)));
  }
  if (action === 'churchInvitation') {
    return respond(createChurchInvitation(e.parameter.nom || '', e.parameter.email || ''));
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
  var spreadsheet = SPREADSHEET_ID.indexOf('COLLEZ_') === 0
    ? SpreadsheetApp.getActiveSpreadsheet()
    : SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    var found = spreadsheet.getSheets().map(function (s) { return s.getName(); }).join(', ');
    throw new Error('Onglet "' + SHEET_NAME + '" introuvable. Onglets réellement présents dans ce Sheet ("' + spreadsheet.getName() + '") : [' + found + ']');
  }
  return sheet;
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
      feteUniquement: normalizeBool(r[7]),
      nombrePersonnesInvitees: r[8] || '',
      email: String(r[9] || ''),
      statut: String(r[10] || ''),
      nombrePersonnesConfirmees: r[11] || '',
      nombreEnfants: r[12] || '',
      message: String(r[13] || '')
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
    sheet.getRange(id, 10).setValue(email);
    guest.email = email;
  } else if (lockedEmail !== email) {
    return { error: "Cette invitation a déjà été envoyée à une autre adresse email. Si c'est une erreur, contactez-nous directement." };
  }

  return { guest: guest };
}

// Variante de unlockGuest() pour les invités sans adresse email :
// verrouille la colonne Email avec NO_EMAIL_MARKER (débloque le RSVP
// exactement comme un vrai email) sans jamais servir à un envoi réel.
// La notification aux mariés (email) est envoyée côté site, pas ici.
function claimWithoutEmail(id) {
  var sheet = getSheet();
  var rows = getAllRows();
  var guest = rows.filter(function (r) { return r.id === id; })[0];
  if (!guest) return { error: 'Invitation introuvable.' };

  var lockedEmail = guest.email.trim();

  if (!lockedEmail) {
    sheet.getRange(id, 10).setValue(NO_EMAIL_MARKER);
    guest.email = NO_EMAIL_MARKER;
  } else if (lockedEmail !== NO_EMAIL_MARKER) {
    return { error: "Cette invitation a déjà été réclamée avec une adresse email. Si c'est une erreur, contactez-nous directement." };
  }

  return { guest: guest };
}

// Renvoie UNIQUEMENT le nom du groupe et le nombre de personnes
// invitées — pour afficher/plafonner le formulaire RSVP sans jamais
// exposer les événements, l'email ou le statut d'un groupe. Refuse si
// l'invitation n'a pas encore été réclamée (voir unlockGuest /
// claimWithoutEmail) : impossible de confirmer sa présence sans avoir
// d'abord reçu (ou signalé ne pas avoir) son invitation.
function getRsvpInfo(id) {
  var guest = getAllRows().filter(function (r) { return r.id === id; })[0];
  if (!guest) return { error: 'Invitation introuvable.' };
  if (!guest.email) {
    return { error: "Vous devez d'abord recevoir votre invitation avant de confirmer votre présence — utilisez le formulaire \"Recevoir mon invitation\" ci-dessus (bouton \"Je n'ai pas d'email\" si vous n'en avez pas)." };
  }
  return {
    guest: {
      id: guest.id,
      nomGroupe: guest.nomGroupe,
      nombrePersonnesInvitees: guest.nombrePersonnesInvitees
    }
  };
}

// Invitation automatique à la cérémonie religieuse uniquement, pour
// toute personne absente de la liste (ex. connaissances de l'église
// non recensées à l'avance). Crée une nouvelle ligne dans le Sheet,
// verrouillée à cet email dès la création — jamais les autres
// événements (commune/coutumier/soirée) ne sont accordés ainsi.
// Idempotent : une même adresse email ne crée qu'une seule ligne.
function createChurchInvitation(nom, email) {
  nom = String(nom).trim();
  email = String(email).trim().toLowerCase();
  if (!nom || !email) return { error: 'Nom et email requis.' };

  var sheet = getSheet();
  var rows = getAllRows();

  var existing = rows.filter(function (r) {
    return r.categorie === 'Invitation spontanée' && r.email.trim().toLowerCase() === email;
  })[0];
  if (existing) return { guest: existing };

  sheet.appendRow([nom, nom, 'Invitation spontanée', 'Non', 'Oui', 'Non', 'Non', 'Non', 1, email, '', '', '', '']);
  var newId = sheet.getLastRow();

  return {
    guest: {
      id: newId,
      nomGroupe: nom,
      noms: nom,
      categorie: 'Invitation spontanée',
      coutumier: false,
      eglise: true,
      soiree: false,
      commune: false,
      feteUniquement: false,
      nombrePersonnesInvitees: 1,
      email: email,
      statut: '',
      nombrePersonnesConfirmees: '',
      nombreEnfants: '',
      message: ''
    }
  };
}

// Audit ponctuel — À EXÉCUTER MANUELLEMENT depuis l'éditeur Apps Script
// (sélectionnez "auditDoublonsPrenoms" dans le menu déroulant en haut,
// puis cliquez sur ▶ Exécuter). Ne modifie jamais la liste d'invités :
// repère les prénoms qui apparaissent dans plusieurs lignes de la
// colonne "Noms (recherche)" — cas où deux invités différents
// partagent le même prénom et pourraient être confondus à la
// recherche — et écrit le résultat dans un onglet "Doublons" du même
// Google Sheet (créé au premier lancement, vidé et réécrit à chaque
// exécution suivante), consultable directement comme n'importe quel
// autre onglet du classeur.
function auditDoublonsPrenoms() {
  var rows = getAllRows();
  var vus = {};

  rows.forEach(function (r) {
    var noms = r.noms.split(',').map(function (n) { return n.trim(); }).filter(Boolean);
    noms.forEach(function (n) {
      var cle = n.toLowerCase();
      if (!vus[cle]) vus[cle] = [];
      vus[cle].push({ nom: n, groupe: r.nomGroupe, ligne: r.id });
    });
  });

  var doublons = Object.keys(vus).filter(function (cle) { return vus[cle].length > 1; });

  var spreadsheet = SPREADSHEET_ID.indexOf('COLLEZ_') === 0
    ? SpreadsheetApp.getActiveSpreadsheet()
    : SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName('Doublons');
  if (sheet) {
    sheet.clear();
  } else {
    sheet = spreadsheet.insertSheet('Doublons');
  }

  if (doublons.length === 0) {
    sheet.getRange(1, 1).setValue('Aucun prénom en double trouvé (dernière vérification : ' + new Date().toLocaleString('fr-BE') + ').');
    return;
  }

  sheet.getRange(1, 1, 1, 3).setValues([['Prénom en double', 'Nom du groupe', 'Ligne dans "Invités"']]);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold');

  var out = [];
  doublons.forEach(function (cle) {
    vus[cle].forEach(function (occurrence) {
      out.push([occurrence.nom, occurrence.groupe, occurrence.ligne]);
    });
  });

  sheet.getRange(2, 1, out.length, 3).setValues(out);
  sheet.autoResizeColumns(1, 3);
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

  sheet.getRange(row, 11).setValue(body.presence || '');
  sheet.getRange(row, 12).setValue(body.nombrePersonnes || '');
  sheet.getRange(row, 13).setValue(body.nombreEnfants || '');
  sheet.getRange(row, 14).setValue(body.message || '');

  return { ok: true };
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
