const express = require('express');
const path = require('path');

const router = express.Router();

const openApiPath = path.join(__dirname, '../../docs/openapi.json');
const redocScriptPath = path.join(__dirname, '../../docs/redoc.standalone.js');

// Serve OpenAPI Specification JSON
router.get('/openapi.json', (req, res) => {
  res.sendFile(openApiPath);
});

// Serve Local ReDoc Script
router.get('/redoc.standalone.js', (req, res) => {
  res.sendFile(redocScriptPath);
});

// Serve Interactive ReDoc Documentation UI
router.get('/', (req, res) => {
  const redocHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Gravurtastisch API Documentation</title>
    <link rel="icon" type="image/svg+xml" href="/g.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #ffffff;
      }
      /* Brand top banner */
      .brand-header {
        background: #282828;
        color: #ffffff;
        padding: 12px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid #1a1a1a;
      }
      .brand-title {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 16px;
        font-weight: 700;
        letter-spacing: -0.3px;
      }
      .brand-badge {
        background: rgba(255, 255, 255, 0.12);
        color: #f1f5f9;
        font-size: 11px;
        font-weight: 600;
        padding: 3px 8px;
        border-radius: 9999px;
      }
      .brand-link {
        color: #94a3b8;
        font-size: 13px;
        text-decoration: none;
        transition: color 0.15s ease;
      }
      .brand-link:hover {
        color: #ffffff;
      }
    </style>
  </head>
  <body>
    <div class="brand-header">
      <div class="brand-title">
        <span>Gravurtastisch API Documentation</span>
      </div>
    </div>

    <div id="redoc-container"></div>

    <script src="/v1/docs/redoc.standalone.js"></script>
    <script>
      fetch('/v1/docs/openapi.json')
        .then(function(res) {
          if (!res.ok) throw new Error('Failed to load openapi.json');
          return res.json();
        })
        .then(function(spec) {
          Redoc.init(
            spec,
            {
              hideHostname: false,
              hideDownloadButton: true,
              expandResponses: '200,201',
              theme: {
                colors: {
                  primary: {
                    main: '#282828'
                  },
                  success: {
                    main: '#16a34a'
                  },
                  responses: {
                    success: {
                      color: '#16a34a',
                      backgroundColor: 'rgba(22, 163, 74, 0.05)'
                    },
                    error: {
                      color: '#dc2626',
                      backgroundColor: 'rgba(220, 38, 38, 0.05)'
                    }
                  }
                },
                typography: {
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif',
                  headings: {
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: '700'
                  },
                  code: {
                    fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    fontSize: '13px'
                  }
                },
                sidebar: {
                  backgroundColor: '#f8fafc',
                  textColor: '#1e293b',
                  activeTextColor: '#282828'
                },
                rightPanel: {
                  backgroundColor: '#0f172a',
                  textColor: '#f8fafc'
                }
              }
            },
            document.getElementById('redoc-container')
          );
        })
        .catch(function(err) {
          document.getElementById('redoc-container').innerHTML = 
            '<div style=\"padding:40px; color:#dc2626; font-family:sans-serif;\">' +
            '<h3>Failed to load API documentation</h3><p>' + err.message + '</p></div>';
        });
    </script>
  </body>
</html>`;
  res.send(redocHtml);
});

module.exports = router;
