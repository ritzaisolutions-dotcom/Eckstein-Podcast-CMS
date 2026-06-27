# Eckstein CRM — Infobox Generator Integration

## Kontext
Das bestehende CRM ist eine **single-file HTML-Applikation** mit Tab-Navigation.
Ein Tab davon ist der Thumbnail-Builder.
Ziel: Neuen Tab "Infobox Generator" hinzufügen, der PNG-Overlays für CapCut-Einblendungen erstellt.

---

## Schritt 1 — Abhängigkeiten in `<head>` prüfen und ergänzen

Öffne das HTML-File. Im `<head>` Block:

Prüfe ob `Cinzel` und `Cormorant Garamond` bereits geladen werden.
Falls nicht, füge hinzu:

```html
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&display=swap" rel="stylesheet">
```

Füge **immer** hinzu (vor dem schließenden `</head>`):

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
```

---

## Schritt 2 — Nav-Item hinzufügen

Finde die Tab-Navigation (suche nach `showTab` oder `nav-btn` oder ähnlichem).
Füge direkt neben dem Thumbnail-Tab ein:

```html
<button class="nav-btn" id="tab-overlay" onclick="showTab('overlay')">
  Infobox Generator
</button>
```

---

## Schritt 3 — Tab-Switcher prüfen

Stelle sicher dass `showTab()` generisch funktioniert.
Es muss Sektionen per ID `sec-{name}` ein/ausblenden und Tabs per ID `tab-{name}` aktivieren.

Wenn die Funktion noch hartcodiert ist, ersetze sie durch:

```javascript
function showTab(name) {
  document.querySelectorAll('.tab-section').forEach(s => s.style.display = 'none');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('sec-' + name).style.display = '';
  document.getElementById('tab-' + name).classList.add('active');
}
```

Stelle sicher dass alle bestehenden Sektionen die Klasse `tab-section` haben und IDs nach dem Muster `sec-thumbnail`, `sec-crm` etc. tragen. Wenn nicht, passe die IDs entsprechend an.

---

## Schritt 4 — Neue Sektion einfügen

Suche nach dem letzten `</section>` vor dem schließenden `</main>` oder `</div>` des Content-Bereichs.
Füge direkt davor ein:

```html
<section id="sec-overlay" class="tab-section" style="display:none;">

  <div id="ov-app">

    <!-- ── SIDEBAR ── -->
    <div id="ov-sb">
      <div id="ov-sb-hd">
        <span class="ov-gem" aria-hidden="true"></span>
        <span id="ov-sb-title">Infobox Generator</span>
      </div>

      <div id="ov-sb-bd">

        <div class="ov-cg">
          <label>Typ</label>
          <div class="ov-g3">
            <button class="ov-xb on" data-t="DEFINITION" onclick="ovSetT(this)">Defin.</button>
            <button class="ov-xb" data-t="STUDIE"     onclick="ovSetT(this)">Studie</button>
            <button class="ov-xb" data-t="ZITAT"      onclick="ovSetT(this)">Zitat</button>
            <button class="ov-xb" data-t="INFO"       onclick="ovSetT(this)">Info</button>
            <button class="ov-xb" data-t="LINK"       onclick="ovSetT(this)">Link</button>
            <button class="ov-xb" data-t="FAKT"       onclick="ovSetT(this)">Fakt</button>
          </div>
        </div>

        <div class="ov-cg">
          <label>Format</label>
          <div class="ov-g2">
            <button class="ov-fb on" data-f="card"  onclick="ovSetF(this)">Karte</button>
            <button class="ov-fb"    data-f="strip" onclick="ovSetF(this)">Einblendung</button>
          </div>
        </div>

        <div class="ov-sep"></div>

        <div class="ov-cg">
          <label>Begriff / Titel</label>
          <input type="text" id="ov-iH" placeholder="z.B. Gerechtigkeit" oninput="ovSync()">
        </div>

        <div class="ov-cg">
          <label>Beschreibung</label>
          <textarea id="ov-iD" placeholder="Definition, Kernaussage, Zitat..." oninput="ovSync()"></textarea>
        </div>

        <div class="ov-cg">
          <label>Quelle</label>
          <input type="text" id="ov-iS" placeholder="Stanford Enc., 2023" oninput="ovSync()">
        </div>

      </div>

      <div id="ov-sb-ft">
        <button id="ov-eB" onclick="ovExp()">↓ PNG Exportieren</button>
        <button id="ov-aniB" onclick="ovAni()">▶ Animation</button>
      </div>
    </div>

    <!-- ── PREVIEW ── -->
    <div id="ov-pv">
      <div class="ov-pvl">Vorschau — 16 : 9</div>

      <div id="ov-fr">
        <div id="ov-fr-wm">ECKSTEIN PODCAST</div>

        <!-- CARD -->
        <div id="ov-cw">
          <div id="ov-card">
            <div class="ov-oct">
              <span class="ov-gem" style="width:4px;height:4px;" aria-hidden="true"></span>
              <span class="ov-octl" id="ov-cTL">Definition</span>
            </div>
            <div class="ov-och" id="ov-cH">Begriff eingeben</div>
            <div class="ov-ocd" id="ov-cD" style="display:none;"></div>
            <div class="ov-ocs" id="ov-cS" style="display:none;">
              <div class="ov-ocsl"></div>
              <span id="ov-cST"></span>
            </div>
            <div class="ov-ocbl"></div>
          </div>
        </div>

        <!-- STRIP -->
        <div id="ov-sw" style="display:none;">
          <div id="ov-strip">
            <div class="ov-osb">
              <span class="ov-gem" style="width:6px;height:6px;" aria-hidden="true"></span>
              <div class="ov-osbl" id="ov-sTL">Definition</div>
            </div>
            <div class="ov-osdv"></div>
            <div class="ov-osc">
              <div class="ov-osh" id="ov-sH">Begriff eingeben</div>
              <div class="ov-osd" id="ov-sD" style="display:none;"></div>
              <div class="ov-oss" id="ov-sS" style="display:none;">
                <div class="ov-ossd"></div>
                <span id="ov-sST"></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="ov-pvh">PNG exportieren · In CapCut importieren · Größe &amp; Position frei wählen</div>
    </div>

  </div>

