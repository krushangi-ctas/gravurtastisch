import { BlogItem } from "./api";

function createLexicalDoc(paragraphs: Array<{ type?: string; tag?: string; text?: string; items?: string[] }>) {
  const children = paragraphs.map((p) => {
    if (p.type === "heading") {
      return {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: p.text || "",
            type: "text",
            version: 1,
          },
        ],
        tag: p.tag || "h2",
        direction: null,
        format: "",
        indent: 0,
        type: "heading",
        version: 1,
      };
    }
    if (p.type === "quote") {
      return {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 2,
                mode: "normal",
                style: "",
                text: p.text || "",
                type: "text",
                version: 1,
              },
            ],
            direction: null,
            format: "",
            indent: 0,
            textFormat: 2,
            textStyle: "",
            type: "paragraph",
            version: 1,
          },
        ],
        direction: null,
        format: "",
        indent: 0,
        textFormat: 2,
        type: "quote",
        version: 1,
      };
    }
    if (p.type === "list" && Array.isArray(p.items)) {
      const listItems = p.items.map((item, idx) => ({
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: item,
            type: "text",
            version: 1,
          },
        ],
        indent: 0,
        value: idx + 1,
        direction: null,
        format: "",
        type: "listitem",
        version: 1,
      }));

      return {
        children: listItems,
        listType: "bullet",
        start: 1,
        tag: "ul",
        direction: null,
        format: "",
        indent: 0,
        type: "list",
        version: 1,
      };
    }
    return {
      children: [
        {
          detail: 0,
          format: 0,
          mode: "normal",
          style: "",
          text: p.text || "",
          type: "text",
          version: 1,
        },
      ],
      direction: null,
      format: "",
      indent: 0,
      textFormat: 0,
      textStyle: "",
      type: "paragraph",
      version: 1,
    };
  });

  return {
    root: {
      children,
      direction: null,
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}

export interface LocalizedBlogContent {
  blog_title: string;
  short_description: string;
  description: any;
}

export const GERMAN_BLOGS: Record<string, LocalizedBlogContent> = {
  "automate-amazon-custom-orders-into-vector-files-svg-dxf": {
    blog_title: "So automatisieren Sie Amazon Custom-Bestellungen in maschinenfertige Vektordateien (SVG & DXF)",
    short_description: "Keine manuelle Vektorisierung von Kundentexten und Monogrammen in Illustrator mehr: Erfahren Sie, wie Printomation Amazon Custom JSON sekundenschnell in kalibrierte SVG- und DXF-Dateien umwandelt.",
    description: createLexicalDoc([
      { type: "paragraph", text: "Für E-Commerce-Händler, die sich auf lasergravierte Geschenke, individuelle Schilder und personalisierte Produkte spezialisiert haben, bietet Amazon Custom ein enormes Umsatzpotenzial. Die manuelle Aufbereitung jeder einzelnen Bestellung in Adobe Illustrator oder CorelDraw bremst jedoch die gesamte Produktion aus." },
      { type: "heading", tag: "h2", text: "Der Flaschenhals in der Druckvorstufe" },
      { type: "paragraph", text: "Wenn ein Kunde bei Amazon einen personalisierten Artikel bestellt, erhält der Verkäufer Rohdaten mit Textzeilen, Schriftarten und Koordinaten. Traditionell muss ein Grafiker oder Maschinenbediener diesen Text manuell in Vektorprogramme übertragen, Schriften auswählen, Buchstabenabstände anpassen und in Kurven umwandeln. Dieser Aufwand verschlingt 5 bis 15 Minuten pro Auftrag." },
      { type: "heading", tag: "h2", text: "Wie Printomation die Vektorumwandlung automatisiert" },
      { type: "paragraph", text: "Printomation verbindet sich über die offizielle Amazon SP-API direkt mit Ihrem Seller Central. Sobald eine Bestellung autorisiert ist, durchläuft sie eine vollautomatische Vorstufen-Pipeline:" },
      {
        type: "list",
        items: [
          "Automatische Kurvenkonvertierung: Wandelt Texte sofort in Vektorkurven um, sodass an der Produktionsmaschine niemals Schriftarten fehlen.",
          "Begrenzungsrahmen-Beschränkung: Erzwingt vordefinierte Sicherheitszonen für Becher, Holzschilder oder Handyhüllen ohne manuelles Nachskalieren.",
          "Mehrschichtiger DXF- & SVG-Export: Trennt Schnittlinien (Rot), Anritzlinien (Blau) und Gravurflächen (Schwarz) für LightBurn und EZCad.",
        ],
      },
      { type: "quote", text: "Die automatisierte Vektorerstellung senkt den Zeitaufwand von 10 Minuten auf unter 5 Sekunden pro Auftrag. Damit fertigen Werkstätten hunderte Aufträge täglich ohne zusätzliches Personal." },
      { type: "heading", tag: "h2", text: "Direkter Vorteil für Maschinenbediener" },
      { type: "paragraph", text: "Mit vorkalibrierten SVG- und DXF-Dateien lädt der Bediener das fertige Produktionspaket direkt in die Laser- oder Fräsersoftware und startet den Auftrag. Null Tippfehler, perfekte Monogramme und 100 % Übereinstimmung mit den Wünschen des Käufers." },
    ]),
  },
  "connecting-amazon-sp-api-end-manual-csv-copy-pasting": {
    blog_title: "Amazon SP-API anbinden: Das Ende des manuellen CSV-Kopierens für personalisierte Produkte",
    short_description: "Schritt-für-Schritt-Leitfaden: Wie offizielle LWA-OAuth- und SP-API-Webhooks Kundenanpassungen in Echtzeit direkt an Ihre Druck- und Lasermaschinen übertragen.",
    description: createLexicalDoc([
      { type: "paragraph", text: "Sich auf manuelle CSV-Berichtsdownloads aus dem Seller Central zu verlassen, ist langsam, fehleranfällig und verzögert die Fertigung um Stunden. Die offizielle Amazon Selling Partner API (SP-API) bietet eine zeitgemäße Echtzeit-Alternative." },
      { type: "heading", tag: "h2", text: "Die Risiken manueller Tabellenkalkulationen" },
      { type: "paragraph", text: "Beim CSV-Export führen Anführungszeichen, Umlaute (ä, ö, ü, ß) oder Kommas häufig dazu, dass Tabellenspalten verrutschen. Werkstattmitarbeiter kopieren versehentlich falsche Texte, was zu teuren Fehldrucken und unzufriedenen Kunden führt." },
      { type: "heading", tag: "h2", text: "Direkte SP-API-Integration via Login with Amazon (LWA)" },
      { type: "paragraph", text: "Printomation verbindet sich über das offizielle OAuth 2.0-Verfahren von Amazon. Sobald verknüpft, erhält das System Push-Benachrichtigungen im Moment des Bestelleingangs:" },
      {
        type: "list",
        items: [
          "Echtzeit-Webhooks: Kein manuelles Herunterladen und Zusammenführen von Berichten mehr nötig.",
          "Vollständige Amazon TOS-Konformität: Offizielle tokenisierte Schnittstellen verhindern Kontosperrungen durch unzulässiges Web-Scraping.",
          "Datensicherheit: Entspricht den strengen Amazon Data Protection Policies (DPP) mit AES-256-Verschlüsselung.",
        ],
      },
      { type: "quote", text: "Dank Echtzeit-Webhooks liegt die fertige Produktionsdatei bereits auf dem Werkstattrechner bereit, noch bevor der Mitarbeiter die Lasermaschine erreicht." },
      { type: "heading", tag: "h2", text: "In unter 5 Minuten einsatzbereit" },
      { type: "paragraph", text: "Die Anbindung Ihres Amazon-Shops an Printomation erfolgt mit wenigen Klicks im Seller Central. Danach fließen alle Anpassungsdaten ohne Umwege direkt in die Fertigung." },
    ]),
  },
  "pre-press-safe-zones-bleed-management-laser-engravers": {
    blog_title: "Druckvorstufen-Sicherheitszonen & Beschnittzugabe für Trinkbecher, Holz & Acryl",
    short_description: "Vermeiden Sie Ausschuss und Laserfehler auf Rundgravuren: Wie ASIN-Vorlagen Begrenzungsrahmen, Randabstände und Wölbungskorrekturen vollautomatisch durchsetzen.",
    description: createLexicalDoc([
      { type: "paragraph", text: "In der individualisierten Fertigung ist verdorbenes Rohmaterial der schnellste Weg, Gewinnmargen zu vernichten. Ein Laserfehler auf einem hochwertigen Thermobecher kostet schnell 15 bis 25 Euro Materialwert." },
      { type: "heading", tag: "h2", text: "Warum Wölbungen und Drehvorrichtungen Fehler begünstigen" },
      { type: "paragraph", text: "Gravuren auf Trinkbechern, Gläsern oder Stiften erfordern millimetergenaue Rücksichtnahme auf Wölbungen, Griffe und Ränder. Geben Kunden besonders lange Namen ein, ragen diese ohne Sicherheitsbeschränkungen in den Randbereich." },
      { type: "heading", tag: "h2", text: "Automatische Sicherheitszonen in Printomation" },
      { type: "paragraph", text: "Mit der ASIN-Vorlagen-Engine von Printomation definieren Sie einmalig feste Begrenzungsrahmen und Mindestabstände:" },
      {
        type: "list",
        items: [
          "Dynamische Textskalierung: Reduziert die Schriftgröße automatisch und gleichmäßig, damit Texte immer im sicheren Gravurbereich bleiben.",
          "Seitenverhältnis-Sperre: Verhindert unansehnliches horizontales oder vertikales Verzerren von Monogrammen und Logos.",
          "Drehachsen-Puffer: Hält standardmäßig 15 mm Sicherheitsabstand zu Becherkanten und Konturlinien ein.",
        ],
      },
      { type: "quote", text: "Ein einziger verdorbener Becher kostet 18 Euro plus Nachversand. Automatisierte Schutzbereiche garantieren, dass Gravuren niemals über den Rand laufen." },
      { type: "heading", tag: "h2", text: "Einmal einrichten, dauerhaft profitieren" },
      { type: "paragraph", text: "Hinterlegen Sie Ihre Produktmaße einmalig. Ab diesem Moment prüft das System jeden Kundenwunsch automatisch, bevor die Gravurdatei erzeugt wird." },
    ]),
  },
  "handling-buyer-photo-uploads-automated-dpi-verification": {
    blog_title: "Kunden-Fotouploads verarbeiten: Automatische DPI-Prüfung & Hintergrundentfernung",
    short_description: "Niedrig aufgelöste Kundenfotos führen zu Reklamationen. Erfahren Sie, wie Vorabprüfungen unscharfe Bilder filtern und 300+ DPI-Rasterdaten für den UV-Druck vorbereiten.",
    description: createLexicalDoc([
      { type: "paragraph", text: "Fotogeschenke auf Amazon - wie Acrylaufsteller, Schieferplatten und Leinwände - erfreuen sich riesiger Nachfrage. Doch die Qualität der hochgeladenen Käuferfotos schwankt enorm zwischen hochauflösenden Porträts und verpixelten Screenshots." },
      { type: "heading", tag: "h2", text: "Das Ärgernis unscharfer Ausdrucke" },
      { type: "paragraph", text: "Druckt ein Mitarbeiter ein Bild mit nur 72 DPI auf Acryl, wirkt das Ergebnis pixelig und unscharf. Der Käufer reklamiert den Artikel, stellt einen A-bis-z-Garantieantrag und hinterlässt eine 1-Sterne-Bewertung." },
      { type: "heading", tag: "h2", text: "Automatische Vorabprüfung der Bildauflösung" },
      { type: "paragraph", text: "Printomation prüft eingehende Fotos sofort auf Basis der tatsächlichen Druckabmessungen der jeweiligen ASIN:" },
      {
        type: "list",
        items: [
          "DPI-Vorabprüfung: Garantiert mindestens 300 DPI Druckauflösung vor der Freigabe für UV-Drucker.",
          "Intelligente Hintergrundmaskierung: Freistellen von Personen für kristallklare Acrylaufsteller und Holzgeschenke.",
          "Optimierte Rasterung: Erzeugt 1-Bit-Dithering-Rasterbilder speziell kalibriert für Faser- und CO2-Laser.",
        ],
      },
      { type: "quote", text: "Schluss mit dem Rätselraten bei Kundenfotos: Unsere Vorabprüfung erkennt unzureichende Auflösungen sofort, bevor Druckzeit und teure Materialien verschwendet werden." },
      { type: "heading", tag: "h2", text: "Geschützte Verkäuferbewertung & Top-Margen" },
      { type: "paragraph", text: "Durch standardisierte Fotovorstufen reduzieren Sie kundenbezogene Rückgaben drastisch und liefern täglich makellose Druckerzeugnisse ab." },
    ]),
  },
  "eliminating-misprints-asin-templates-prevent-typing-errors": {
    blog_title: "Fehldrucke eliminieren: Wie ASIN-Vorlagen teure Tipp- und Layoutfehler verhindern",
    short_description: "Beim manuellen Abtippen von Namen entstehen bei 4 % aller Gravuren Tippfehler. So sperrt automatisierter Satz Schriftarten, Kerning und Text direkt aus der Bestellung.",
    description: createLexicalDoc([
      { type: "paragraph", text: "Menschliche Fehler sind der größte verdeckte Kostenfaktor bei personalisierten Produkten. Erfahrungswerte belegen: Wenn Mitarbeiter Kundennamen oder Widmungen manuell abtippen, weisen 3 % bis 6 % der Artikel Fehler auf." },
      { type: "heading", tag: "h2", text: "Die tatsächlichen Kosten eines Rechtschreibfehlers" },
      { type: "paragraph", text: "Ein Tippfehler bedeutet nicht nur ein unbrauchbares Produkt. Er erfordert erneute Maschinenzeit, teuren Express-Ersatzversand und gefährdet Ihre Amazon-Rate an Bestellmängeln (ODR)." },
      { type: "heading", tag: "h2", text: "Kontaktlose ASIN-Vorlagen" },
      { type: "paragraph", text: "Printomation schließt manuelles Abtippen komplett aus. Der Kundentext fließt unverändert von Amazon in die kalibrierte Vorlage:" },
      {
        type: "list",
        items: [
          "Direkte Datenbindung: 0 % manuelles Abtippen oder Copy-Paste durch Werkstattmitarbeiter.",
          "Schriftregeln pro ASIN: Automatische Umsetzung von Groß- oder Kleinschreibung gemäß Listing-Vorgabe.",
          "Zeilenumbruch-Sperren: Verhindert das unschöne Umbrechen von Monogrammen und Reimen über Ränder hinaus.",
        ],
      },
      { type: "quote", text: "Manuelles Abtippen verursacht im Normalbetrieb eine Fehlerquote von 4 %, in der Hochsaison bis zu 8 %. Printomation senkt diese Fehlerquote auf exakt null." },
      { type: "heading", tag: "h2", text: "Verlässliche Qualität auch bei Hochbetrieb" },
      { type: "paragraph", text: "Mit festen Vorlagenvorgaben arbeitet Ihre Werkstatt selbst an Spitzentagen mit audit-sicherer Präzision." },
    ]),
  },
  "automated-batch-processing-handling-holiday-q4-peak": {
    blog_title: "Automatische Stapelverarbeitung: 5.000+ tägliche Bestellungen im Q4-Weihnachtsgeschäft meistern",
    short_description: "Bewältigen Sie die Hochsaison ohne Personalchaos: Durch automatische Bogenverschachtelung (Nesting), Laufzettel und Barcode-Routing steuern 2 Mitarbeiter eine ganze Werkstatt.",
    description: createLexicalDoc([
      { type: "paragraph", text: "Am Black Friday, Cyber Monday und im Weihnachtsgeschäft vervielfacht sich das Bestellvolumen bei Amazon Custom schlagartig. Wer Aufträge einzeln vorbereitet, riskiert Lieferverzögerungen und Kontowarnungen wegen verspäteter Sendungen (LSR)." },
      { type: "heading", tag: "h2", text: "Warum Einzelaufträge ineffizient sind" },
      { type: "paragraph", text: "Ein einzelnes Stück auf ein großes 900x600-mm-Laserbett zu legen, ist unwirtschaftlich. Die meiste Zeit vergeht mit Türöffnen und Leerfahrten. Hohe Gewinne entstehen erst, wenn 30, 50 oder 100 Werkstücke auf einmal graviert werden." },
      { type: "heading", tag: "h2", text: "Intelligente Bogenverschachtelung (Nesting)" },
      { type: "paragraph", text: "Printomation fasst gleichartige Bestellungen nach Material, Stärke und Gravurparametern zu Sammelaufträgen zusammen:" },
      {
        type: "list",
        items: [
          "Automatisches Nesting: Platziert Anhänger, Schlüsselanhänger oder Schilder platzsparend auf Acryl- und Holzplatten.",
          "Scanbare Laufzettel: Erzeugt Begleitblätter mit Barcodes, die jedes Teil auf dem Bogen mit der Amazon-Bestell-ID verknüpfen.",
          "Prioritätssteuerung: Zieht Amazon Prime- und Expressbestellungen automatisch vor, um strenge Versandfristen einzuhalten.",
        ],
      },
      { type: "quote", text: "Wachsen im Q4 ohne Chaos: Selbst wenn 5.000 Bestellungen in 24 Stunden eintreffen, sorgt automatisches Nesting für maximalen Durchsatz auf dem Laserbett." },
      { type: "heading", tag: "h2", text: "Pünktlich liefern, entspannt schlafen" },
      { type: "paragraph", text: "Mit vorbereiteten Sammelbögen bewältigen Sie das Weihnachtsgeschäft termingerecht und mit höchster Rentabilität." },
    ]),
  },
  "direct-machine-exports-fiber-lasers-co2-ezcad": {
    blog_title: "Direkte Maschinenexporte: Workflows für Faserlaser, CO2 & EZCad einrichten",
    short_description: "Von Schraffurabständen bis zu Strichstärken: Optimieren Sie Ihre Vektorexporte nahtlos für LightBurn, Trotec JobControl und industrielle Faserlasersysteme.",
    description: createLexicalDoc([
      { type: "paragraph", text: "Jede Gravur- und Schneidmaschine verlangt spezifische Dateiformate. Was auf einem CO2-Laser als feine Haarlinie geschnitten werden soll, benötigt auf einem Faserlaser unter EZCad geschlossene Schraffurlinien." },
      { type: "heading", tag: "h2", text: "Warum gewöhnliche Standard-PDFs fehlschlagen" },
      { type: "paragraph", text: "Aus normalen Onlineshops exportierte PDFs enthalten oft offene Kurvenknoten, unvollständige Vektorpfade oder falsche Farbräume. Bediener müssen jede Datei mühsam in LightBurn oder Corel nachbessern." },
      { type: "heading", tag: "h2", text: "Maschinengerechte Ausgabeprofile" },
      { type: "paragraph", text: "In Printomation konfigurieren Sie individuelle Profile passend zu Ihren Maschinen:" },
      {
        type: "list",
        items: [
          "LightBurn-Kompatibilität: Farbcodierte Ebenen für Schnitt (Rot), Gravur (Schwarz) und Markierung (Blau).",
          "EZCad 2 & 3: Bereinigte Vektorpfade ohne doppelte Linien für fehlerfreie Schraffurfüllungen.",
          "Trotec & Epilog: Echte Haarlinien (0,001 mm), die von Lasercontrollern sofort als Schnittbefehle erkannt werden.",
        ],
      },
      { type: "quote", text: "Keine zeitraubenden Nacharbeiten mehr: Laden Sie bereinigte Vektordateien herunter und ziehen Sie sie direkt in Ihre Lasersoftware." },
      { type: "heading", tag: "h2", text: "Reibungsloser Werkstattbetrieb" },
      { type: "paragraph", text: "Wenn die Software die Sprache Ihrer Maschinensteuerung spricht, produziert Ihr Team Werkstücke statt Dateien zu reparieren." },
    ]),
  },
  "font-matching-special-characters-preventing-missing-glyphs": {
    blog_title: "Schriftabgleich & Sonderzeichen: Fehlende Glyphen bei individuellem Schmuck verhindern",
    short_description: "Umlaute, Akzente und Emojis bringen Standardschriften oft zum Absturz. Entdecken Sie unsere Schrift-Fallback-Hierarchie und Kurvenvektorisierung für fehlerfreie Schmuckgravuren.",
    description: createLexicalDoc([
      { type: "paragraph", text: "Personalisierter Schmuck, Kettenanhänger und Armbänder verlangen feinste Präzision. Geben Kunden Namen mit Akzenten (wie René, Zoë, Håkon) oder Herzsymbole ein, fehlen in Standardschriften oft die passenden Zeichen." },
      { type: "heading", tag: "h2", text: "Das Problem fehlender Zeichen ([?])" },
      { type: "paragraph", text: "Fehlt einem Zeichensatz das Zeichen, wird oft ein leeres Rechteck graviert. Bemerkt der Bediener dies nicht rechtzeitig, geht ein fehlerhafter Artikel in den Versand." },
      { type: "heading", tag: "h2", text: "Die Printomation Unicode-Engine mit Fallback-Ketten" },
      { type: "paragraph", text: "Unsere typografische Engine deckt internationale Zeichensätze zuverlässig ab:" },
      {
        type: "list",
        items: [
          "Mehrsprachige Akzente: Volle Unterstützung für deutsche Umlaute (ä, ö, ü, ß), französische Akzente (é, è, ç) und skandinavische Sonderzeichen.",
          "Symbol- & Emoji-Vektorisierung: Wandelt gängige Symbole (Herzen, Unendlichkeitszeichen, Sterne) in saubere Vektorpfade um.",
          "Automatische Pfadkonvertierung: Alle Schriften werden vor dem Dateiexport in Vektorkonturen gewandelt, damit kein Rechner Schriftartendateien installieren muss.",
        ],
      },
      { type: "quote", text: "Gibt ein Kunde 'Chloé & André ❤️' ein, wandelt unsere Engine jeden Akzent und jedes Herzchen in gestochen scharfe Vektorkurven um." },
      { type: "heading", tag: "h2", text: "Perfekte Schriftbilder auf jedem Material" },
      { type: "paragraph", text: "Garantiert lückenlose Typografie bei allen Schrifttypen, die Sie in Ihren Amazon-Angeboten bereitstellen." },
    ]),
  },
  "scaling-cross-border-customization-amazon-multi-marketplace": {
    blog_title: "Grenzüberschreitende Personalisierung skalieren: Amazon DE, UK, FR, IT, ES & US",
    short_description: "Zentralisieren Sie internationale Bestelleingänge, mehrsprachige Kundentexte und regionale Versandfristen über eine einzige, synchronisierte Steuerungsplattform.",
    description: createLexicalDoc([
      { type: "paragraph", text: "Personalisierte Geschenke zählen zu den margenstärksten Kategorien auf Amazon. Die Expansion auf Amazon.de, Amazon.co.uk, Amazon.fr, Amazon.it, Amazon.es und Amazon.com vervielfacht diesen Erfolg." },
      { type: "heading", tag: "h2", text: "Die Hürden des internationalen Betriebs" },
      { type: "paragraph", text: "Das manuelle Verwalten von sechs separaten Seller-Central-Konten führt zu ständigem Umloggen, Sprachbarrieren und dem Risiko verpasster Fristen." },
      { type: "heading", tag: "h2", text: "Eine zentrale Steuerungsübersicht" },
      { type: "paragraph", text: "Printomation vereint alle angebundenen Amazon-Marktplätze in einem gemeinsamen Dashboard:" },
      {
        type: "list",
        items: [
          "Zentraler Auftragsimport: Führt Aufträge aus DE, UK, FR, IT, ES und den USA in einer einzigen Fertigungsschlange zusammen.",
          "Automatische Einheitenumrechnung: Konvertiert metrische und zollbasierte Angaben nach den Vorgaben Ihrer Werkstatt.",
          "Sendungsverfolgungs-Sync: Meldet Trackingnummern automatisch an den jeweiligen Ländermarktplatz zurück.",
        ],
      },
      { type: "quote", text: "Sechs europäische Marktplätze mit einem einzigen Werkstatt-Team betreuen: Printomation bündelt internationale Aufträge in einem synchronisierten Ablauf." },
      { type: "heading", tag: "h2", text: "Mühelose Expansion" },
      { type: "paragraph", text: "Erschließen Sie neue europäische Marktplätze mit der Gewissheit, dass Ihr Fertigungsteam keinen administrativen Mehraufwand hat." },
    ]),
  },
  "amazon-order-intake-to-machine-ready-file-10-seconds": {
    blog_title: "Von der Amazon-Bestellung zur fertigen Produktionsdatei in unter 10 Sekunden: Fallstudie",
    short_description: "Praxisbeispiel: Wie eine Münchner Lasergravur-Werkstatt die Vorbereitungszeit pro Bestellung von 11 Minuten auf null manuelle Handgriffe reduzierte.",
    description: createLexicalDoc([
      { type: "paragraph", text: "LaserArt Studio, ein Hersteller von personalisierten Holz- und Acrylgeschenken in München, verarbeitete rund 200 Amazon Custom-Bestellungen täglich - und über 1.200 Bestellungen pro Tag in den Monaten November und Dezember." },
      { type: "heading", tag: "h2", text: "Die Herausforderung: Arbeitsstunden in Illustrator" },
      { type: "paragraph", text: "Drei Mitarbeiter waren Vollzeit damit beschäftigt, CSV-Dateien zu sichten, Grafiken in Illustrator zu bauen, Schriftgrößen auszumessen und Dateien auf USB-Sticks zu speichern. Die Vorstufenarbeit kostete monatlich über 7.000 Euro an Personalkosten." },
      { type: "heading", tag: "h2", text: "Die Umstellung auf Printomation" },
      { type: "paragraph", text: "Die Werkstatt band Printomation an und richtete ihre 40 beliebtesten ASIN-Vorlagen an einem einzigen Nachmittag ein. Die Resultate:" },
      {
        type: "list",
        items: [
          "Die Dateivorbereitungszeit sank von 11 Minuten pro Auftrag auf unter 10 Sekunden automatisierte Verarbeitung.",
          "Tipp- und Ausrichtungsfehler fielen auf null, was monatlich 3.400 Euro an verdorbenem Rohmaterial einsparte.",
          "Die Quote für den Versand am selben Tag stieg von 68 % auf 99,4 %, was den Buy-Box-Anteil um 22 % erhöhte.",
        ],
      },
      { type: "quote", text: "Statt nachts um 2 Uhr verzweifelt Illustrator-Dateien zusammenzuklicken, läuft der Laser heute automatisch durch. Printomation hat uns unsere Werkstatt zurückgegeben." },
      { type: "heading", tag: "h2", text: "Das Fazit" },
      { type: "paragraph", text: "Die automatisierte Brücke zwischen Amazon Custom und Fertigungsmaschinen verwandelt personalisierte Produktion in ein hochgradig skalierbares, profitables Geschäft." },
    ]),
  },
};

export function getLocalizedBlog(blog: BlogItem, lang: string): BlogItem {
  if (!blog) return blog;
  const isGermanOrDutch = lang && (lang.startsWith("de") || lang === "nl");
  if (!isGermanOrDutch) {
    return blog;
  }

  const slug = blog.slug || "";
  const match = GERMAN_BLOGS[slug];
  if (!match) {
    return blog;
  }

  return {
    ...blog,
    blog_title: match.blog_title || blog.blog_title,
    short_description: match.short_description || blog.short_description,
    description: match.description || blog.description,
  };
}
