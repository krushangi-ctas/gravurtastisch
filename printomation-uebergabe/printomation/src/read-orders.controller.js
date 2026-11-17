const fs = require('fs');
const path = require('path');
const { createLogger } = require('./utils/logger');
const logger = createLogger('index.log', __filename);

// Sucht rekursiv den ersten Knoten mit image.imageName — bewusst tiefen-unabhängig,
// weil Amazon die Verschachtelung der Customization-Struktur variiert.
// [EN] Recursively searches for the first node with image.imageName — deliberately depth-independent,
// because Amazon varies the nesting of the customization structure.
function findImageName(node) {
  if (!node || typeof node !== 'object') return null;
  if (node.image?.imageName) return node.image.imageName;
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      const found = findImageName(child);
      if (found) return found;
    }
  }
  return null;
}

// Sammelt Dateinamen aus der Customization-Struktur in JSON-Reihenfolge (Pre-Order).
// Die Reihenfolge ist die der Amazon-Flächen (Vorderseite, Rückseite, …) — genau daraus
// werden beim Download bild-1, bild-2, … . pick(node) liefert einen Namen oder null.
// [EN] Collects filenames from the customization structure in JSON order (pre-order).
// The order corresponds to Amazon surfaces (front, back, etc.) — from which
// bild-1, bild-2, etc. are generated during download. pick(node) returns a name or null.
function collectNames(node, pick, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (!Array.isArray(node)) {
    const v = pick(node);
    if (v && !out.includes(v)) out.push(v);
  }
  for (const v of Object.values(node)) {
    if (v && typeof v === 'object') collectNames(v, pick, out);
  }
  return out;
}

// Amazons gerenderte Flächen-Vorschauen ("so sieht das Produkt aus") — bei S01 die
// Vorderseite mit dem Kundenfoto und die Rückseite mit der Gravur.
// [EN] Amazon's rendered surface previews ("what the product looks like") — for S01, the
// front side with customer photo and the back side with engraving.
const findSnapshotNames = (root) =>
  collectNames(root, (n) => (n.type === 'PreviewContainerCustomization' ? n.snapshot?.imageName : null) || null);

// Alle vom Käufer hochgeladenen Fotos. Die behalten beim Download ihren Original-Namen:
// an dem hängt über image.imageName die Zuordnung Gravur ↔ Datei.
// [EN] All photos uploaded by the buyer. They keep their original names upon download:
// the engraving-to-file mapping depends on this via image.imageName.
const findCustomerImageNames = (root) => collectNames(root, (n) => n.image?.imageName || null);

// Die Amazon-JSON eines Artikelordners (item-N/): die .json, die nicht meta.json ist. EINE Regel für
// diesen Scan (danach lädt der Export die Gravurtexte), die Reklamation (index.js) und den ASIN-Check.
// [EN] The Amazon JSON of an item folder (item-N/): the .json file that is not meta.json. ONE unified rule for
// this scan (after which export loads the engraving texts), complaint handling (index.js), and ASIN check.
const artikelJsonName = (dateien) => dateien.find((f) => f.endsWith('.json') && f !== 'meta.json') || null;