</section>
```

---

## Schritt 5 — CSS einfügen

Füge vor dem schließenden `</style>` Tag (oder in einem neuen `<style>` Block vor `</head>`) ein.
Alle Klassen sind mit `ov-` präfixiert — kein Konflikt mit bestehendem CSS.

```css
/* ── ECKSTEIN INFOBOX GENERATOR ── */
#ov-app {
  display: flex;
  height: 520px;
  background: #020407;
  border-radius: 6px;
  overflow: hidden;
}

#ov-sb {
  width: 210px;
  flex-shrink: 0;
  background: #07111e;
  border-right: 1px solid rgba(201,168,76,.13);
  display: flex;
  flex-direction: column;
}

#ov-sb-hd {
  padding: 10px 13px;
  border-bottom: 1px solid rgba(201,168,76,.12);
  display: flex;
  align-items: center;
  gap: 6px;
}

#ov-sb-title {
  font-family: 'Cinzel', serif;
  font-size: 8px;
  letter-spacing: 3px;
  color: #c9a84c;
  text-transform: uppercase;
  font-weight: 400;
}

#ov-sb-bd {
  flex: 1;
  overflow-y: auto;
  padding: 11px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

#ov-sb-bd::-webkit-scrollbar { width: 2px; }
#ov-sb-bd::-webkit-scrollbar-thumb { background: rgba(201,168,76,.15); }

#ov-sb-ft {
  padding: 11px;
  border-top: 1px solid rgba(201,168,76,.1);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ov-cg { display: flex; flex-direction: column; gap: 3.5px; }

.ov-cg > label {
  font-family: 'Cinzel', serif;
  font-size: 6.5px;
  letter-spacing: 2.5px;
  color: rgba(201,168,76,.45);
  text-transform: uppercase;
}

