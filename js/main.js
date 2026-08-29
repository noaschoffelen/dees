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
})();
