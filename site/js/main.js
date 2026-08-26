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

  /* ---- Contactformulier -> opent mail-app (mailto) ---- */
  var form = document.querySelector("form[data-mailto]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var to = form.getAttribute("data-mailto");
      var naam = (form.naam && form.naam.value || "").trim();
      var email = (form.email && form.email.value || "").trim();
      var tel = (form.telefoon && form.telefoon.value || "").trim();
      var bericht = (form.bericht && form.bericht.value || "").trim();
      var onderwerp = "Bericht via deestilburg.nl" + (naam ? " — " + naam : "");
      var body =
        "Naam: " + naam + "\n" +
        "E-mail: " + email + "\n" +
        "Telefoon: " + tel + "\n\n" +
        "Bericht:\n" + bericht + "\n";
      var href =
        "mailto:" + to +
        "?subject=" + encodeURIComponent(onderwerp) +
        "&body=" + encodeURIComponent(body);
      window.location.href = href;

      var status = form.querySelector(".form__status");
      if (status) {
        status.textContent =
          "Bedankt! Je mailprogramma opent met je bericht. Verstuur die mail om je vraag naar Dees te sturen.";
      }
    });
  }

  /* ---- Contactformulieren -> Formspree (echte verzending, incl. bijlages) ---- */
  var formspreeForms = document.querySelectorAll('form[action*="formspree.io"]');
  formspreeForms.forEach(function (fsForm) {
    fsForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = fsForm.querySelector(".form__status");
      var submitBtn = fsForm.querySelector('button[type="submit"]');
      if (status) status.textContent = "Bezig met versturen...";
      if (submitBtn) submitBtn.disabled = true;

      fetch(fsForm.action, {
        method: "POST",
        body: new FormData(fsForm),
        headers: { Accept: "application/json" }
      })
        .then(function (response) {
          if (response.ok) {
            fsForm.reset();
            if (status) status.textContent = "Bedankt! Je bericht is verstuurd naar Dees.";
          } else {
            return response.json().then(function (data) {
              var msg =
                data && data.errors
                  ? data.errors.map(function (er) { return er.message; }).join(", ")
                  : "Er ging iets mis. Probeer het later opnieuw of mail ons direct.";
              if (status) status.textContent = msg;
            });
          }
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