.ov-cg input,
.ov-cg textarea {
  background: rgba(5,16,31,.65);
  border: 1px solid rgba(25,45,80,.7);
  border-radius: 2px;
  color: #f5eed8;
  padding: 6px 8px;
  font-family: 'Cormorant Garamond', serif;
  font-size: 12px;
  outline: none;
  transition: border-color .15s;
  width: 100%;
}

.ov-cg input:focus,
.ov-cg textarea:focus { border-color: rgba(201,168,76,.5); }

.ov-cg input::placeholder,
.ov-cg textarea::placeholder { color: rgba(255,255,255,.18); }

.ov-cg textarea { resize: none; height: 52px; line-height: 1.4; }

.ov-sep { height: 1px; background: rgba(201,168,76,.08); }

.ov-g3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; }
.ov-g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }

.ov-xb,
.ov-fb {
  padding: 6px 2px;
  border: 1px solid rgba(25,45,80,.7);
  border-radius: 2px;
  background: transparent;
  color: rgba(255,255,255,.2);
  cursor: pointer;
  font-family: 'Cinzel', serif;
  font-size: 6px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  transition: all .13s;
  text-align: center;
}

.ov-xb.on,
.ov-fb.on {
  border-color: #c9a84c;
  color: #c9a84c;
  background: rgba(201,168,76,.07);
}

.ov-xb:hover:not(.on),
.ov-fb:hover:not(.on) {
  color: rgba(201,168,76,.4);
  border-color: rgba(201,168,76,.22);
}

#ov-eB {
  padding: 10px;
  background: #c9a84c;
  color: #05101f;
  border: none;
  border-radius: 2px;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  font-size: 8px;
  letter-spacing: 2px;
  text-transform: uppercase;
  font-weight: 700;
  transition: opacity .15s;
  width: 100%;
}

#ov-eB:hover { opacity: .82; }
#ov-eB:disabled { opacity: .4; cursor: not-allowed; }
#ov-eB.ok { background: #2a5e43; color: #d4f0e2; }

#ov-aniB {
  padding: 7px;
  background: transparent;
  color: rgba(201,168,76,.4);
  border: 1px solid rgba(201,168,76,.13);
  border-radius: 2px;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  font-size: 7.5px;
  letter-spacing: 1.8px;
  text-transform: uppercase;
  transition: all .15s;
  width: 100%;
}

#ov-aniB:hover { color: #c9a84c; border-color: rgba(201,168,76,.38); }

.ov-gem {
  display: inline-block;
  background: #c9a84c;
  transform: rotate(45deg);
  flex-shrink: 0;
  width: 5px;
  height: 5px;
}

#ov-pv {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: #020407;
  gap: 9px;
}

.ov-pvl {
  font-family: 'Cinzel', serif;
  font-size: 7px;
  letter-spacing: 3px;
  color: rgba(255,255,255,.07);
  text-transform: uppercase;
}

.ov-pvh {
  font-family: 'Cinzel', serif;
  font-size: 6px;
  letter-spacing: 1.8px;
  color: rgba(201,168,76,.16);
  text-transform: uppercase;
  text-align: center;
  line-height: 1.9;
}

#ov-fr {
  width: 100%;
  aspect-ratio: 16 / 9;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(201,168,76,.05);
  background: linear-gradient(148deg, #111827 0%, #07101c 55%, #030810 100%);
}

#ov-fr-wm {
  position: absolute;
  top: 44%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: 'Cinzel', serif;
  font-size: 10px;
  color: rgba(255,255,255,.025);
  letter-spacing: 9px;
  white-space: nowrap;
  pointer-events: none;
}

#ov-cw {
  position: absolute;
  bottom: 8%;
  left: 5%;
  width: 44%;
}

#ov-card {
  background: rgba(5,16,31,.97);
  border-left: 3px solid #c9a84c;
  border-top: 1px solid rgba(201,168,76,.35);
  padding: 9px 11px 10px 10px;
}

