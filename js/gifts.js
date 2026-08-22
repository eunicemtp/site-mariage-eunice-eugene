// ============================================================
// Section Cadeaux — copier l'IBAN + QR code de virement (SEPA/EPC)
//
// Il n'existe pas de lien universel qui "ouvre la banque" de
// l'invité avec les champs pré-remplis (chaque banque a son propre
// système, sans standard commun côté web). Le vrai équivalent qui
// fonctionne est le QR code bancaire européen (norme EPC069-12,
// aussi appelé "Girocode") : les applications des grandes banques
// belges (KBC, Belfius, ING, BNP Paribas Fortis…) savent le scanner
// et pré-remplissent automatiquement IBAN, bénéficiaire et
// communication. Le montant est laissé vide pour que l'invité
// choisisse librement.
// ============================================================
(function () {
  var IBAN = 'BE06000444368922'; // sans espaces, obligatoire pour le QR
  var BENEFICIARY = 'Eunice & Eugene';
  var COMMUNICATION = 'Cadeau mariage Eunice et Eugene';

  // ----- Copier l'IBAN -----
  var copyBtn = document.getElementById('ibanCopyBtn');
  var copyHint = document.getElementById('ibanCopyHint');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var iban = document.getElementById('ibanValue').textContent.trim();
      var restoreText = copyHint.textContent;

      function showCopied() {
        copyHint.textContent = 'Copié !';
        setTimeout(function () { copyHint.textContent = restoreText; }, 2000);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(iban).then(showCopied).catch(function () {
          copyHint.textContent = 'Copie impossible, sélectionnez le texte manuellement.';
        });
      } else {
        // Repli pour navigateurs très anciens sans Clipboard API.
        var temp = document.createElement('textarea');
        temp.value = iban;
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.select();
        try { document.execCommand('copy'); showCopied(); } catch (e) { /* silencieux */ }
        document.body.removeChild(temp);
      }
    });
  }

  // ----- QR code SEPA (EPC069-12 / Girocode) -----
  var qrContainer = document.getElementById('giftQrCanvas');
  if (qrContainer && window.QRCode) {
    var payload = [
      'BCD',
      '002',
      '1',
      'SCT',
      '',
      BENEFICIARY,
      IBAN,
      '',
      '',
      '',
      COMMUNICATION,
      ''
    ].join('\n');

    new window.QRCode(qrContainer, {
      text: payload,
      width: 160,
      height: 160,
      colorDark: '#221E19',
      colorLight: '#FFFDF9',
      correctLevel: window.QRCode.CorrectLevel.M
    });
  }
})();
