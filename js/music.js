// ============================================================
// Musique de fond — Bomuana, Nk Divine (lecteur YouTube caché)
//
// Contrainte navigateur incontournable : aucun navigateur n'autorise
// un son dès le chargement de la page sans geste de l'utilisateur.
// Le lecteur n'est donc créé qu'au tout premier geste valide
// (clic, tap, touche clavier) — PAS au scroll ni au touchstart, qui
// ne comptent pas comme un "geste utilisateur" aux yeux des
// navigateurs (Safari iOS en particulier) et bloqueraient le son
// silencieusement sans le signaler. Comme la plupart des visiteurs
// touchent l'écran dans les toutes premières secondes, ça revient
// en pratique à "ça joue tout seul".
//
// Le lecteur est créé avec le son activé DÈS SA CRÉATION (au lieu de
// le créer muet puis tenter de le démuter après coup) : c'est la
// méthode fiable sur iOS Safari, où démuter un iframe déjà chargé
// via l'API (postMessage) est souvent silencieusement ignoré.
//
// Le bouton flottant affiche une icône de haut-parleur (son/muet),
// mais en interne il fait juste play()/pause() une fois la musique
// démarrée — comme demandé.
// ============================================================
(function () {
  var VIDEO_ID = 'WMo7yIAT0jk';
  var player = null;
  var apiReady = false;
  var startRequested = false;
  var toggleBtn = document.getElementById('musicToggle');

  function setIcon(isPlaying) {
    toggleBtn.classList.toggle('is-playing', isPlaying);
    toggleBtn.setAttribute('aria-pressed', isPlaying ? 'false' : 'true');
    toggleBtn.setAttribute('aria-label', isPlaying ? 'Couper la musique' : 'Activer la musique');
  }

  function createPlayer() {
    player = new YT.Player('youtubePlayer', {
      videoId: VIDEO_ID,
      playerVars: {
        autoplay: 1,
        mute: 0,
        loop: 1,
        playlist: VIDEO_ID,
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        playsinline: 1
      },
      events: {
        onReady: function (e) {
          e.target.playVideo();
        },
        onStateChange: function (e) {
          setIcon(e.data === YT.PlayerState.PLAYING);
        }
      }
    });
  }

  function startMusic() {
    if (player) return;
    startRequested = true;
    if (apiReady) createPlayer();
  }

  // Uniquement des gestes reconnus comme "activation utilisateur" par
  // les navigateurs (scroll/touchstart ne comptent pas et échoueraient
  // silencieusement).
  ['click', 'touchend', 'keydown'].forEach(function (evt) {
    document.addEventListener(evt, startMusic, { once: true, passive: true });
  });

  window.onYouTubeIframeAPIReady = function () {
    apiReady = true;
    if (startRequested) createPlayer();
  };

  toggleBtn.addEventListener('click', function () {
    if (!player) {
      startMusic();
      return;
    }
    var state = player.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  });
})();
