/* Shared chrome for every page: palette bar, deadline ribbon, header, footer,
   newsletter modal, countdowns, and mock form handling. Pages only supply
   <main> content plus data-page on <body> to highlight the active nav link. */
(function () {
  var AMAZON = "https://a.co/d/09t2ir3i";
  var DEADLINE = new Date("2026-10-31T23:59:00-04:00"); // bonus-briefing cutoff

  var PALETTES = [
    { id: "nightops", name: "Night Ops", sw: ["#0f1114", "#e8a33d", "#c8452f"] },
    { id: "jungle",   name: "Jungle",    sw: ["#1b1f16", "#c9a646", "#8fae5b"] },
    { id: "dossier",  name: "Dossier",   sw: ["#f3eee4", "#9e1b1b", "#2d3a4a"] },
    { id: "maritime", name: "Maritime",  sw: ["#0b1726", "#f26b2a", "#5fb3d9"] }
  ];

  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; }
  }

  function setPalette(id) {
    document.documentElement.setAttribute("data-palette", id);
    store("pm-palette", id);
    document.querySelectorAll(".pal").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.pal === id ? "true" : "false");
    });
  }

  var page = document.body.dataset.page || "";
  var nav = [
    ["index.html", "Home", "home"],
    ["books.html", "Books", "books"],
    ["bio.html", "About", "bio"],
    ["blog.html", "Field Notes", "blog"],
    ["community.html", "Discussion", "community"],
    ["contact.html", "Speaking", "contact"]
  ];

  var palBar =
    '<div class="palette-bar"><div class="wrap">' +
    '<span class="label">Preview palette</span><div class="palettes" role="group" aria-label="Color palette">' +
    PALETTES.map(function (p) {
      return '<button class="pal" type="button" data-pal="' + p.id + '" aria-pressed="false" title="' + p.name + '">' +
        '<span class="sw">' + p.sw.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join("") + "</span>" +
        "<em>" + p.name + "</em></button>";
    }).join("") +
    "</div></div></div>";

  var ribbon = store("pm-ribbon") === "closed" ? "" :
    '<div class="deadline-ribbon ui" id="ribbon">Free <strong>Marawi Siege Field Briefing</strong> for subscribers who join by Oct 31 — ' +
    '<a href="#" data-signup>claim yours</a><button type="button" aria-label="Dismiss">×</button></div>';

  var header =
    '<header class="site-header"><div class="wrap">' +
    '<a class="brand" href="index.html"><b>Dr. Paul K. Mears</b><small>Counterterrorism · History · Security</small></a>' +
    '<button class="menu-toggle ui" type="button" aria-expanded="false">Menu</button>' +
    '<nav class="nav" aria-label="Main">' +
    nav.map(function (n) {
      return '<a href="' + n[0] + '"' + (n[2] === page ? ' aria-current="page"' : "") + ">" + n[1] + "</a>";
    }).join("") +
    '<a class="btn btn-ghost btn-sm" href="#" data-signup>Newsletter</a>' +
    '<a class="btn btn-primary btn-sm" href="' + AMAZON + '" target="_blank" rel="noopener">Buy on Amazon</a>' +
    "</nav></div></header>";

  var footer =
    '<footer class="site-footer"><div class="wrap"><div class="cols">' +
    '<div><a class="brand" href="index.html"><b>Dr. Paul K. Mears</b><small>Author · Ph.D. Criminology / Counterterrorism</small></a>' +
    '<p class="muted" style="margin-top:16px">Three decades in uniform, a career in the classroom, and books that trace how local conflicts become global threats.</p>' +
    '<div class="socials"><a href="#" aria-label="Facebook">f</a><a href="#" aria-label="X">X</a><a href="#" aria-label="LinkedIn">in</a><a href="#" aria-label="YouTube">▶</a></div></div>' +
    '<div><h4>Explore</h4><ul>' + nav.map(function (n) { return '<li><a href="' + n[0] + '">' + n[1] + "</a></li>"; }).join("") + "</ul></div>" +
    '<div><h4>Books</h4><ul><li><a href="books.html">The Mindanao Shadow</a></li><li><a href="' + AMAZON + '" target="_blank" rel="noopener">Amazon author page</a></li><li><a href="books.html#coming">Coming next</a></li><li><a href="contact.html">Media kit</a></li></ul></div>' +
    '<div><h4>The Briefing</h4><p class="muted">Monthly dispatch: new chapters, research notes, and early access.</p>' +
    '<form class="signup-form"><div class="signup"><input type="email" required placeholder="Email address" aria-label="Email address"><button class="btn btn-primary btn-sm" type="submit">Subscribe</button></div>' +
    '<div class="signup-ok">You\'re on the list. Watch your inbox for the first briefing.</div></form></div>' +
    '</div><div class="bottom"><span>© 2026 Dr. Paul K. Mears. All rights reserved.</span>' +
    '<span class="mock-note">Design mockup — content placeholders for client review</span></div></div></footer>';

  var modal =
    '<div class="modal" id="signup-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
    '<div class="newsletter"><button class="close" type="button" aria-label="Close">×</button>' +
    '<div class="eyebrow">The Mears Briefing</div><h2 id="modal-title" style="font-size:1.9rem">Join the Briefing</h2>' +
    '<p class="muted">One email a month. Research notes from the field, behind-the-book history, and first word on new releases.</p>' +
    '<div class="countdown" data-countdown></div>' +
    '<ul class="perks"><li>Free PDF: <em>The Marawi Siege Field Briefing</em> (deadline Oct 31)</li><li>Early reader access to the next book</li><li>Live Q&amp;A invitations</li></ul>' +
    '<form class="signup-form" style="margin-top:18px"><div class="signup"><input type="text" placeholder="First name" aria-label="First name"><input type="email" required placeholder="Email address" aria-label="Email address"><button class="btn btn-primary" type="submit">Subscribe</button></div>' +
    '<div class="signup-ok">Confirmed. Your Field Briefing is on its way.</div></form>' +
    '<p class="fine">No spam. Unsubscribe any time.</p></div></div>';

  document.body.insertAdjacentHTML("afterbegin", palBar + ribbon + header);
  document.body.insertAdjacentHTML("beforeend", footer + modal +
    '<a class="btn btn-amazon float-cta" href="' + AMAZON + '" target="_blank" rel="noopener">Get the Book</a>');

  var fc = document.querySelector('.float-cta');
  function onScroll() { fc.classList.toggle('show', window.scrollY > 640); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // palette
  setPalette(document.documentElement.getAttribute("data-palette") || "nightops");
  document.querySelectorAll(".pal").forEach(function (b) {
    b.addEventListener("click", function () { setPalette(b.dataset.pal); });
  });

  // ribbon
  var rib = document.getElementById("ribbon");
  if (rib) rib.querySelector("button").addEventListener("click", function () { rib.remove(); store("pm-ribbon", "closed"); });

  // mobile menu
  var toggle = document.querySelector(".menu-toggle"), navEl = document.querySelector(".nav");
  toggle.addEventListener("click", function () {
    var open = navEl.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });

  // modal
  var m = document.getElementById("signup-modal");
  function openModal(e) { if (e) e.preventDefault(); m.classList.add("open"); var i = m.querySelector("input"); if (i) i.focus(); }
  function closeModal() { m.classList.remove("open"); }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-signup]");
    if (t) openModal(e);
  });
  m.querySelector(".close").addEventListener("click", closeModal);
  m.addEventListener("click", function (e) { if (e.target === m) closeModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });

  // mock forms (newsletter + any data-mock form)
  document.querySelectorAll(".signup-form, form[data-mock]").forEach(function (f) {
    f.addEventListener("submit", function (e) { e.preventDefault(); f.classList.add("done"); });
  });

  // countdowns
  var cds = document.querySelectorAll("[data-countdown]");
  function tick() {
    var ms = Math.max(0, DEADLINE - new Date());
    var d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, mi = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
    var html = [[d, "Days"], [h, "Hrs"], [mi, "Min"], [s, "Sec"]].map(function (x) {
      return "<div><b>" + String(x[0]).padStart(2, "0") + "</b><span>" + x[1] + "</span></div>";
    }).join("");
    cds.forEach(function (c) { c.innerHTML = html; });
  }
  if (cds.length) { tick(); setInterval(tick, 1000); }

  // blog filter chips
  document.querySelectorAll(".filters").forEach(function (bar) {
    bar.addEventListener("click", function (e) {
      var chip = e.target.closest(".chip"); if (!chip) return;
      bar.querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", c === chip); });
      var f = chip.dataset.filter;
      document.querySelectorAll("[data-cat]").forEach(function (el) {
        el.style.display = f === "all" || el.dataset.cat === f ? "" : "none";
      });
    });
  });
})();
