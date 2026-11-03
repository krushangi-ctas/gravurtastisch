"""Zentrale Konfiguration des Abrufs: lädt die Zugangsdaten aus amazon-bereich/.env
(eigene SP-API-App mit Berichts-Recht — nicht Printomations Orders-Zugang)."""
import os
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:  # Server ohne python-dotenv: einfache KEY=WERT-Zeilen reichen
    def load_dotenv(path):
        if not Path(path).exists():
            return
        for line in Path(path).read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip().removeprefix("export ").strip()
            os.environ.setdefault(key, value.strip().strip("'\""))

PROJECT_DIR = Path(__file__).resolve().parent.parent   # .../amazon-bereich
PACKAGE_DIR = Path(__file__).resolve().parent           # .../amazon-bereich/abruf
DATA_DIR = PACKAGE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

load_dotenv(PROJECT_DIR / ".env")

LWA_CLIENT_ID = os.getenv("LWA_CLIENT_ID", "").strip()
LWA_CLIENT_SECRET = os.getenv("LWA_CLIENT_SECRET", "").strip()
SP_API_REFRESH_TOKEN = os.getenv("SP_API_REFRESH_TOKEN", "").strip()

# Überschreibbar für Tests/Demo-Daten
DB_PATH = Path(os.getenv("BUSINESS_DB_PATH", DATA_DIR / "business.db"))

LWA_TOKEN_URL = "https://api.amazon.com/auth/o2/token"
SP_API_ENDPOINT = "https://sellingpartnerapi-eu.amazon.com"
MARKETPLACE_ID = "A1PA6795UKMFR9"  # amazon.de
MARKETPLACE_TZ = "Europe/Berlin"

REPORT_TYPE = "GET_SALES_AND_TRAFFIC_REPORT"

# Traffic-Daten sind erst nach ~48-72h final: regulär bis heute-2 abrufen,
# die jüngsten REFRESH_DAYS bereits geholten Tage werden erneut gezogen.
DATA_LAG_DAYS = 2
REFRESH_DAYS = 3

# Frühestes Datum, falls kein Backfill-Start gesetzt wurde
DEFAULT_START_OFFSET_DAYS = 14


def credentials_missing() -> list[str]:
    """Liste der fehlenden Credential-Namen (leer = alles vorhanden)."""
    missing = []
    if not LWA_CLIENT_ID:
        missing.append("LWA_CLIENT_ID")
    if not LWA_CLIENT_SECRET:
        missing.append("LWA_CLIENT_SECRET")
    if not SP_API_REFRESH_TOKEN:
        missing.append("SP_API_REFRESH_TOKEN")
    return missing
