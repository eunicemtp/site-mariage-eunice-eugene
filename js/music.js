// ============================================================
// Musique de fond — Bomuana, Nk Divine (lecteur YouTube caché)
//
// Contrainte navigateur incontournable : aucun navigateur n'autorise
// un son NON coupé dès le chargement de la page sans geste de
// l'utilisateur. La musique démarre donc automatiquement en coupé
// (autorisé partout), puis se déclenche réellement au tout premier
// clic/tap/scroll n'importe où sur la page — ce qui, pour un
// visiteur, revient à "ça joue tout seul".
//
// Le bouton flottant affiche une icône de haut-parleur (son/muet),
// mais en interne il fait juste play()/pause() une fois la musique
// démarrée — comme demandé.
// ============================================================
(function () {
  var VIDEO_ID = 'WMo7yIAT0jk';
  var player = null;
  var hasStartedOnce = false;
  var toggleBtn = document.getElementById('musicToggle');

  function setIcon(isPlaying) {
    toggleBtn.classList.toggle('is-playing', isPlaying);
    toggleBtn.setAttribute('aria-pressed', isPlaying ? 'false' : 'true');
    toggleBtn.setAttribute('aria-label', isPlaying ? 'Couper la musique' : 'Activer la musique');
  }

  function startMusic() {
    if (!player || hasStartedOnce) return;
    hasStartedOnce = true;
    player.unMute();
    player.playVideo();
  }

  // Démarrage au tout premier geste de l'utilisateur sur la page.
  ['click', 'touchstart', 'scroll', 'keydown'].forEach(function (evt) {
    document.addEventListener(evt, startMusic, { once: true, passive: true });
  });

  window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player('youtubePlayer', {
      videoId: VIDEO_ID,
      playerVars: {
        autoplay: 1,
        mute: 1,
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
  };

  toggleBtn.addEventListener('click', function () {
    if (!player || typeof player.getPlayerState !== 'function') return;

    if (!hasStartedOnce) {
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
