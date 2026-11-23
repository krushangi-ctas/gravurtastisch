const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

function createLexicalDoc(paragraphs) {
  const children = [];

  paragraphs.forEach((p) => {
    if (p.type === 'heading') {
      children.push({
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: p.text,
            type: 'text',
            version: 1
          }
        ],
        tag: p.tag || 'h2',
        direction: null,
        format: '',
        indent: 0,
        type: 'heading',
        version: 1
      });
    } else if (p.type === 'quote') {
      children.push({
        children: [
          {
            children: [
              {
                detail: 0,
                format: 2,
                mode: 'normal',
                style: '',
                text: p.text,
                type: 'text',
                version: 1
              }
            ],
            direction: null,
            format: '',
            indent: 0,
            textFormat: 2,
            textStyle: '',
            type: 'paragraph',
            version: 1
          }
        ],
        direction: null,
        format: '',
        indent: 0,
        textFormat: 2,
        type: 'quote',
        version: 1
      });
    } else if (p.type === 'list') {
      const listItems = p.items.map((item, idx) => ({
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: item,
            type: 'text',
            version: 1
          }
        ],
        indent: 0,
        value: idx + 1,
        direction: null,
        format: '',
        type: 'listitem',
        version: 1
      }));

      children.push({
        children: listItems,
        listType: 'bullet',
        start: 1,
        tag: 'ul',
        direction: null,
        format: '',
        indent: 0,
        type: 'list',
        version: 1
      });
    } else {
      children.push({
        children: [
          {
            detail: 0,
            format: p.format || 0,
            mode: 'normal',
            style: '',
            text: p.text,
            type: 'text',
            version: 1
          }
        ],
        direction: null,
        format: '',
        indent: 0,
        textFormat: p.format || 0,
        textStyle: '',
        type: 'paragraph',
        version: 1
      });
    }
  });

  return {
    root: {
      children,
      direction: null,
      format: '',
      indent: 0,
      type: 'root',
      version: 1
    }
  };
}

