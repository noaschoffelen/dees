/* Ateliers-pagina: de makers van Dees.
   1. Rail: op desktop schuiven de maker-panelen horizontaal voorbij terwijl je
      verticaal scrollt (sticky container + translateX). Elk paneel krijgt een
      --d (afstand tot het midden, -1..1) voor het diepte-effect in ateliers.css.
   2. Stickers / naamknoppen: springen naar de juiste maker, ook in de rail.
   3. Stapel-modus (mobiel, reduced motion): panelen schuiven in bij het scrollen. */
(function () {
  "use strict";

  var sectie = document.querySelector(".makers");
  if (!sectie) return;
  var sticky = sectie.querySelector(".makers__sticky");
  var track = sectie.querySelector(".makers__track");
  var panelen = Array.prototype.slice.call(track.children);
  var makers = panelen.filter(function (p) { return p.id; });
  /* ---- Elke keer een andere volgorde, zodat geen maker "voorrang" krijgt ---- */
  var schud = function (lijst) {
    for (var i = lijst.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = lijst[i]; lijst[i] = lijst[j]; lijst[j] = t;
    }
    return lijst;
  };
  var volgorde = schud(makers.map(function (m) { return m.id; }));

  // Rail: panelen in de nieuwe volgorde, kleuren op volgorde zodat er nooit twee gelijke naast elkaar staan
  var paneelKleuren = ["blauw", "inkt", "papier", "rood", "paars"];
  volgorde.forEach(function (id, i) {
    var p = document.getElementById(id);
    p.className = p.className.replace(/\bmaker--(rood|blauw|paars|papier|inkt)\b/, "maker--" + paneelKleuren[i % paneelKleuren.length]);
    track.appendChild(p);
  });
  panelen = Array.prototype.slice.call(track.children);
  makers = panelen.filter(function (p) { return p.id; });

  // Navigatie onderin de rail
  var navLijst = sectie.querySelector(".makers__nav");
  volgorde.forEach(function (id) { navLijst.appendChild(navLijst.querySelector('[data-maker="' + id + '"]')); });

  // Hero-collage: de kaarten wisselen van plek (posities blijven, wie waar staat wisselt)
  var collage = document.querySelector(".makers-hero__stickers");
  if (collage) {
    var kaarten = Array.prototype.slice.call(collage.querySelectorAll(".maker-kaart"));
    var plekken = kaarten.map(function (k) { return k.getAttribute("style"); });
    volgorde.forEach(function (id, i) {
      var k = collage.querySelector('.maker-kaart[data-maker="' + id + '"]');
      if (!k) return;
      k.setAttribute("style", plekken[i]);
      collage.appendChild(k);
    });
  }

  // Lopende band met namen
  var band = document.querySelector(".marquee--makers .marquee__track");
  if (band) {
    var hand = '<img src="assets/img/hands/h-right.svg" alt="">';
    var tekst = volgorde.map(function (id) {
      return document.getElementById(id + "-naam").textContent.replace(/\u00ad/g, "") + hand;
    }).join("");
    Array.prototype.forEach.call(band.children, function (span) { span.innerHTML = tekst; });
  }

  var navKnoppen = sectie.querySelectorAll(".makers__nav button");
  var voortgang = sectie.querySelector(".makers__voortgang span");
  var nav = document.querySelector(".nav");

  var minderBeweging = window.matchMedia("(prefers-reduced-motion: reduce)");
  var breed = window.matchMedia("(min-width: 900px)");
  var railAan = false;
  var afstand = 0;   // hoeveel px de track in totaal opschuift
  var gepland = false;

  var navHoogte = function () { return nav ? nav.offsetHeight : 0; };

  var meet = function () {
    railAan = breed.matches && !minderBeweging.matches;
    sectie.classList.toggle("is-rail", railAan);
    document.documentElement.style.setProperty("--nav-h", navHoogte() + "px");
    // De rail heeft per maker precies één schermhoogte. Past een tekst daar niet in
    // (laag venster), dan liever de gestapelde versie dan tekst die wegvalt.
    if (railAan && makers.some(function (m) {
      // alleen de tekstkolom telt (een uitstekende foto of sticker is niet erg)
      var inner = m.querySelector(".maker__inner");
      var tekst = m.querySelector(".maker__tekst");
      if (!inner || !tekst) return false;
      var stijl = window.getComputedStyle(inner);
      var ib = inner.getBoundingClientRect(), tb = tekst.getBoundingClientRect();
      return tb.bottom > ib.bottom - parseFloat(stijl.paddingBottom) + 4 ||
             tb.top < ib.top + parseFloat(stijl.paddingTop) - 4;
    })) {
      railAan = false;
      sectie.classList.remove("is-rail");
    }
    if (railAan) {
      afstand = track.scrollWidth - window.innerWidth;
      // scrollhoogte van de sectie = zichtbare hoogte + horizontale afstand
      sectie.style.height = (window.innerHeight - navHoogte() + afstand) + "px";
    } else {
      sectie.style.height = "";
      track.style.transform = "";
      panelen.forEach(function (p) { p.style.removeProperty("--d"); });
    }
    teken();
  };

  var voortgangVan = function () {
    var boven = sectie.getBoundingClientRect().top - navHoogte();
    return afstand > 0 ? Math.min(Math.max(-boven / afstand, 0), 1) : 0;
  };

  var teken = function () {
    gepland = false;
    if (!railAan) return;
    if (sticky.scrollLeft) sticky.scrollLeft = 0; // vangnet voor browsers zonder overflow: clip
    var p = voortgangVan();
    var x = p * afstand;
    track.style.transform = "translate3d(" + (-x) + "px,0,0)";
    if (voortgang) voortgang.style.setProperty("--p", p.toFixed(4));
    var b = window.innerWidth;
    var actief = 0;
    panelen.forEach(function (paneel, i) {
      var d = (paneel.offsetLeft - x) / b;           // 0 = precies in beeld
      paneel.style.setProperty("--d", Math.max(-1, Math.min(1, d)).toFixed(3));
      if (Math.abs(d) < 0.5) actief = i;
    });
    var actiefId = panelen[actief].id;
    Array.prototype.forEach.call(navKnoppen, function (k) {
      if (k.dataset.maker === actiefId) k.setAttribute("aria-current", "true");
      else k.removeAttribute("aria-current");
    });
  };

  var plan = function () {
    if (!gepland) { gepland = true; window.requestAnimationFrame(teken); }
  };

  var gaNaar = function (id) {
    var doel = document.getElementById(id);
    if (!doel) return;
    var gedrag = minderBeweging.matches ? "auto" : "smooth";
    if (railAan) {
      var sectieTop = sectie.getBoundingClientRect().top + window.scrollY - navHoogte();
      window.scrollTo({ top: sectieTop + doel.offsetLeft, behavior: gedrag });
    } else {
      var top = doel.getBoundingClientRect().top + window.scrollY - navHoogte();
      window.scrollTo({ top: top, behavior: gedrag });
    }
    if (history.replaceState) history.replaceState(null, "", "#" + id);
  };

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-maker]");
    if (!el) return;
    e.preventDefault();
    gaNaar(el.dataset.maker);
  });

  // Stapel-modus: panelen om en om laten inschuiven
  if ("IntersectionObserver" in window && !minderBeweging.matches) {
    sectie.classList.add("kan-onthullen");
    var io = new IntersectionObserver(function (items) {
      items.forEach(function (item) {
        if (item.isIntersecting) { item.target.classList.add("is-in"); io.unobserve(item.target); }
      });
    }, { threshold: 0.15 });
    makers.forEach(function (m) { io.observe(m); });
  }

  window.addEventListener("scroll", plan, { passive: true });
  window.addEventListener("resize", meet);
  window.addEventListener("load", function () {
    meet();
    if (location.hash) gaNaar(location.hash.slice(1));
  });
  meet();
})();
