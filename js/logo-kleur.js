/* Logo-kleur: geeft het logo linksboven (en op de homepage de hero) bij elke
   paginawissel een andere merkkleur. Staat in <head> (niet in main.js) zodat de kleur
   al vastligt vóór de eerste render en er niets zichtbaar van kleur verspringt. */
(function () {
  // Kies willekeurig uit n opties, maar nooit dezelfde als op de vorige pagina
  function kies(sleutel, n) {
    var vorige = -1;
    try { vorige = parseInt(sessionStorage.getItem(sleutel), 10); } catch (e) {}
    var i = Math.floor(Math.random() * (n - 1));
    if (vorige >= 0 && vorige < n && i >= vorige) i++;
    try { sessionStorage.setItem(sleutel, String(i)); } catch (e) {}
    return i;
  }

  var kleuren = ['--red', '--purple', '--blue', '--ink'];
  document.documentElement.style.setProperty('--logo-kleur', 'var(' + kleuren[kies('dees-logo-kleur', kleuren.length)] + ')');

  // Hero-thema's (alleen gebruikt op de homepage, zie .hero in styles.css)
  var heroThemas = ['rood', 'paars', 'blauw'];
  document.documentElement.setAttribute('data-hero', heroThemas[kies('dees-hero-kleur', heroThemas.length)]);
})();
