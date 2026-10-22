(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Pointer light on every glass pane */
  document.addEventListener("pointermove", function (e) {
    var el = e.target && e.target.closest ? e.target.closest(".glass") : null;
    if (!el) return;
    var r = el.getBoundingClientRect();
    el.style.setProperty("--mx", e.clientX - r.left + "px");
    el.style.setProperty("--my", e.clientY - r.top + "px");
    el.style.setProperty("--spot", "1");
  });
  document.addEventListener("pointerout", function (e) {
    var el = e.target && e.target.closest ? e.target.closest(".glass") : null;
    if (el && !el.contains(e.relatedTarget)) el.style.setProperty("--spot", "0");
  });

  /* Hero: the pane drifts over the outlined name so the glass visibly blurs it */
  var hero = document.querySelector(".hero");
  if (hero && !reduce) {
    var raf = 0;
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        hero.style.setProperty("--px", x.toFixed(3));
        hero.style.setProperty("--py", y.toFixed(3));
      });
    });
    hero.addEventListener("pointerleave", function () {
      hero.style.setProperty("--px", 0);
      hero.style.setProperty("--py", 0);
    });
  }

  /* Mobile menu */
  var nav = document.querySelector(".nav");
  var btn = document.querySelector(".menu-btn");
  if (nav && btn) {
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* Skill filters */
  var chips = document.querySelectorAll("[data-filter]");
  var cards = document.querySelectorAll(".skill-card");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var f = chip.getAttribute("data-filter");
      chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
      cards.forEach(function (card) {
        card.hidden = !(f === "all" || card.getAttribute("data-group") === f);
      });
    });
  });

  /* Mark the section in view in the nav */
  var links = document.querySelectorAll(".nav ul a");
  var map = {};
  links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          links.forEach(function (a) { a.removeAttribute("aria-current"); });
          map[en.target.id].setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) io.observe(s);
    });
  }

  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