.ov-oct { display: flex; align-items: center; gap: 4px; margin-bottom: 4px; }

.ov-octl {
  font-family: 'Cinzel', serif;
  font-size: 5.5px;
  letter-spacing: 3px;
  color: #c9a84c;
  text-transform: uppercase;
}

.ov-och {
  font-family: 'Cinzel', serif;
  font-size: 12.5px;
  font-weight: 600;
  color: #f5eed8;
  letter-spacing: .2px;
  line-height: 1.2;
  margin-bottom: 3.5px;
}

.ov-ocd {
  font-family: 'Cormorant Garamond', serif;
  font-size: 10px;
  color: rgba(245,238,216,.58);
  line-height: 1.5;
  font-style: italic;
  margin-bottom: 4px;
}

.ov-ocs {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'Cormorant Garamond', serif;
  font-size: 8.5px;
  color: rgba(201,168,76,.68);
}

.ov-ocsl { width: 10px; height: 1px; background: rgba(201,168,76,.5); flex-shrink: 0; }

.ov-ocbl {
  height: 1px;
  background: linear-gradient(90deg, rgba(201,168,76,.13), transparent 55%);
  margin-top: 6px;
}

#ov-sw {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}

#ov-strip {
  background: linear-gradient(90deg, rgba(5,16,31,.97) 0%, rgba(5,16,31,.88) 55%, rgba(5,16,31,0) 100%);
  border-left: 3px solid #c9a84c;
  border-top: 1px solid rgba(201,168,76,.3);
  padding: 9px 16px 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.ov-osb { display: flex; flex-direction: column; align-items: center; gap: 3px; flex-shrink: 0; }

.ov-osbl {
  font-family: 'Cinzel', serif;
  font-size: 5px;
  letter-spacing: 2.5px;
  color: #c9a84c;
  text-transform: uppercase;
  white-space: nowrap;
}

.ov-osdv {
  width: 1px;
  height: 28px;
  background: linear-gradient(180deg, transparent, rgba(201,168,76,.32), transparent);
  flex-shrink: 0;
}

.ov-osc { flex: 1; display: flex; flex-direction: column; gap: 2px; }

.ov-osh {
  font-family: 'Cinzel', serif;
  font-size: 11px;
  font-weight: 600;
  color: #f5eed8;
  line-height: 1.2;
}

.ov-osd {
  font-family: 'Cormorant Garamond', serif;
  font-size: 8.5px;
  color: rgba(245,238,216,.55);
  font-style: italic;
  line-height: 1.35;
}

.ov-oss {
  display: flex;
  align-items: center;
  gap: 3.5px;
  font-family: 'Cormorant Garamond', serif;
  font-size: 7.5px;
  color: rgba(201,168,76,.62);
  margin-top: 1px;
}

.ov-ossd {
  width: 3px;
  height: 3px;
  background: rgba(201,168,76,.6);
  border-radius: 50%;
  flex-shrink: 0;
}

@keyframes ovFadeUp {
  from { opacity: 0; transform: translateY(9px); }
  to   { opacity: 1; transform: translateY(0);   }
}

@keyframes ovFadeLft {
  from { opacity: 0; transform: translateX(-10px); }
  to   { opacity: 1; transform: translateX(0);     }
}

