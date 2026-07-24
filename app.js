(function () {
  "use strict";

  var LANGS = ["en", "pt-BR", "es"];
  var DEFAULT_LANG = "en";
  var htmlEl = document.documentElement;

  /* Theme: light default, respect prefers-color-scheme, persist choice. */
  function initTheme() {
    var stored = null;
    try { stored = localStorage.getItem("theme"); } catch (e) {}
    var theme = stored;
    if (theme !== "light" && theme !== "dark") {
      theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    setTheme(theme);
  }
  function setTheme(theme) {
    htmlEl.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch (e) {}
  }
  var themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      setTheme(htmlEl.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  }

  /* Technologies grid (names are proper nouns; descriptions come from i18n). */
  var TECH = [
    ["k3s", "k3s"], ["ArgoCD", "argocd"], ["cert-manager", "certmanager"],
    ["sealed-secrets", "sealed"], ["Traefik", "traefik"], ["Prometheus", "prometheus"],
    ["Grafana", "grafana"], ["Cloudflare R2", "r2"], ["Docker", "docker"],
    ["GHCR", "ghcr"], ["GitHub Actions", "actions"], ["Let's Encrypt", "letsencrypt"]
  ];
  function renderTech() {
    var host = document.getElementById("tech-grid");
    if (!host) return;
    host.innerHTML = TECH.map(function (t) {
      return '<div class="tech"><b>' + t[0] + '</b><span data-i18n="tech.items.' + t[1] + '"></span></div>';
    }).join("");
  }

  /* Architecture diagram: inline SVG, themed via CSS custom properties. */
  function renderDiagram() {
    var host = document.getElementById("diagram");
    if (!host) return;
    function box(x, y, w, h, label, sub, accent) {
      var fill = accent ? "var(--accent)" : "var(--bg)";
      var text = accent ? "#ffffff" : "var(--ink)";
      var subc = accent ? "rgba(255,255,255,0.85)" : "var(--muted)";
      var s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="10" fill="' + fill + '" stroke="var(--line)"/>';
      s += '<text x="' + (x + w / 2) + '" y="' + (y + (sub ? h / 2 - 3 : h / 2 + 4)) + '" text-anchor="middle" font-family="var(--mono)" font-size="12" font-weight="700" fill="' + text + '">' + label + "</text>";
      if (sub) s += '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 14) + '" text-anchor="middle" font-family="var(--sans)" font-size="10" fill="' + subc + '">' + sub + "</text>";
      return s;
    }
    function arrow(x1, y1, x2, y2) {
      return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="var(--accent)" stroke-width="1.5" marker-end="url(#a)"/>';
    }
    var svg = '<svg viewBox="0 0 720 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Architecture diagram">';
    svg += '<defs><marker id="a" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0l6 3-6 3z" fill="var(--accent)"/></marker></defs>';
    svg += box(20, 130, 150, 56, "GitHub", "HomeLab repo");
    svg += box(250, 130, 130, 56, "ArgoCD", "reconciles", true);
    svg += '<rect x="430" y="30" width="270" height="260" rx="14" fill="none" stroke="var(--line)" stroke-dasharray="4 4"/>';
    svg += '<text x="565" y="24" text-anchor="middle" font-family="var(--mono)" font-size="11" fill="var(--muted)">k3s node</text>';
    svg += box(450, 48, 110, 46, "Traefik", "TLS + routing");
    svg += box(580, 48, 100, 46, "cert-manager");
    svg += box(450, 118, 110, 46, "ChessKernel");
    svg += box(580, 118, 100, 46, "PixelHub");
    svg += box(450, 188, 110, 46, "Prometheus");
    svg += box(580, 188, 100, 46, "Grafana");
    svg += box(450, 252, 230, 32, "sealed-secrets, backups to R2");
    svg += arrow(170, 158, 248, 158);
    svg += arrow(380, 158, 448, 141);
    svg += arrow(380, 150, 448, 71);
    svg += arrow(380, 166, 448, 211);
    svg += "</svg>";
    host.innerHTML = svg;
  }

  /* i18n: load the active language JSON and fill [data-i18n] nodes. */
  var cache = {};
  function apply(dict) {
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute("data-i18n");
      var val = key.split(".").reduce(function (o, k) { return o && o[k]; }, dict);
      if (typeof val === "string") nodes[i].textContent = val;
    }
  }
  function setLang(lang) {
    if (LANGS.indexOf(lang) === -1) lang = DEFAULT_LANG;
    htmlEl.setAttribute("lang", lang === "pt-BR" ? "pt-BR" : lang);
    try { localStorage.setItem("lang", lang); } catch (e) {}
    var btns = document.querySelectorAll(".lang-btn");
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute("aria-current", btns[i].getAttribute("data-lang") === lang ? "true" : "false");
    }
    if (cache[lang]) { apply(cache[lang]); return; }
    fetch("/i18n/" + (lang === "pt-BR" ? "pt" : lang) + ".json")
      .then(function (r) { return r.json(); })
      .then(function (d) { cache[lang] = d; apply(d); })
      .catch(function () {});
  }
  var langBtns = document.querySelectorAll(".lang-btn");
  for (var i = 0; i < langBtns.length; i++) {
    langBtns[i].addEventListener("click", function () { setLang(this.getAttribute("data-lang")); });
  }

  /* Reveal on scroll. */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      for (var i = 0; i < els.length; i++) els[i].classList.add("in");
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    for (var j = 0; j < els.length; j++) io.observe(els[j]);
  }

  /* Boot. */
  initTheme();
  renderTech();
  renderDiagram();
  var initial = DEFAULT_LANG;
  try {
    var stored = localStorage.getItem("lang");
    if (stored && LANGS.indexOf(stored) !== -1) initial = stored;
  } catch (e) {}
  setLang(initial);
  initReveal();
})();
