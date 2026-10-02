# Zwischenmolekulare Kräfte

Interaktive, bewusst vereinfachte Visualisierung der drei zwischenmolekularen Kräfte
(Van-der-Waals-Kräfte, Dipol-Dipol-Anziehung, Wasserstoffbrücken) für den Chemieunterricht.
Die Seite ist eine einzelne HTML-Datei ohne Abhängigkeiten außer den Google Fonts und läuft in jedem modernen Browser.

Zu jeder Kraft gibt es

- eine Schritt-für-Schritt-Animation, wie die Kraft entsteht,
- Teilchensimulationen verschiedener Stoffe bei gleicher Temperatur (fest, flüssig, gasförmig),
- ein Heizexperiment mit Heizkurven, an denen Schmelzen und Sieden abzulesen sind.

Die Simulationen sind zweidimensionale Modelle: Die Temperaturen sind so skaliert, dass die Zustände bei
Raumtemperatur der Realität entsprechen. Übergangspunkte stimmen in Reihenfolge und Größenordnung, nicht exakt.

## Ansehen

`docs/index.html` im Browser öffnen. Mit GitHub Pages (Einstellungen → Pages → Branch `main`, Ordner `/docs`)
ist die Seite direkt als Webseite erreichbar.

## Aufbau

| Datei | Inhalt |
|---|---|
| `src/engine.js` | Molekulardynamik in reduzierten Einheiten (Lennard-Jones, 2-D-Dipole, Wasserstoffbrücken-Modell) |
| `src/app.js` | Oberfläche, Behälter, Phasenerkennung, Heizexperiment, Diagramm |
| `src/origin.js` | Animationen „Wie die Kraft entsteht“ |
| `src/template.html` | Seitengerüst und Styles |
| `tools/build.js` | Baut die einzelne HTML-Datei |
| `tools/fdcheck*.js`, `scan.js`, `heat*.js` | Prüfskripte: Kräfte gegen numerische Ableitung, Temperaturscans zur Kalibrierung |

## Bauen

Node.js ab Version 18, keine Pakete nötig.

```bash
STANDALONE=1 node tools/build.js   # schreibt docs/index.html
node tools/build.js                # schreibt intermolecular-forces.html (ohne <head>, für die Artifact-Umgebung)
node tools/fdcheck.js              # prüft Kräfte und Drehmomente numerisch
node tools/scan.js '{"model":"lj"}' 0.3,0.5,0.7   # Phasenverhalten über der Temperatur
```
