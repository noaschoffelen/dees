/* Vergaderpagina: de hero-foto beweegt licht mee met scrollen (zet --s, 0..1, op
   .vg-hero; ateliers.css-achtige diepte zonder zware scroll-effecten). */
(function () {
  "use strict";
  var hero = document.querySelector(".vg-hero");
  if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var gepland = false;
  var teken = function () {
    gepland = false;
    var r = hero.getBoundingClientRect();
    var s = Math.min(Math.max(-r.top / Math.max(r.height, 1), 0), 1);
    hero.style.setProperty("--s", s.toFixed(3));
  };
  window.addEventListener("scroll", function () {
    if (!gepland) { gepland = true; window.requestAnimationFrame(teken); }
  }, { passive: true });
  teken();
})();
