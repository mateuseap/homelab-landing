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

  /* Architecture diagram: inline SVG, themed via CSS custom properties.
     Mirrors the real mateuseap/homelab topology: GitHub is the source of
     truth, ArgoCD reconciles it onto a single k3s node, Traefik fronts every
     app, GHCR supplies images, and a nightly CronJob ships backups to R2. */
  function renderDiagram() {
    var host = document.getElementById("diagram");
    if (!host) return;

    function box(x, y, w, h, label, sub, variant) {
      var fill = variant === "accent" ? "var(--accent)" : variant === "dim" ? "var(--surface)" : "var(--bg)";
      var text = variant === "accent" ? "#ffffff" : "var(--ink)";
      var subc = variant === "accent" ? "rgba(255,255,255,0.85)" : "var(--muted)";
      var s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="9" fill="' + fill + '" stroke="var(--line)"/>';
      s += '<text x="' + (x + w / 2) + '" y="' + (y + (sub ? h / 2 - 4 : h / 2 + 4)) + '" text-anchor="middle" font-family="var(--mono)" font-size="11.5" font-weight="700" fill="' + text + '">' + label + "</text>";
      if (sub) s += '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 12) + '" text-anchor="middle" font-family="var(--sans)" font-size="9.5" fill="' + subc + '">' + sub + "</text>";
      return s;
    }
    function arrow(x1, y1, x2, y2, dashed, marker) {
      var d = dashed ? ' stroke-dasharray="3 3"' : "";
      return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="var(--accent-2)" stroke-width="1.4"' + d + ' marker-end="url(#' + (marker || "a") + ')"/>';
    }
    function label(x, y, text, anchor) {
      return '<text x="' + x + '" y="' + y + '" text-anchor="' + (anchor || "middle") + '" font-family="var(--sans)" font-size="9" fill="var(--muted)">' + text + "</text>";
    }

    var svg = '<svg viewBox="0 0 780 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Architecture diagram">';
    svg += '<defs>' +
      '<marker id="a" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0l6 3-6 3z" fill="var(--accent-2)"/></marker>' +
      '<marker id="b" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0l6 3-6 3z" fill="var(--accent)"/></marker>' +
      "</defs>";

    /* External actors: source repo, browsers, image registry, backup store. */
    svg += box(14, 26, 148, 52, "GitHub", "mateuseap/homelab", "dim");
    svg += box(14, 334, 148, 52, "Browsers", "*.lab.mateuseap.com", "dim");
    svg += box(618, 14, 148, 46, "GHCR", "container images", "dim");
    svg += box(618, 350, 148, 46, "Cloudflare R2", "14-day backups", "dim");

    /* GitOps engine, sitting between the repo and the cluster. */
    svg += box(14, 180, 148, 56, "ArgoCD", "sync · self-heal", "accent");

    /* k3s node boundary. */
    svg += '<rect x="206" y="10" width="380" height="400" rx="14" fill="none" stroke="var(--line)" stroke-dasharray="4 4"/>';
    svg += '<text x="396" y="30" text-anchor="middle" font-family="var(--mono)" font-size="11" font-weight="700" fill="var(--muted)">k3s node · 1 vCPU / 4 GB</text>';

    var c1 = 224, c2 = 402, cw = 164;
    svg += box(c1, 46, cw, 46, "Traefik", "TLS · SNI routing");
    svg += box(c2, 46, cw, 46, "cert-manager", "Let's Encrypt");
    svg += box(c1, 108, cw, 46, "ChessKernel", "chess + postgres + redis");
    svg += box(c2, 108, cw, 46, "PixelHub", "+ LiveKit voice");
    svg += box(c1, 170, cw, 46, "Prometheus", "scrapes /metrics");
    svg += box(c2, 170, cw, 46, "Grafana", "HomeLab Overview");
    svg += box(c1, 232, cw, 46, "sealed-secrets", "decrypts in-cluster");
    svg += box(c2, 232, cw, 46, "CronJob", "nightly pg_dump");

    /* GitHub -> ArgoCD (poll). */
    svg += arrow(88, 78, 88, 178, false, "b");
    svg += label(126, 132, "poll", "middle");
    /* ArgoCD -> cluster (applies manifests). */
    svg += arrow(162, 200, 222, 130, false, "b");
    svg += label(197, 158, "apply", "middle");
    /* Browsers -> Traefik, routed around the ArgoCD box as an elbow connector. */
    svg += '<polyline points="162,360 190,360 190,69 222,69" fill="none" stroke="var(--accent-2)" stroke-width="1.4" marker-end="url(#a)"/>';
    svg += label(178, 300, "HTTPS", "middle");
    /* Traefik / cert-manager -> apps below them. */
    svg += arrow(306, 92, 306, 106, false, "a");
    svg += arrow(484, 92, 484, 106, false, "a");
    /* GHCR -> cluster (dashed, image pulls for ChessKernel + PixelHub). */
    svg += arrow(618, 37, 566, 69, true, "a");
    svg += label(662, 78, "image pulls", "middle");
    /* CronJob -> R2 (nightly backup). */
    svg += arrow(566, 255, 618, 373, false, "a");
    svg += label(662, 340, "nightly", "middle");

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
