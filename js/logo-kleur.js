/* Logo-kleur: geeft het logo linksboven bij elke paginawissel een andere merkkleur.
   Staat in <head> (niet in main.js) zodat de kleur al vastligt vóór de eerste render
   en het logo niet zichtbaar van kleur verspringt. */
(function () {
  var kleuren = ['--red', '--purple', '--blue', '--ink'];
  var vorige = -1;
  try { vorige = parseInt(sessionStorage.getItem('dees-logo-kleur'), 10); } catch (e) {}

  // Kies willekeurig, maar nooit dezelfde kleur als op de vorige pagina
  var i = Math.floor(Math.random() * (kleuren.length - 1));
  if (vorige >= 0 && vorige < kleuren.length && i >= vorige) i++;

  document.documentElement.style.setProperty('--logo-kleur', 'var(' + kleuren[i] + ')');
  try { sessionStorage.setItem('dees-logo-kleur', String(i)); } catch (e) {}
})();
