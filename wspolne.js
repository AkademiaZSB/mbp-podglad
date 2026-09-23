/* ——— narzędzia dostępności ——— */
(function () {
  var el = document.documentElement, KL = "bib-dostepnosc";
  function zapisz(o) { try { localStorage.setItem(KL, JSON.stringify(o)); } catch (e) {} }
  function odczyt() { try { return JSON.parse(localStorage.getItem(KL) || "{}"); } catch (e) { return {}; } }
  var s = odczyt(), skala = s.skala || 1, kontrast = s.kontrast || false;
  function zastosuj() {
    el.style.setProperty("--skala", skala);
    el.setAttribute("data-kontrast", kontrast ? "tak" : "nie");
    var b = document.getElementById("kontrast");
    if (b) {
      b.setAttribute("aria-pressed", kontrast ? "true" : "false");
      // napis musi mowic, co zrobi klikniecie — inaczej nie widac, ze to przelacznik
      b.textContent = kontrast ? "Wyłącz wysoki kontrast" : "Wysoki kontrast";
    }
    zapisz({ skala: skala, kontrast: kontrast });
  }
  function podepnij(id, fn) { var b = document.getElementById(id); if (b) b.onclick = fn; }
  podepnij("wiecej", function () { skala = Math.min(1.4, skala + .1); zastosuj(); });
  podepnij("mniej",  function () { skala = Math.max(.9, skala - .1); zastosuj(); });
  podepnij("reset",  function () { skala = 1; zastosuj(); });
  podepnij("kontrast", function () { kontrast = !kontrast; zastosuj(); });
  zastosuj();
})();

