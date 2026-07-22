// Lightbox simple, sans dépendance externe.
(function () {
  var items = Array.prototype.slice.call(document.querySelectorAll('.gallery-item'));
  if (!items.length) return;

  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var closeBtn = document.getElementById('lightboxClose');
  var prevBtn = document.getElementById('lightboxPrev');
  var nextBtn = document.getElementById('lightboxNext');

  var currentIndex = 0;

  function open(index) {
    currentIndex = index;
    var src = items[currentIndex].getAttribute('data-full');
    lightboxImg.src = src;
    lightboxImg.alt = items[currentIndex].querySelector('img').alt;
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lightbox.classList.remove('is-open');
    lightboxImg.src = '';
    document.body.style.overflow = '';
  }

  function show(delta) {
    currentIndex = (currentIndex + delta + items.length) % items.length;
    var src = items[currentIndex].getAttribute('data-full');
    lightboxImg.src = src;
    lightboxImg.alt = items[currentIndex].querySelector('img').alt;
  }

  items.forEach(function (item, index) {
    item.addEventListener('click', function () { open(index); });
  });

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', function () { show(-1); });
  nextBtn.addEventListener('click', function () { show(1); });

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) close();
  });

  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(-1);
    if (e.key === 'ArrowRight') show(1);
  });
})();