async function _scanGroupedOrders() {
  const basePath = path.join(__dirname, 'public');
  const result = [];

  if (!fs.existsSync(basePath)) {
    logger.log('public/ Ordner existiert noch nicht — keine Bestellungen vorhanden.');
    return result;
  }

  // Nur YYYY-MM-DD-Ordner scannen — schließt exports/, .claude/ etc. aus
  // (sonst erscheinen Export-Dateien als Phantom-Bestellungen)
  // [EN] Scan only YYYY-MM-DD folders — excludes exports/, .claude/, etc.
  // (otherwise export files would appear as phantom orders)
  const dateFolders = fs
    .readdirSync(basePath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(dirent.name))
    .map((dirent) => dirent.name);

  for (const dateFolder of dateFolders) {
    const datePath = path.join(basePath, dateFolder);
    const orderFolders = fs
      .readdirSync(datePath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const orderId of orderFolders) {
      const orderPath = path.join(datePath, orderId);
      const orderContents = fs.readdirSync(orderPath, { withFileTypes: true });

      // Nur die item-N-Struktur wird gescannt: downloadAndSaveZip legt ausschließlich item-N-
      // Unterordner an (die alte Struktur ist durch das Auto-Löschen längst verschwunden).
      // [EN] Only the item-N structure is scanned: downloadAndSaveZip creates exclusively item-N
      // subfolders (the old structure has long disappeared due to auto-cleanup).
      const itemFolders = orderContents
        .filter((d) => d.isDirectory() && /^item-\d+$/.test(d.name))
        .map((d) => d.name)
        // numerisch: als Text sortiert stünde item-10 vor item-2
        // [EN] numeric: sorted as text, item-10 would precede item-2
        .sort((a, b) => parseInt(a.slice(5), 10) - parseInt(b.slice(5), 10));

      for (const itemFolder of itemFolders) {
        const itemPath = path.join(orderPath, itemFolder);
        const itemFiles = fs.readdirSync(itemPath);

        const jsonFile = artikelJsonName(itemFiles);

        // meta.json aus item-Ordner lesen
        // [EN] Read meta.json from item folder
        let purchaseDate = null;
        let asin = null;
        const metaFile = path.join(itemPath, 'meta.json');
        if (fs.existsSync(metaFile)) {
          try {
            const meta = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
            purchaseDate = meta.purchaseDate ?? null;
            asin = meta.asin ?? null;
          } catch (e) {
            logger.warn(`meta.json konnte nicht gelesen werden: ${metaFile} — ${e.message}`);
          }
        }

        // Menge + Kundenbild aus JSON lesen
        // [EN] Read quantity + customer image from JSON
        let quantity = 1;
        let imageFile = null;
        if (jsonFile) {
          try {
            const jsonData = JSON.parse(
              fs.readFileSync(path.join(itemPath, jsonFile), 'utf-8')
            );
            if (jsonData.quantity) quantity = jsonData.quantity;
            // Das Kundenbild NAMENTLICH über imageName, nicht „erstes Bild im Ordner": im item-Ordner liegen
            // auch Amazons Oberflächen-Snapshots (Vorder-/Rückseite), die erste Datei wäre oft ein Snapshot —
            // und der wäre in die Gravur gewandert. Fehlt Name oder Datei, lieber gar kein Bild als das falsche.
            // [EN] Customer image BY NAME via imageName, not "first image in folder": item folder also
            // contains Amazon surface snapshots (front/back); the first file would often be a snapshot —
            // which would end up engraved. If name or file is missing, better no image than the wrong one.
            let name = findImageName(jsonData.customizationData);
            // Amazon-PDF-Uploads: zeigt imageName auf eine .pdf, kann der Browser sie nicht als Bild laden
            // (loadImg nimmt nur .jpg/.jpeg/.png, das Gravurfeld bliebe STILL leer). Der Downloader legt beim
            // Entpacken eine gerasterte .png gleichen Namens daneben (pdftoppm); die wird stattdessen ausgeliefert.
            // [EN] Amazon PDF uploads: if imageName points to a .pdf, the browser cannot load it as an image
            // (loadImg only accepts .jpg/.jpeg/.png, leaving engraving field SILENTLY empty). The downloader
            // extracts a rasterized .png of the same name next to it (via pdftoppm); that PNG is served instead.
            if (name && /\.pdf$/i.test(name)) {
              const png = name.replace(/\.pdf$/i, '.png');
              // Normalfall ohne Log-Zeile: /orders liest den ganzen Baum bei jedem Aufruf neu.
              // [EN] Normal case without log entry: /orders re-reads the entire tree on every request.
              if (itemFiles.includes(png)) {
                name = png;
              } else {
                logger.warn(`PDF-Upload in ${itemPath}: ${name} vorhanden, aber kein gerastertes ${png} — Gravurfeld bleibt leer!`);
              }
            }
            if (name && itemFiles.includes(name)) imageFile = name;
            else if (name) logger.warn(`Kundenbild ${name} fehlt in ${itemPath}`);

            // Auffangnetz für UNBEKANNTE PDF-Strukturen: nutzt eine Bestellung einen eigenen Knotentyp (z.B.
            // PdfCustomization), findet findImageName nichts — obwohl die gerasterte Datei im Ordner liegt.
            // Deshalb datei- statt JSON-basiert: zu jeder <X>.pdf legt der Downloader eine <X>.png. Der exakte
            // Namensbezug schließt Verwechslung mit Amazons Snapshots (bild-1, bild-2 …) aus.
            // [EN] Safety net for UNKNOWN PDF structures: if an order uses a custom node type (e.g.
            // PdfCustomization), findImageName finds nothing — even though the rasterized file is in the folder.
            // Therefore file-based instead of JSON-based: for each <X>.pdf, the downloader places an <X>.png.
            // Exact name matching prevents confusion with Amazon snapshots (bild-1, bild-2, etc.).
            if (!imageFile) {
              const pdfIn = itemFiles.find(f => /\.pdf$/i.test(f));
              const pngOfPdf = pdfIn && pdfIn.replace(/\.pdf$/i, '.png');
              if (pngOfPdf && itemFiles.includes(pngOfPdf)) {
                imageFile = pngOfPdf;
                logger.warn(`${itemPath}: kein Kundenbild in der JSON gefunden, aber ${pdfIn} liegt vor — nutze ersatzweise ${pngOfPdf}. Amazons PDF-Struktur prüfen!`);
              }
            }
          } catch (e) {
            logger.warn(`JSON konnte nicht gelesen werden: ${path.join(itemPath, jsonFile)} — ${e.message}`);
          }
        }

        // Dateipfade relativ als date/orderId/itemFolder/filename
        // [EN] File paths relative as date/orderId/itemFolder/filename
        const files = [];
        if (imageFile)
          files.push({ file: `${itemFolder}/${imageFile}` });
        if (jsonFile)
          files.push({ file: `${itemFolder}/${jsonFile}` });

        if (files.length === 0) continue;

        result.push({
          date: dateFolder,
          id: orderId,
          itemFolder,  // z.B. "item-1" — für eindeutige Identifikation / [EN] e.g. "item-1" — for unique identification
          quantity,
          purchaseDate,
          asin,
          files,
        });
      }
    }
  }

  return result;
}

// Kurzlebiger Cache (2 s): fängt Mehrfach-Scans des public-Baums bei schnell aufeinanderfolgenden
// /orders-Aufrufen ab; läuft von selbst ab (TTL).
// [EN] Short-lived cache (2s): prevents repeated scans of public/ directory tree during rapid consecutive
// /orders requests; expires automatically (TTL).
let _ordersCache = null;
let _ordersCacheTime = 0;
const ORDERS_CACHE_TTL = 2000;

async function getGroupedOrders() {
  if (_ordersCache && Date.now() - _ordersCacheTime < ORDERS_CACHE_TTL) {
    return _ordersCache;
  }
  const result = await _scanGroupedOrders();
  _ordersCache = result;
  _ordersCacheTime = Date.now();
  return result;
}

module.exports = getGroupedOrders;
module.exports.findImageName = findImageName;
module.exports.findSnapshotNames = findSnapshotNames;
module.exports.findCustomerImageNames = findCustomerImageNames;
module.exports.artikelJsonName = artikelJsonName;
