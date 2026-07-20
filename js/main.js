/* ============================================================
   INPERACO — interaction & effects engine (no dependencies)
   ============================================================ */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasFinePointer = window.matchMedia("(pointer: fine)").matches;
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, min, max) { return Math.min(max, Math.max(min, v)); };

  /* ---------------- preloader ---------------- */

  function initPreloader() {
    var pre = document.getElementById("preloader");
    var bar = document.getElementById("preloaderBar");
    var count = document.getElementById("preloaderCount");
    var hero = document.querySelector(".hero");
    var letters = pre.querySelectorAll(".preloader__letter");
    letters.forEach(function (l, i) { l.style.setProperty("--li", i); });

    function finish() {
      pre.classList.add("is-done");
      document.body.classList.add("is-loaded");
      if (hero) hero.classList.add("is-ready");
      setTimeout(function () { pre.remove(); }, 1000);
    }

    if (prefersReducedMotion) { finish(); return; }

    var start = performance.now();
    var DURATION = 1500;
    (function tick(now) {
      var p = clamp((now - start) / DURATION, 0, 1);
      // ease-out so the counter feels like it's "arriving"
      var eased = 1 - Math.pow(1 - p, 3);
      var val = Math.round(eased * 100);
      bar.style.width = val + "%";
      count.textContent = val;
      if (p < 1) requestAnimationFrame(tick);
      else setTimeout(finish, 150);
    })(start);
  }

  /* ---------------- custom cursor ---------------- */

  function initCursor() {
    if (!hasFinePointer || prefersReducedMotion) return;
    var dot = document.getElementById("cursorDot");
    var ring = document.getElementById("cursorRing");
    document.body.classList.add("has-cursor");

    var mx = innerWidth / 2, my = innerHeight / 2;
    var rx = mx, ry = my;

    addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; });

    (function loop() {
      rx = lerp(rx, mx, 0.16);
      ry = lerp(ry, my, 0.16);
      dot.style.transform = "translate(" + (mx - 4) + "px," + (my - 4) + "px)";
      ring.style.transform = "translate(" + (rx - ring.offsetWidth / 2) + "px," + (ry - ring.offsetHeight / 2) + "px)";
      requestAnimationFrame(loop);
    })();

    document.querySelectorAll("a, button, [data-tilt], .domain").forEach(function (el) {
      el.addEventListener("mouseenter", function () { ring.classList.add("is-active"); });
      el.addEventListener("mouseleave", function () { ring.classList.remove("is-active"); });
    });
  }

  /* ---------------- scroll velocity tracker (marquee boost) ---------------- */

  function initScrollVelocity() {
    var lastY = window.scrollY;
    var lastT = performance.now();
    window.__scrollVelocity = 0;
    addEventListener("scroll", function () {
      var now = performance.now();
      var dt = Math.max(now - lastT, 1);
      window.__scrollVelocity = ((window.scrollY - lastY) / dt) * 16.7; // px per frame
      lastY = window.scrollY;
      lastT = now;
    }, { passive: true });
    // decay so the marquee settles after scrolling stops
    (function decay() {
      window.__scrollVelocity *= 0.9;
      requestAnimationFrame(decay);
    })();
  }

  /* ---------------- nav: hide on scroll down, active section ---------------- */

  function initNav() {
    var nav = document.getElementById("nav");
    var lastY = window.scrollY;

    addEventListener("scroll", function () {
      var y = window.scrollY;
      if (y > lastY && y > 260) nav.classList.add("is-hidden");
      else nav.classList.remove("is-hidden");
      lastY = y;
    }, { passive: true });

    var links = Array.prototype.slice.call(document.querySelectorAll(".nav__links a"));
    var sections = links
      .map(function (a) { return document.querySelector(a.getAttribute("href")); })
      .filter(Boolean);

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach(function (s) { obs.observe(s); });
  }

  /* ---------------- mobile menu ---------------- */

  function initMenu() {
    var burger = document.getElementById("navBurger");
    var menu = document.getElementById("mobileMenu");

    function setOpen(open) {
      burger.classList.toggle("is-open", open);
      menu.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
      burger.setAttribute("aria-expanded", String(open));
      menu.setAttribute("aria-hidden", String(!open));
    }

    burger.addEventListener("click", function () {
      setOpen(!menu.classList.contains("is-open"));
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
  }

  /* ---------------- text scramble on hover ---------------- */

  function initScramble() {
    if (prefersReducedMotion) return;
    var CHARS = "ABCDEFGHIKLMNOPRSTUVXY#/\\<>*";
    document.querySelectorAll("[data-scramble]").forEach(function (el) {
      var original = el.textContent;
      var frame = null;
      el.addEventListener("mouseenter", function () {
        var i = 0;
        cancelAnimationFrame(frame);
        (function step() {
          el.textContent = original
            .split("")
            .map(function (ch, idx) {
              if (ch === " ") return " ";
              if (idx < i / 2) return original[idx];
              return CHARS[Math.floor(Math.random() * CHARS.length)];
            })
            .join("");
          i++;
          if (i / 2 < original.length) frame = requestAnimationFrame(step);
          else el.textContent = original;
        })();
      });
      el.addEventListener("mouseleave", function () {
        cancelAnimationFrame(frame);
        el.textContent = original;
      });
    });
  }

  /* ---------------- magnetic buttons ---------------- */

  function initMagnetic() {
    if (!hasFinePointer || prefersReducedMotion) return;
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      var strength = 0.32;
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        el.style.transform = "translate(" + x * strength + "px," + y * strength + "px)";
      });
      el.addEventListener("mouseleave", function () {
        el.style.transition = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
        el.style.transform = "translate(0,0)";
        setTimeout(function () { el.style.transition = ""; }, 500);
      });
    });
  }

  /* ---------------- reveal on scroll ---------------- */

  function initReveals() {
    var els = document.querySelectorAll("[data-reveal]");
    els.forEach(function (el) {
      var d = el.getAttribute("data-reveal-delay");
      if (d) el.style.setProperty("--rd", d + "ms");
    });
    if (prefersReducedMotion) {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px 0px 0px" });
    els.forEach(function (el) { obs.observe(el); });
  }

  /* ---------------- split-line titles ---------------- */

  function initSplitTitles() {
    document.querySelectorAll("[data-split]").forEach(function (el) {
      var lines = el.innerHTML.split(/<br\s*\/?>/i);
      el.innerHTML = lines
        .map(function (line, i) {
          return '<span class="split-line"><span style="transition-delay:' + i * 110 + 'ms">' + line.trim() + "</span></span>";
        })
        .join("");
    });
    if (prefersReducedMotion) {
      document.querySelectorAll(".split-line").forEach(function (l) { l.classList.add("is-in"); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll(".split-line").forEach(function (l) { l.classList.add("is-in"); });
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    document.querySelectorAll("[data-split]").forEach(function (el) { obs.observe(el); });
  }

  /* ---------------- manifesto: scroll-linked word highlight ---------------- */

  function initManifesto() {
    var el = document.getElementById("manifestoText");
    if (!el) return;
    var KEY = ["gap.", "close", "strategy,", "capital,", "AI", "agents", "production."];
    var words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words
      .map(function (w) {
        var cls = KEY.indexOf(w) !== -1 ? "mw mw--key" : "mw";
        return '<span class="' + cls + '">' + w + "</span>";
      })
      .join(" ");
    if (prefersReducedMotion) return;

    var spans = el.querySelectorAll(".mw");
    function update() {
      var r = el.getBoundingClientRect();
      var vh = innerHeight;
      // progress: 0 when the block's top reaches 85% of the viewport,
      // 1 when its bottom reaches 45%
      var total = (r.height + vh * 0.4) || 1;
      var p = clamp((vh * 0.85 - r.top) / total, 0, 1);
      var lit = Math.floor(p * spans.length * 1.15);
      spans.forEach(function (s, i) { s.classList.toggle("is-lit", i < lit); });
    }
    addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ---------------- marquee ---------------- */

  function initMarquee() {
    var track = document.getElementById("marqueeTrack");
    if (!track) return;
    var group = track.querySelector(".marquee__group");
    // clone until we can loop seamlessly
    for (var i = 0; i < 4; i++) track.appendChild(group.cloneNode(true));
    if (prefersReducedMotion) return;

    var x = 0;
    (function loop() {
      var w = group.offsetWidth;
      var boost = Math.min(Math.abs(window.__scrollVelocity || 0) * 0.12, 6);
      x -= 0.55 + boost;
      if (w > 0 && -x >= w) x += w;
      track.style.transform = "translate3d(" + x + "px,0,0)";
      requestAnimationFrame(loop);
    })();
  }

  /* ---------------- 3D tilt cards ---------------- */

  function initTilt() {
    if (!hasFinePointer || prefersReducedMotion) return;
    document.querySelectorAll("[data-tilt]").forEach(function (card) {
      var MAX = 7;
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        var rx = (0.5 - py) * MAX;
        var ry = (px - 0.5) * MAX;
        card.style.transform =
          "perspective(900px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg) translateY(-4px)";
        card.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
      });
      card.addEventListener("mouseleave", function () {
        card.style.transition = "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)";
        card.style.transform = "perspective(900px) rotateX(0) rotateY(0) translateY(0)";
        setTimeout(function () { card.style.transition = ""; }, 600);
      });
    });
  }

  /* ---------------- animated counters ---------------- */

  function initCounters() {
    var els = document.querySelectorAll("[data-counter]");
    if (prefersReducedMotion) {
      els.forEach(function (el) { el.textContent = el.getAttribute("data-counter"); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        obs.unobserve(el);
        var end = parseInt(el.getAttribute("data-counter"), 10);
        var start = performance.now();
        var DURATION = 1600;
        (function tick(now) {
          var p = clamp((now - start) / DURATION, 0, 1);
          var eased = 1 - Math.pow(1 - p, 4);
          el.textContent = Math.round(eased * end);
          if (p < 1) requestAnimationFrame(tick);
        })(start);
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { obs.observe(el); });
  }

  /* ---------------- engagement stack: depth scaling ---------------- */

  function initStack() {
    var stack = document.getElementById("engagementStack");
    if (!stack || prefersReducedMotion) return;
    var cards = Array.prototype.slice.call(stack.querySelectorAll(".stack__card"));
    if (matchMedia("(max-width: 760px)").matches) return;

    function update() {
      for (var i = 0; i < cards.length - 1; i++) {
        var next = cards[i + 1].getBoundingClientRect();
        var mine = cards[i].getBoundingClientRect();
        // how far the next card has ridden over this one
        var p = clamp((mine.bottom - next.top) / mine.height, 0, 1);
        cards[i].style.transform = "scale(" + (1 - p * 0.05).toFixed(4) + ")";
        cards[i].style.filter = "brightness(" + (1 - p * 0.35).toFixed(3) + ")";
      }
    }
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    update();
  }

  /* ---------------- hero canvas: living supply network ---------------- */

  function initNetwork() {
    var canvas = document.getElementById("networkCanvas");
    if (!canvas || prefersReducedMotion) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    var nodes = [];
    var pulses = [];
    var mouse = { x: -9999, y: -9999 };
    var running = true;

    var TEAL = "83, 224, 196";
    var VIOLET = "124, 108, 255";
    var LINK_DIST = 170;

    function resize() {
      var r = canvas.parentElement.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      var count = clamp(Math.round((W * H) / 16000), 30, 95);
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: 1 + Math.random() * 1.8,
          hub: Math.random() < 0.12
        });
      }
      pulses = [];
    }

    function spawnPulse() {
      // pick a random connected pair to send a "shipment" along
      for (var tries = 0; tries < 12; tries++) {
        var a = nodes[(Math.random() * nodes.length) | 0];
        var b = nodes[(Math.random() * nodes.length) | 0];
        if (a === b) continue;
        var dx = a.x - b.x, dy = a.y - b.y;
        if (dx * dx + dy * dy < LINK_DIST * LINK_DIST) {
          pulses.push({ a: a, b: b, t: 0, speed: 0.006 + Math.random() * 0.01, violet: Math.random() < 0.4 });
          return;
        }
      }
    }

    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);

      // move nodes
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < -20) n.x = W + 20; else if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20; else if (n.y > H + 20) n.y = -20;

        // gentle mouse repulsion
        var mdx = n.x - mouse.x, mdy = n.y - mouse.y;
        var md2 = mdx * mdx + mdy * mdy;
        if (md2 < 150 * 150 && md2 > 0.01) {
          var f = (1 - Math.sqrt(md2) / 150) * 0.5;
          n.x += (mdx / Math.sqrt(md2)) * f;
          n.y += (mdy / Math.sqrt(md2)) * f;
        }
      }

      // edges
      for (i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var a = nodes[i], b = nodes[j];
          var dx = a.x - b.x, dy = a.y - b.y;
          var d2 = dx * dx + dy * dy;
          if (d2 > LINK_DIST * LINK_DIST) continue;
          var d = Math.sqrt(d2);
          var alpha = (1 - d / LINK_DIST) * 0.22;
          // edges near the cursor glow brighter
          var cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
          var mdist = Math.hypot(cx - mouse.x, cy - mouse.y);
          if (mdist < 200) alpha += (1 - mdist / 200) * 0.35;
          ctx.strokeStyle = "rgba(" + (a.hub || b.hub ? VIOLET : TEAL) + "," + alpha.toFixed(3) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // nodes
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        var col = n.hub ? VIOLET : TEAL;
        ctx.fillStyle = "rgba(" + col + "," + (n.hub ? 0.9 : 0.6) + ")";
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.hub ? n.r + 1.2 : n.r, 0, Math.PI * 2);
        ctx.fill();
        if (n.hub) {
          ctx.strokeStyle = "rgba(" + col + ",0.25)";
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r + 6, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // pulses ("shipments" moving along edges)
      if (pulses.length < 14 && Math.random() < 0.2) spawnPulse();
      for (i = pulses.length - 1; i >= 0; i--) {
        var p = pulses[i];
        p.t += p.speed;
        if (p.t >= 1) { pulses.splice(i, 1); continue; }
        var px = p.a.x + (p.b.x - p.a.x) * p.t;
        var py = p.a.y + (p.b.y - p.a.y) * p.t;
        var fade = Math.sin(p.t * Math.PI); // ease in & out
        var pcol = p.violet ? VIOLET : TEAL;
        ctx.fillStyle = "rgba(" + pcol + "," + (0.95 * fade).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(px, py, 2.4, 0, Math.PI * 2);
        ctx.fill();
        // glow
        ctx.fillStyle = "rgba(" + pcol + "," + (0.16 * fade).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(frame);
    }

    addEventListener("mousemove", function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });
    addEventListener("resize", resize);
    document.addEventListener("visibilitychange", function () {
      var wasRunning = running;
      running = !document.hidden && heroVisible;
      if (running && !wasRunning) frame();
    });

    var heroVisible = true;
    new IntersectionObserver(function (entries) {
      var wasRunning = running;
      heroVisible = entries[0].isIntersecting;
      running = heroVisible && !document.hidden;
      if (running && !wasRunning) frame();
    }).observe(canvas);

    resize();
    frame();
  }

  /* ---------------- misc ---------------- */

  function initYear() {
    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------------- boot ---------------- */

  document.addEventListener("DOMContentLoaded", function () {
    initSplitTitles();
    initReveals();
    initManifesto();
    initPreloader();
    initCursor();
    initScrollVelocity();
    initNav();
    initMenu();
    initScramble();
    initMagnetic();
    initMarquee();
    initTilt();
    initCounters();
    initStack();
    initNetwork();
    initYear();
  });
})();