.ov-a-up  { animation: ovFadeUp  .32s cubic-bezier(.21,.61,.35,1) forwards; }
.ov-a-lft { animation: ovFadeLft .32s cubic-bezier(.21,.61,.35,1) forwards; }
```

---

## Schritt 6 — JavaScript einfügen

Füge vor dem schließenden `</script>` Tag (oder in einem neuen `<script>` Block vor `</body>`) ein.
Alle Funktionen sind mit `ov` präfixiert — kein Konflikt.

```javascript
// ── ECKSTEIN INFOBOX GENERATOR ──
(function () {
  const OV_TN = {
    DEFINITION: 'Definition',
    STUDIE:     'Studie',
    ZITAT:      'Zitat',
    INFO:       'Info',
    LINK:       'Link',
    FAKT:       'Fakt',
  };

  let ovT = 'DEFINITION';
  let ovF = 'card';

  window.ovSetT = function (b) {
    document.querySelectorAll('.ov-xb').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    ovT = b.dataset.t;
    const n = OV_TN[ovT];
    document.getElementById('ov-cTL').textContent = n;
    document.getElementById('ov-sTL').textContent = n;
  };

  window.ovSetF = function (b) {
    document.querySelectorAll('.ov-fb').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    ovF = b.dataset.f;
    document.getElementById('ov-cw').style.display = ovF === 'card'  ? '' : 'none';
    document.getElementById('ov-sw').style.display = ovF === 'strip' ? '' : 'none';
  };

  window.ovSync = function () {
    const h = document.getElementById('ov-iH').value.trim();
    const d = document.getElementById('ov-iD').value.trim();
    const s = document.getElementById('ov-iS').value.trim();

    document.getElementById('ov-cH').textContent = h || 'Begriff eingeben';
    const cd = document.getElementById('ov-cD');
    cd.textContent = d; cd.style.display = d ? '' : 'none';
    const cs = document.getElementById('ov-cS');
    cs.style.display = s ? '' : 'none';
    document.getElementById('ov-cST').textContent = s;

    document.getElementById('ov-sH').textContent = h || 'Begriff eingeben';
    const sd = document.getElementById('ov-sD');
    sd.textContent = d; sd.style.display = d ? '' : 'none';
    const ss = document.getElementById('ov-sS');
    ss.style.display = s ? '' : 'none';
    document.getElementById('ov-sST').textContent = s;
  };

  window.ovAni = function () {
    const id  = ovF === 'card' ? 'ov-card'  : 'ov-strip';
    const cls = ovF === 'card' ? 'ov-a-up'  : 'ov-a-lft';
    const el  = document.getElementById(id);
    el.classList.remove('ov-a-up', 'ov-a-lft');
    void el.offsetHeight;
    el.classList.add(cls);
  };

  window.ovExp = async function () {
    const el  = document.getElementById(ovF === 'card' ? 'ov-card' : 'ov-strip');
    const btn = document.getElementById('ov-eB');
    btn.textContent = 'Exportiere...';
    btn.disabled = true;

    try {
      await document.fonts.ready;
      const cv = await html2canvas(el, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      const a = document.createElement('a');
      a.download = 'eckstein-' + ovF + '-' + OV_TN[ovT].toLowerCase() + '.png';
      a.href = cv.toDataURL('image/png');
      a.click();
      btn.classList.add('ok');
      btn.textContent = '✓ Exportiert!';
      setTimeout(() => {
        btn.classList.remove('ok');
        btn.textContent = '↓ PNG Exportieren';
        btn.disabled = false;
      }, 2200);
    } catch (e) {
      alert('Export fehlgeschlagen: ' + e.message);
      btn.textContent = '↓ PNG Exportieren';
      btn.disabled = false;
    }
  };
})();
```

---

## Checkliste nach Integration

- [ ] Tab erscheint in Navigation
- [ ] Tab schaltet korrekt um (andere Tabs verstecken sich)
- [ ] Fonts laden (Cinzel + Cormorant Garamond sichtbar)
- [ ] Typ-Buttons selektieren korrekt
- [ ] Format-Toggle wechselt Card/Strip
- [ ] Texteingabe aktualisiert Vorschau live
- [ ] Animation-Button spielt Einblendung ab
- [ ] PNG-Export lädt Datei herunter (Konsolencheck auf Fehler)
- [ ] Keine CSS-Konflikte mit bestehendem Styling (Devtools prüfen)

---

## Falls der Tab-Switcher anders aufgebaut ist

Wenn das CRM kein `showTab()`-System hat sondern z.B. ein Router-System oder Klassen-Toggle, passe den Nav-Button entsprechend an und zeige/verstecke `#sec-overlay` mit derselben Methode wie die anderen Sektionen.