/* ——— wspólne narzędzia ——— */
function bibEsc(t) {
  return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function bibData(x) {
  if (!x) return "";
  try { return new Date(x + "T12:00:00").toLocaleDateString("pl-PL",
    { day: "numeric", month: "long", year: "numeric" }); } catch (e) { return x; }
}

/* ——— treść z panelu ——— */
fetch("/api/tresc", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (d) {
  var p = (d && d.pola) || {};
  document.querySelectorAll("[data-p]").forEach(function (el) {
    var v = p[el.dataset.p]; if (v !== undefined && v !== "") el.textContent = v;
  });
  if (p.telefon) document.querySelectorAll('header a[href^="tel:"]').forEach(function (a) {
    a.href = "tel:" + p.telefon.replace(/\s/g, ""); });
  if (p.email) document.querySelectorAll('header a[href^="mailto:"]').forEach(function (a) {
    a.href = "mailto:" + p.email; });
  [["katalog", p.katalog_link], ["katalog2", p.katalog_link], ["bip", p.bip_link],
   ["bip2", p.bip_link], ["fb", p.facebook_link]].forEach(function (x) {
    var a = document.getElementById(x[0]);
    if (a && x[1]) { a.href = x[1]; a.target = "_blank"; a.rel = "noopener"; }
  });
  var z = (d && d.zdjecia) || {};
  Object.keys(z).forEach(function (k) {
    var sel = { hero: ".powitanie img", onas: ".onas img", g1: ".gal img:nth-child(1)",
                g2: ".gal img:nth-child(2)", g3: ".gal img:nth-child(3)" }[k];
    var im = sel && document.querySelector(sel);
    if (im) im.src = "/api/zdjecie/" + k + "?v=" + z[k];
  });
}).catch(function () {});

/* ——— aktualności ——— */
(function () {
  var siatka = document.getElementById("aktSiatka");
  var lista = document.getElementById("listaAkt");
  var wpis = document.getElementById("wpis");
  if (!siatka && !lista && !wpis) return;

  fetch("/api/aktualnosci", { cache: "no-store" }).then(function (r) { return r.json(); })
    .then(function (d) {
      var w = (d && d.wpisy) || [];
      var pu = document.getElementById("aktPusto");

      if (siatka && w.length) {
        siatka.innerHTML = w.slice(0, 6).map(function (x) {
          var fo = x.foto
            ? '<div class="fo"><img src="/api/akt-foto/' + encodeURIComponent(x.id) + '" alt="" loading="lazy"></div>'
            : '<div class="fo bez"></div>';
          return '<article class="akt-k">' + fo + '<div class="tresc">' +
            (x.data ? '<time datetime="' + bibEsc(x.data) + '">' + bibEsc(bibData(x.data)) + "</time>" : "") +
            '<h3><a href="aktualnosc.html?id=' + encodeURIComponent(x.id) + '">' + bibEsc(x.tytul) + "</a></h3>" +
            (x.tresc ? "<p>" + bibEsc(x.tresc).slice(0, 160) + "</p>" : "") + "</div></article>";
        }).join("");
        if (pu) pu.hidden = true;
      }

      if (lista && w.length) {
        lista.innerHTML = w.map(function (x) {
          var fo = x.foto
            ? '<div class="fo"><img src="/api/akt-foto/' + encodeURIComponent(x.id) + '" alt="" loading="lazy"></div>'
            : '<div class="fo bez"></div>';
          return '<article class="la">' + fo + '<div class="tr">' +
            (x.data ? '<time datetime="' + bibEsc(x.data) + '">' + bibEsc(bibData(x.data)) + "</time>" : "") +
            '<h2><a href="aktualnosc.html?id=' + encodeURIComponent(x.id) + '">' + bibEsc(x.tytul) + "</a></h2>" +
            (x.tresc ? "<p>" + bibEsc(x.tresc).slice(0, 240) + "</p>" : "") + "</div></article>";
        }).join("");
        if (pu) pu.hidden = true;
      }

      if (wpis) {
        var id = new URLSearchParams(location.search).get("id");
        var x = w.filter(function (y) { return y.id === id; })[0];
        if (!x) {
          wpis.innerHTML = "<h1>Nie znaleziono wpisu</h1><p>Ten wpis mógł zostać usunięty.</p>" +
            '<p><a class="wroc" href="aktualnosci.html">← Wszystkie aktualności</a></p>';
          return;
        }
        document.title = x.tytul + " — Miejska Biblioteka Publiczna (przykład)";
        wpis.innerHTML =
          (x.data ? '<p class="wpis-data"><time datetime="' + bibEsc(x.data) + '">' + bibEsc(bibData(x.data)) + "</time></p>" : "") +
          "<h1>" + bibEsc(x.tytul) + "</h1>" +
          (x.foto ? '<img class="wpis-foto" src="/api/akt-foto/' + encodeURIComponent(x.id) + '" alt="">' : "") +
          bibEsc(x.tresc).split("\n").filter(Boolean).map(function (a) { return "<p>" + a + "</p>"; }).join("") +
          '<p><a class="wroc" href="aktualnosci.html">← Wszystkie aktualności</a></p>';
      }
    }).catch(function () {});
})();

/* ——— kalendarium wydarzeń ——— */
(function () {
  var kal = document.getElementById("kalendarz");
  var wyd = document.getElementById("wydPlacowki");
  if (!kal && !wyd) return;

  var MIESIACE = ["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec",
                  "Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];

  function naglowekMiesiaca(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "Bez daty";
    return MIESIACE[d.getMonth()] + " " + d.getFullYear();
  }

  function kafelek(x) {
    var fo = x.foto
      ? '<img src="/api/akt-foto/' + encodeURIComponent(x.id) + '" alt="" loading="lazy">'
      : "";
    var gdzie = x.placowka_nazwa
      ? '<span class="kal-gdzie">' + bibEsc(x.placowka_nazwa) + "</span>" : "";
    return '<article class="kal-w">' +
      '<div class="kal-data"><time datetime="' + bibEsc(x.data || "") + '">' +
        bibEsc(bibData(x.data)) + "</time></div>" +
      '<div class="kal-tr">' + gdzie +
        '<h3><a href="aktualnosc.html?id=' + encodeURIComponent(x.id) + '">' +
        bibEsc(x.tytul) + "</a></h3>" +
        (x.tresc ? "<p>" + bibEsc(x.tresc).slice(0, 190) + "</p>" : "") +
      "</div>" + (fo ? '<div class="kal-fo">' + fo + "</div>" : "") +
      "</article>";
  }

  fetch("/api/aktualnosci", { cache: "no-store" }).then(function (r) { return r.json(); })
    .then(function (d) {
      var w = ((d && d.wpisy) || []).slice().sort(function (a, b) {
        return String(b.data || "").localeCompare(String(a.data || ""));
      });

      /* blok na podstronie placówki */
      if (wyd) {
        var id = wyd.getAttribute("data-placowka");
        var moje = w.filter(function (x) { return x.placowka === id; });
        wyd.innerHTML = moje.length
          ? moje.map(kafelek).join("") +
            '<p class="lid" style="margin-top:14px"><a href="kalendarium.html">Zobacz kalendarium wszystkich placówek →</a></p>'
          : '<p class="lid">W tej placówce nie ma obecnie zaplanowanych wydarzeń. ' +
            '<a href="kalendarium.html">Zobacz kalendarium wszystkich placówek</a>.</p>';
        return;
      }

      /* pełne kalendarium */
      var pu = document.getElementById("kalPusto");
      if (!w.length) return;
      if (pu) pu.hidden = true;

      var filtr = document.getElementById("kalFiltr");
      var gdzie = [];
      w.forEach(function (x) {
        if (x.placowka_nazwa && gdzie.indexOf(x.placowka_nazwa) < 0) gdzie.push(x.placowka_nazwa);
      });

      function rysuj(wybrane) {
        var lista = wybrane ? w.filter(function (x) { return x.placowka_nazwa === wybrane; }) : w;
        var html = "", biezacy = null;
        lista.forEach(function (x) {
          var m = naglowekMiesiaca(x.data);
          if (m !== biezacy) { html += '<h2 class="kal-m">' + bibEsc(m) + "</h2>"; biezacy = m; }
          html += kafelek(x);
        });
        kal.innerHTML = html || '<p class="pusto-akt">Brak wydarzeń w tej placówce.</p>';
      }

      if (filtr && gdzie.length) {
        filtr.innerHTML = '<button class="kal-f akt" data-g="">Wszystkie</button>' +
          gdzie.map(function (g) {
            return '<button class="kal-f" data-g="' + bibEsc(g) + '">' + bibEsc(g) + "</button>";
          }).join("");
        filtr.addEventListener("click", function (e) {
          var b = e.target.closest(".kal-f");
          if (!b) return;
          filtr.querySelectorAll(".kal-f").forEach(function (x) { x.classList.remove("akt"); });
          b.classList.add("akt");
          rysuj(b.getAttribute("data-g") || null);
        });
      }
      rysuj(null);
    }).catch(function () {});
})();
