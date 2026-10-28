/* Dees — kleine, snelle interacties (geen dependencies) */
(function () {
  "use strict";

  /* ---- Jaartal in footer ---- */
  var jaar = document.getElementById("jaar");
  if (jaar) jaar.textContent = new Date().getFullYear();

  /* ---- Mobiel menu ---- */
  var toggle = document.querySelector(".nav__toggle");
  var menu = document.getElementById("mobile-menu");
  if (toggle && menu) {
    var setOpen = function (open) {
      menu.dataset.open = open ? "true" : "false";
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Menu sluiten" : "Menu openen");
      document.body.style.overflow = open ? "hidden" : "";
    };
    toggle.addEventListener("click", function () {
      setOpen(menu.dataset.open !== "true");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.dataset.open === "true") setOpen(false);
    });
  }

  /* ---- "Bij ons"-uitklapmenu in de nav ----
     Muis: openen bij hover. Klik/Enter: openen en sluiten. Escape of klik ernaast sluit. */
  var groep = document.querySelector(".nav__group");
  if (groep) {
    var groepKnop = groep.querySelector(".nav__group-toggle");
    var groepTimer = null;
    var muisErop = false; // open door hover: een klik moet het dan niet meteen weer sluiten
    var zetGroep = function (open) {
      clearTimeout(groepTimer);
      groep.dataset.open = open ? "true" : "false";
      groepKnop.setAttribute("aria-expanded", open ? "true" : "false");
    };
    groepKnop.addEventListener("click", function () { zetGroep(muisErop || groep.dataset.open !== "true"); });
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      groep.addEventListener("mouseenter", function () { muisErop = true; zetGroep(true); });
      groep.addEventListener("mouseleave", function () {
        muisErop = false;
        clearTimeout(groepTimer);
        groepTimer = setTimeout(function () { zetGroep(false); }, 200);
      });
    }
    groep.addEventListener("focusout", function (e) {
      if (!groep.contains(e.relatedTarget)) zetGroep(false);
    });
    document.addEventListener("click", function (e) {
      if (!groep.contains(e.target)) zetGroep(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && groep.dataset.open === "true") { zetGroep(false); groepKnop.focus(); }
    });
  }

  /* ---- Scroll reveal ---- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- Contactformulieren -> eigen /api/* endpoint (Resend, echte verzending) ---- */
  var MAX_BIJLAGEN_BYTES = 3 * 1024 * 1024; /* ruim onder Vercel's ~4.5MB request-limiet na base64 */

  function bestandNaarBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result.split(",")[1]); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  var apiForms = document.querySelectorAll('form[action^="/api/"]');
  apiForms.forEach(function (apiForm) {
    apiForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = apiForm.querySelector(".form__status");
      var submitBtn = apiForm.querySelector('button[type="submit"]');
      if (status) status.textContent = "Bezig met versturen...";
      if (submitBtn) submitBtn.disabled = true;

      var data = {};
      var bestandVelden = [];
      new FormData(apiForm).forEach(function (waarde, naam) {
        if (waarde instanceof File) {
          if (waarde.size > 0) bestandVelden.push([naam, waarde]);
        } else {
          data[naam] = waarde;
        }
      });

      var totaleGrootte = bestandVelden.reduce(function (som, veld) { return som + veld[1].size; }, 0);
      if (totaleGrootte > MAX_BIJLAGEN_BYTES) {
        if (status) status.textContent = "De bijlages zijn samen te groot (max 3MB). Mail ze liever direct naar personeel@deestilburg.nl.";
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      Promise.all(
        bestandVelden.map(function (veld) {
          return bestandNaarBase64(veld[1]).then(function (base64) {
            return [veld[0], { filename: veld[1].name, content: base64 }];
          });
        })
      )
        .then(function (bijlages) {
          bijlages.forEach(function (paar) { data[paar[0]] = paar[1]; });
          return fetch(apiForm.action, {
            method: "POST",
            body: JSON.stringify(data),
            headers: { "Content-Type": "application/json", Accept: "application/json" }
          });
        })
        .then(function (response) {
          return response.json().then(function (body) {
            if (response.ok) {
              apiForm.reset();
              if (status) status.textContent = "Bedankt! Je bericht is verstuurd naar Dees.";
            } else {
              if (status) {
                status.textContent =
                  (body && body.error) ||
                  "Er ging iets mis. Probeer het later opnieuw of mail ons direct.";
              }
            }
          });
        })
        .catch(function () {
          if (status) {
            status.textContent =
              "Er ging iets mis. Controleer je internetverbinding en probeer het opnieuw.";
          }
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  });

  /* ---- Hero-pop-ups bij Brood / Ateliers / Koffie (homepage) ----
     Muis: openen bij hover, open blijven zolang de muis op woord of pop-up staat.
     Touch/toetsenbord: openen en sluiten met tik/Enter, sluiten met Escape of tik ernaast.
     De pop-up is position: fixed (de hero heeft overflow: hidden) en komt boven het
     woord te staan, of eronder als er boven niet genoeg ruimte is. */
  var woorden = document.querySelectorAll(".hero__woord[aria-controls]");
  if (woorden.length) {
    var kanHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var openWoord = null;
    var sluitTimer = null;

    var popVan = function (woord) { return document.getElementById(woord.getAttribute("aria-controls")); };

    var plaats = function (woord, pop) {
      var r = woord.getBoundingClientRect();
      var w = pop.offsetWidth, h = pop.offsetHeight, marge = 12;
      var navH = (document.querySelector(".nav") || { offsetHeight: 0 }).offsetHeight;
      var left = Math.min(Math.max(r.left + r.width / 2 - w / 2, marge), window.innerWidth - w - marge);
      var top = r.top - h - 14;
      if (top < navH + marge) top = Math.min(r.bottom + 14, window.innerHeight - h - marge);
      pop.style.left = left + "px";
      pop.style.top = Math.max(top, navH + marge) + "px";
    };

    var sluit = function () {
      if (!openWoord) return;
      popVan(openWoord).dataset.open = "false";
      openWoord.setAttribute("aria-expanded", "false");
      openWoord = null;
    };

    var open = function (woord) {
      clearTimeout(sluitTimer);
      if (openWoord === woord) return;
      sluit();
      var pop = popVan(woord);
      plaats(woord, pop);
      pop.dataset.open = "true";
      woord.setAttribute("aria-expanded", "true");
      openWoord = woord;
    };

    var sluitStraks = function () {
      clearTimeout(sluitTimer);
      sluitTimer = setTimeout(sluit, 180);
    };

    Array.prototype.forEach.call(woorden, function (woord) {
      var pop = popVan(woord);
      if (!pop) return;
      woord.addEventListener("click", function () {
        if (openWoord === woord && !kanHover) sluit(); else open(woord);
      });
      if (kanHover) {
        woord.addEventListener("mouseenter", function () { open(woord); });
        woord.addEventListener("mouseleave", sluitStraks);
        pop.addEventListener("mouseenter", function () { clearTimeout(sluitTimer); });
        pop.addEventListener("mouseleave", sluitStraks);
      }
    });

    document.addEventListener("click", function (e) {
      if (openWoord && !e.target.closest(".hero__woord, .hero__pop")) sluit();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && openWoord) { var w = openWoord; sluit(); w.focus(); }
    });
    window.addEventListener("scroll", sluit, { passive: true });
    window.addEventListener("resize", sluit);
  }

  /* ---- Beeld-hero: foto beweegt licht mee met scrollen (--s, 0..1) ---- */
  var beeldHero = document.querySelector(".beeld-hero");
  var rustig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (beeldHero && !rustig) {
    var heroGepland = false;
    var tekenHero = function () {
      heroGepland = false;
      var r = beeldHero.getBoundingClientRect();
      beeldHero.style.setProperty("--s", Math.min(Math.max(-r.top / Math.max(r.height, 1), 0), 1).toFixed(3));
    };
    window.addEventListener("scroll", function () {
      if (!heroGepland) { heroGepland = true; window.requestAnimationFrame(tekenHero); }
    }, { passive: true });
    tekenHero();
  }

  /* ---- Zwevende actieknop: zichtbaar na de hero, verborgen bij het doel ---- */
  var zweefKnop = document.querySelector(".zwevende-knop");
  if (zweefKnop && "IntersectionObserver" in window) {
    var doel = document.querySelector(zweefKnop.getAttribute("href"));
    var startBlok = document.querySelector("main > section");
    var voorbijStart = false, doelInBeeld = false;
    var zetKnop = function () { zweefKnop.dataset.zichtbaar = (voorbijStart && !doelInBeeld) ? "true" : "false"; };
    if (startBlok) new IntersectionObserver(function (e) { voorbijStart = !e[0].isIntersecting; zetKnop(); }).observe(startBlok);
    if (doel) new IntersectionObserver(function (e) { doelInBeeld = e[0].isIntersecting; zetKnop(); }, { threshold: 0.15 }).observe(doel);
  }

  /* ---- Navigatiehoogte als CSS-variabele (voor sticky elementen onder de nav) ---- */
  var navEl = document.querySelector(".nav");
  var zetNavH = function () { if (navEl) document.documentElement.style.setProperty("--nav-h", navEl.offsetHeight + "px"); };
  zetNavH(); window.addEventListener("resize", zetNavH);

  /* ---- Menukaart: actieve categorie in de balk oplichten ---- */
  var chipLinks = document.querySelectorAll(".menu-chips a");
  if (chipLinks.length && "IntersectionObserver" in window) {
    var chipVoor = {};
    Array.prototype.forEach.call(chipLinks, function (a) { chipVoor[a.getAttribute("href").slice(1)] = a; });
    var chipIo = new IntersectionObserver(function (items) {
      items.forEach(function (it) {
        if (!it.isIntersecting) return;
        Array.prototype.forEach.call(chipLinks, function (a) { a.removeAttribute("aria-current"); });
        var a = chipVoor[it.target.id];
        if (a) { a.setAttribute("aria-current", "true"); a.scrollIntoView({ block: "nearest", inline: "nearest" }); }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    Object.keys(chipVoor).forEach(function (id) { var el = document.getElementById(id); if (el) chipIo.observe(el); });
  }
})();