const newBlogs = [
  {
    blog_title: 'How to Automate Amazon Custom Orders into Machine-Ready Vector Files (SVG & DXF)',
    slug: 'automate-amazon-custom-orders-into-vector-files-svg-dxf',
    short_description: 'Tired of manually tracing customer text and monograms in Illustrator? Learn how Printomation transforms raw Amazon Custom JSON into calibrated laser-ready SVG and DXF files in seconds.',
    image: '/blogs/blog-vector-automation.svg',
    content: [
      { type: 'paragraph', text: 'For e-commerce sellers specializing in laser-engraved gifts, custom signage, and personalized apparel, Amazon Custom represents tremendous sales volume. However, fulfilling each customized order manually in Adobe Illustrator or CorelDraw creates an operational choke point.' },
      { type: 'heading', tag: 'h2', text: 'The Pre-Press Bottleneck in Custom Production' },
      { type: 'paragraph', text: 'When a customer submits a customized order on Amazon, the seller receives a JSON payload or a CSV entry containing raw text strings, font choices, and coordinate coordinates. Traditionally, a graphic artist or laser operator has to open vector software, manually select fonts, adjust kerning, convert text to curves, and scale to fit the substrate. This manual process takes 5 to 15 minutes per order.' },
      { type: 'heading', tag: 'h2', text: 'How Printomation Automates Vector Conversion' },
      { type: 'paragraph', text: 'Printomation connects directly to your Amazon Seller Central via the SP-API. The moment an order clears payment, our vector engine executes an automated pre-press pipeline:' },
      {
        type: 'list',
        items: [
          'Automatic text curve conversion: Replaces live fonts with vector path outlines so production machines never suffer missing font dialogs.',
          'Bounding-box constraint clamping: Enforces predefined safe zones for tumblers, wood plaques, and phone cases without manual resizing.',
          'Multi-layer DXF & SVG export: Separates cut lines (red), score marks (blue), and engraving fills (black) for LightBurn and EZCad.'
        ]
      },
      { type: 'quote', text: 'Automating vector pre-press cuts per-order preparation time from 10 minutes to under 5 seconds, allowing custom sellers to fulfill 500+ daily orders with a fraction of the workshop staff.' },
      { type: 'heading', tag: 'h2', text: 'Immediate Benefits for Machine Operators' },
      { type: 'paragraph', text: 'With pre-calibrated SVG and DXF exports, workshop operators simply download the production bundle, drop it straight into their laser or CNC software, and press start. Zero typing errors, zero misaligned monograms, and 100% fidelity to the buyer choice.' }
    ]
  },
  {
    blog_title: 'Connecting Amazon SP-API: The End of Manual CSV Copy-Pasting for Personalization',
    slug: 'connecting-amazon-sp-api-end-manual-csv-copy-pasting',
    short_description: 'A step-by-step breakdown of how official LWA OAuth and SP-API webhooks automatically stream custom buyer inputs directly to your print and engraving floor.',
    image: '/blogs/blog-sp-api-ingestion.svg',
    content: [
      { type: 'paragraph', text: 'Relying on manual CSV report downloads from Seller Central is slow, prone to spreadsheet formatting errors, and delays production by hours. Amazon official Selling Partner API (SP-API) offers a modern, real-time alternative.' },
      { type: 'heading', tag: 'h2', text: 'The Vulnerability of CSV Spreadsheets' },
      { type: 'paragraph', text: 'When orders are exported via CSV, special characters like quotation marks, German umlauts (ä, ö, ü), and commas frequently break columns. Workshop staff often end up copying text from misaligned columns, resulting in expensive misprints and angry customer reviews.' },
      { type: 'heading', tag: 'h2', text: 'Direct SP-API Integration via Login with Amazon (LWA)' },
      { type: 'paragraph', text: 'Printomation connects via Amazon official OAuth 2.0 flow. Once authorized, our system receives push notifications the second a customized order is placed. The raw customization data is parsed with 100% cryptographic precision.' },
      {
        type: 'list',
        items: [
          'Real-time webhook ingestion: No need to log in to Seller Central or wait for hourly report batches.',
          'Complete Amazon TOS compliance: Direct tokenized API communication eliminates the risk of account suspensions from third-party scraping.',
          'Data security & privacy: Fully compliant with Amazon Data Protection Policies (DPP) with AES-256 encryption at rest.'
        ]
      },
      { type: 'quote', text: 'Real-time webhook synchronization means by the time your production operator walks to the laser bench, the ready file is already waiting in the queue.' },
      { type: 'heading', tag: 'h2', text: 'Connecting in Less Than 5 Minutes' },
      { type: 'paragraph', text: 'Connecting your Amazon store to Printomation takes one click in Seller Central. Once linked, all Amazon Custom orders flow directly into production templates without a single spreadsheet in between.' }
    ]
  },
  {
    blog_title: 'Pre-Press Safe Zones & Bleed Management for Tumblers, Wood & Acrylic',
    slug: 'pre-press-safe-zones-bleed-management-laser-engravers',
    short_description: 'Avoid ruined blanks and misaligned rotary jobs. Discover how ASIN template bounding boxes enforce safe margins, curved surface offsets, and rotary cylinder limits automatically.',
    image: '/blogs/blog-safe-zones-rotary.svg',
    content: [
      { type: 'paragraph', text: 'In personalized manufacturing, spoiled inventory is the fastest way to erode profit margins. A misaligned laser burn on a premium powder-coated tumbler ruins a blank that costs €15 to €25.' },
      { type: 'heading', tag: 'h2', text: 'Why Curved Surfaces and Rotary Attachments Cause Errors' },
      { type: 'paragraph', text: 'Engraving on tumblers, glasses, or wooden pens requires accounting for rotational distortion and physical clearance around handles and rims. When customers enter extra-long names, unconstrained software lets the text spill into unsafe zones.' },
      { type: 'heading', tag: 'h2', text: 'Automated Safe Zones in Printomation' },
      { type: 'paragraph', text: 'With Printomation ASIN template engine, you establish exact bounding boxes and margin constraints once. When a buyer submits 25 characters where only 15 normally fit, our engine automatically scales the font proportionally while respecting margin buffers.' },
      {
        type: 'list',
        items: [
          'Dynamic text scaling: Automatically reduces font size smoothly to keep text inside the safe engraving zone.',
          'Aspect ratio locking: Prevents ugly horizontal or vertical squishing of custom graphics and monograms.',
          'Rotary cylinder margin locks: Leaves strict 15mm clearance from tumbler rims and base contours.'
        ]
      },
      { type: 'quote', text: 'A single misaligned rotary tumbler costs €18 in lost blank material plus replacement shipping. Automated safe zones guarantee zero edge overflows.' },
      { type: 'heading', tag: 'h2', text: 'Set Once, Automate Forever' },
      { type: 'paragraph', text: 'Map your ASIN templates once during onboarding. From then on, every customer order is validated against your machine bed parameters before the SVG or DXF file is even generated.' }
    ]
  },
  {
    blog_title: 'Handling Buyer Photo Uploads: Automated DPI Verification & Background Processing',
    slug: 'handling-buyer-photo-uploads-automated-dpi-verification',
    short_description: 'Low-resolution photos and messy backgrounds cause customer disputes. See how automated pre-flight checks flag blurry images and prep 300+ DPI raster outputs for UV printing.',
    image: '/blogs/blog-photo-upload-dpi.svg',
    content: [
      { type: 'paragraph', text: 'Selling custom photo gifts on Amazon-such as acrylic plaques, slate photo stones, and canvas prints-is highly lucrative, but buyer photo quality is unpredictable. Customers regularly upload compressed screenshots and low-resolution social media photos.' },
      { type: 'heading', tag: 'h2', text: 'The Disaster of Printing Low-Resolution Images' },
      { type: 'paragraph', text: 'If an operator prints a 72 DPI screenshot onto a large acrylic plaque, the result is pixelated and blurry. The customer leaves a 1-star review and demands an A-to-z refund, blaming the seller for poor print quality.' },
      { type: 'heading', tag: 'h2', text: 'Automated Pre-Flight DPI Validation' },
      { type: 'paragraph', text: 'Printomation includes intelligent pre-flight verification for photo uploads. When an order arrives, our system checks the pixel dimensions against the physical print area of your product template.' },
      {
        type: 'list',
        items: [
          'DPI pre-flight verification: Ensures images meet minimum 300 DPI resolution standards for UV printing.',
          'Smart background masking: Automatically crops and prepares transparent background cutouts for crystal-clear engraving.',
          'Dithering for laser engraving: Generates optimized 1-bit bitmap halftones calibrated for fiber and CO2 laser engraving systems.'
        ]
      },
      { type: 'quote', text: 'Never guess whether a customer photo will print sharp. Pre-flight automation flags low-res uploads instantly before they waste machine time and expensive materials.' },
      { type: 'heading', tag: 'h2', text: 'Protecting Seller Ratings and Margins' },
      { type: 'paragraph', text: 'By automating image pre-flight and optimization, custom sellers eliminate photo-related refunds while delivering gallery-quality prints every single day.' }
    ]
  },
  {
    blog_title: 'Eliminating Misprints: How ASIN Templates Prevent Costly Typing & Layout Errors',
    slug: 'eliminating-misprints-asin-templates-prevent-typing-errors',
    short_description: 'When operators retype names by hand, typos happen on 4% of custom runs. Here is how zero-touch automated layout locks text, fonts, and kerning directly from the buyer order.',
    image: '/blogs/blog-zero-misprints.svg',
    content: [
      { type: 'paragraph', text: 'Human error is the single greatest hidden cost in personalized product fulfillment. Studies show that when machine operators manually retype customer names, addresses, or dates, between 3% and 6% of items contain typos.' },
      { type: 'heading', tag: 'h2', text: 'The True Cost of a Spelling Error' },
      { type: 'paragraph', text: 'A typo is not just a wasted blank. It involves duplicate laser machine time, express replacement shipping, negative seller feedback, and often penalty strikes against your Amazon Order Defect Rate (ODR).' },
      { type: 'heading', tag: 'h2', text: 'Zero-Touch ASIN Templates' },
      { type: 'paragraph', text: 'Printomation eliminates manual retyping entirely. Customer text flows straight from the Amazon Custom order directly into your calibrated template. What the customer typed is exactly what the laser burns.' },
      {
        type: 'list',
        items: [
          'Direct text binding: No re-keying or copy-pasting by machine operators.',
          'Case normalization: Optional rules to enforce UPPERCASE, lowercase, or Title Case according to your product design.',
          'Kerning and line-break locks: Guarantees that multi-line addresses and poems wrap aesthetically without overflowing.'
        ]
      },
      { type: 'quote', text: 'Retyping customer names by hand causes a 3-5% error rate during regular periods, jumping to 8% in peak season. Printomation brings that error rate to exactly zero.' },
      { type: 'heading', tag: 'h2', text: 'Flawless Quality Control at Scale' },
      { type: 'paragraph', text: 'With automated layout locks in place, your workshop floor operates with consistent, audit-proof perfection even during highest volume periods.' }
    ]
  },
  {
    blog_title: 'Automated Batch Processing: Handling 5,000+ Daily Orders During Q4 Holiday Peak',
    slug: 'automated-batch-processing-handling-holiday-q4-peak',
    short_description: 'Peak season can overwhelm even experienced engraving workshops. Learn how automated batch nesting, job sheets, and barcode routing let 2 operators run an entire workshop at scale.',
    image: '/blogs/blog-scaling-q4-batches.svg',
    content: [
      { type: 'paragraph', text: 'During Black Friday, Cyber Monday, and the Christmas holiday rush, Amazon Custom order volume can spike 10x overnight. Workshops relying on one-by-one file setup inevitably experience severe backlog delays and missed Amazon Late Shipment Rate (LSR) deadlines.' },
      { type: 'heading', tag: 'h2', text: 'The Bottleneck of Single-Piece Processing' },
      { type: 'paragraph', text: 'Loading one custom piece onto a 900x600mm laser bed is inefficient. The laser spends more time jogging and waiting for door openings than actual cutting. True profitability requires filling the entire laser bed with 20, 50, or 100 items at once.' },
      { type: 'heading', tag: 'h2', text: 'Intelligent Gang-Run Batching' },
      { type: 'paragraph', text: 'Printomation groups similar orders by ASIN, material thickness, and laser parameters into unified production batches:' },
      {
        type: 'list',
        items: [
          'Automated sheet nesting: Organizes personalized ornaments or keychains onto full acrylic or birch plywood sheets with minimal material scrap.',
          'Scannable traveler sheets: Generates operator printouts with scannable barcodes linking every item on the sheet to its Amazon Order ID.',
          'SLA-priority scheduling: Surfaces Amazon Prime and expedited orders first to guarantee strict on-time shipping compliance.'
        ]
      },
      { type: 'quote', text: 'Scale through Q4 without chaos. When 5,000 orders arrive in 24 hours, automated batch nesting organizes your laser bed for maximum hourly throughput.' },
      { type: 'heading', tag: 'h2', text: 'Deliver Fast, Sleep Easy' },
      { type: 'paragraph', text: 'By converting chaotic incoming orders into orderly, pre-nested production batches, custom sellers navigate the Q4 rush smoothly and profitably.' }
    ]
  },
  {
    blog_title: 'Direct Machine Exports: Setting Up Workflows for Fiber Lasers, CO2 & EZCad',
    slug: 'direct-machine-exports-fiber-lasers-co2-ezcad',
    short_description: 'From hatch spacing and vector stroke weights to EZCad-compatible layers, optimize your automated file exports for LightBurn, Trotec JobControl, and industrial fiber systems.',
    image: '/blogs/blog-ezcad-laser-export.svg',
    content: [
      { type: 'paragraph', text: 'Different engraving and printing machines have unique file format and layer requirements. A file configured for a CO2 laser cutter requires distinct hair-line strokes, while a fiber laser running EZCad requires closed hatch fills.' },
      { type: 'heading', tag: 'h2', text: 'Why Generic PDF Files Fail on the Workshop Floor' },
      { type: 'paragraph', text: 'Generic PDFs exported from standard web tools frequently contain open vector nodes, uncurved font objects, and RGB colors that laser controllers misinterpret. Operators waste time re-editing each file inside LightBurn or EZCad.' },
      { type: 'heading', tag: 'h2', text: 'Machine-Calibrated Output Presets' },
      { type: 'paragraph', text: 'Printomation lets you define machine export profiles tailored to your exact hardware setup:' },
      {
        type: 'list',
        items: [
          'LightBurn ready: Exports color-coded layers that map directly to LightBurn cut libraries (Cut, Scan, Score).',
          'EZCad 2 & 3 support: Formatted vector DXF and SVG geometry with zero duplicate lines and closed boundaries for clean hatch fills.',
          'Trotec JobControl & Epilog: True hairline stroke widths (0.001mm) recognized immediately as vector cut commands.'
        ]
      },
      { type: 'quote', text: 'No conversion plug-ins required. Download clean, standardized vector files ready to drag and drop straight into your laser software.' },
      { type: 'heading', tag: 'h2', text: 'Frictionless Workshop Handoff' },
      { type: 'paragraph', text: 'When your software speaks the native language of your CNC and laser controllers, your production team spends time producing rather than troubleshooting file geometry.' }
    ]
  },
  {
    blog_title: 'Font Matching & Special Characters: Preventing Missing Glyphs in Custom Jewelry',
    slug: 'font-matching-special-characters-preventing-missing-glyphs',
    short_description: 'Accents, umlauts, Greek letters, and emojis frequently break standard fonts. Discover our smart font fallback hierarchy and auto-vectorization engine for flawless jewelry engraving.',
    image: '/blogs/blog-font-glyph-engine.svg',
    content: [
      { type: 'paragraph', text: 'Personalized jewelry, bar necklaces, and luxury watches require microscopic precision. When customers enter names with special accents (like René, Zoë, or Håkon) or cute heart symbols, standard font engines often drop the glyph completely.' },
      { type: 'heading', tag: 'h2', text: 'The Tofu Box Dilemma ([?])' },
      { type: 'paragraph', text: 'If a font lacks glyph coverage for a specific unicode character, software often substitutes a blank rectangle (known as tofu) or crashes the render loop. If an operator fails to notice, a defective piece is engraved and shipped.' },
      { type: 'heading', tag: 'h2', text: 'Printomation Unicode Engine & Fallback Chains' },
      { type: 'paragraph', text: 'Our typography engine handles the full international Unicode character set with intelligent fallback support:' },
      {
        type: 'list',
        items: [
          'Multi-lingual glyph coverage: Full native support for German, French, Spanish, Italian, Polish, and Scandinavian accents.',
          'Symbol and emoji conversion: Translates popular customer symbols (hearts, infinity loops, stars) into clean, engraver-ready vector paths.',
          'Automatic text outlining: All text is converted to closed vector outlines prior to file export, ensuring identical appearance on every computer.'
        ]
      },
      { type: 'quote', text: 'When a buyer enters "Chloé & André ❤️", our glyph engine ensures every accent mark and heart symbol prints as beautiful vector curves.' },
      { type: 'heading', tag: 'h2', text: 'Flawless Typography Every Time' },
      { type: 'paragraph', text: 'Deliver exquisite jewelry engravings with 100% character integrity across every language and font style your Amazon listing offers.' }
    ]
  },
  {
    blog_title: 'Scaling Cross-Border Customization Across Amazon DE, UK, FR, IT, ES & US',
    slug: 'scaling-cross-border-customization-amazon-multi-marketplace',
    short_description: 'Operating across multiple European and North American marketplaces? Here is how to unify order intake, multi-lingual buyer text, and regional shipping queues into one centralized hub.',
    image: '/blogs/blog-multi-marketplace-sync.svg',
    content: [
      { type: 'paragraph', text: 'Personalized products are among the highest-margin categories on Amazon, and expanding across borders to Amazon.de, Amazon.co.uk, Amazon.fr, Amazon.it, Amazon.es, and Amazon.com multiplies that growth.' },
      { type: 'heading', tag: 'h2', text: 'The Complexity of Cross-Border Operations' },
      { type: 'paragraph', text: 'Managing six separate Seller Central accounts manually means constant logging in and out, dealing with different language interfaces, and juggling distinct shipping cutoff times for each national carrier.' },
      { type: 'heading', tag: 'h2', text: 'One Unified Production Dashboard' },
      { type: 'paragraph', text: 'Printomation unifies all your connected Amazon marketplaces into a single pane of glass:' },
      {
        type: 'list',
        items: [
          'Centralized multi-account intake: Pulls custom orders from UK, DE, FR, IT, ES, and US into one consolidated machine queue.',
          'Unit conversion on the fly: Automatically converts metric and imperial dimensions according to your workshop preferred standard.',
          'Automatic carrier tracking sync: Feeds carrier dispatch details back to the correct Amazon marketplace without manual intervention.'
        ]
      },
      { type: 'quote', text: 'Manage six European marketplaces with one production team. Printomation harmonizes international orders into a single, synchronized workshop workflow.' },
      { type: 'heading', tag: 'h2', text: 'Expand Without Overhead' },
      { type: 'paragraph', text: 'Open new European storefronts knowing your production floor requires zero additional administrative overhead to handle the influx of international custom orders.' }
    ]
  },
  {
    blog_title: 'From Amazon Order Intake to Machine-Ready Output in Under 10 Seconds: A Case Study',
    slug: 'amazon-order-intake-to-machine-ready-file-10-seconds',
    short_description: 'A real-world breakdown of how a German custom laser workshop reduced pre-press prep time from 11 minutes per order down to zero manual touches using Printomation.',
    image: '/blogs/blog-10s-pipeline-study.svg',
    content: [
      { type: 'paragraph', text: 'LaserArt Studio, a personalized gift manufacturer in Munich, Germany, was processing approximately 200 Amazon Custom orders per day during normal months and up to 1,200 orders daily in November and December.' },
      { type: 'heading', tag: 'h2', text: 'The Challenge: Overwhelmed by Illustrator Files' },
      { type: 'paragraph', text: 'Three full-time employees spent their entire shift downloading CSV files, manually creating vector artwork in Illustrator, adjusting text sizes, and exporting files onto thumb drives for their CO2 laser machines. Pre-press labor was costing over €7,000 each month.' },
      { type: 'heading', tag: 'h2', text: 'Implementing Printomation' },
      { type: 'paragraph', text: 'The workshop integrated Printomation and mapped their top 40 custom ASIN templates in a single afternoon. The results were immediate:' },
      {
        type: 'list',
        items: [
          'Pre-press file preparation time plummeted from 11 minutes per order to under 10 seconds of automated processing.',
          'Spelling errors and misaligned engravings dropped to zero, eliminating €3,400 per month in scrap material costs.',
          'Same-day dispatch rate surged from 68% to 99.4%, boosting their Amazon Buy Box share by 22%.'
        ]
      },
      { type: 'quote', text: 'We went from drowning in Illustrator files at 2 AM to sipping coffee while the laser hums with automated queues. Printomation gave us our workshop back.' },
      { type: 'heading', tag: 'h2', text: 'The Bottom Line' },
      { type: 'paragraph', text: 'Automating the bridge between Amazon Custom and workshop machinery transforms customized manufacturing from a labor-intensive craft into a scalable, high-margin software-driven enterprise.' }
    ]
  }
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URL);
    const db = mongoose.connection.db;
    const col = db.collection('tbl_blogs');

    const oldCount = await col.countDocuments({});
    console.log(`Current blogs in tbl_blogs: ${oldCount}`);

    // Remove old blogs
    const delRes = await col.deleteMany({});
    console.log(`Deleted ${delRes.deletedCount} old blogs.`);

    const now = new Date();
    const docs = newBlogs.map((b, index) => {
      const pubDate = new Date(now.getTime() - (index * 86400000 * 2)); // Spread dates every 2 days
      const lexicalDoc = createLexicalDoc(b.content);

      return {
        blog_title: b.blog_title,
        slug: b.slug,
        short_description: b.short_description,
        description: lexicalDoc,
        description_images: [b.image],
        full_image_urls: [b.image],
        status: 1,
        createdAt: pubDate,
        updatedAt: pubDate
      };
    });

    const insertRes = await col.insertMany(docs);
    console.log(`Successfully inserted ${insertRes.insertedCount} new Printomation B2B SaaS blogs!`);

    const finalBlogs = await col.find({}, { projection: { blog_title: 1, slug: 1, status: 1 } }).toArray();
    console.log('Final blogs in database:');
    finalBlogs.forEach((b, i) => console.log(`${i + 1}. [${b._id}] ${b.blog_title} (${b.slug})`));

    await mongoose.disconnect();
    console.log('Database connection closed.');
  } catch (err) {
    console.error('Error seeding blogs:', err);
    process.exit(1);
  }
}

seed();
