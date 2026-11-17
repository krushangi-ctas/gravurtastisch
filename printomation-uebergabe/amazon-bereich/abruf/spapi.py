"""SP-API-Client: LWA-Token-Tausch und Reports-API (create → poll → download).

Kein AWS-Signing nötig (seit 2023 reicht das LWA-Access-Token).
"""
import gzip
import json
import logging
import time

import requests

import config

log = logging.getLogger("spapi")

REPORTS_BASE = f"{config.SP_API_ENDPOINT}/reports/2021-06-30"

_token_cache = {"access_token": None, "expires_at": 0.0}


class SpApiError(Exception):
    pass


class AuthError(SpApiError):
    """Credentials falsch/fehlend — Weiterlaufen ist sinnlos."""


class RoleError(SpApiError):
    """403: der App fehlt vermutlich die Rolle 'Brand Analytics'."""


class ReportFailed(SpApiError):
    """Report endete in FATAL/CANCELLED (meist: keine Daten für den Tag)."""


class ReportTimeout(SpApiError):
    """Report nach dem Zeitlimit noch nicht fertig — die reportId bleibt gültig."""


def get_access_token() -> str:
    missing = config.credentials_missing()
    if missing:
        raise AuthError(
            "Fehlende Werte in .env: " + ", ".join(missing)
            + " — LWA Client ID/Secret in Seller Central unter "
            "Partner-Netzwerk → App entwickeln → 'LWA-Anmeldeinformationen anzeigen'."
        )

    now = time.time()
    if _token_cache["access_token"] and now < _token_cache["expires_at"]:
        return _token_cache["access_token"]

    for _ in range(10):  # übersteht kurze Netzausfälle (WLAN nach Standby etc.)
        try:
            resp = requests.post(
                config.LWA_TOKEN_URL,
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": config.SP_API_REFRESH_TOKEN,
                    "client_id": config.LWA_CLIENT_ID,
                    "client_secret": config.LWA_CLIENT_SECRET,
                },
                timeout=30,
            )
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
            log.warning("Netzwerk nicht erreichbar (Token-Abruf), neuer Versuch in 30s …")
            time.sleep(30)
            continue
        # 429/5xx sind transient (Rate-Limit/Amazon-Störung) — kein Credential-Problem
        if resp.status_code == 429 or resp.status_code >= 500:
            log.warning("LWA-Token-Endpunkt antwortet %s, neuer Versuch in 30s …", resp.status_code)
            time.sleep(30)
            continue
        break
    else:
        raise SpApiError("Token-Abruf: nach 10 Versuchen nicht erfolgreich (Netz/Rate-Limit)")
    if resp.status_code != 200:
        raise AuthError(f"LWA-Token-Tausch fehlgeschlagen ({resp.status_code}): {resp.text[:500]}")

    payload = resp.json()
    _token_cache["access_token"] = payload["access_token"]
    _token_cache["expires_at"] = now + int(payload.get("expires_in", 3600)) - 300
    return _token_cache["access_token"]


def _request(method: str, url: str, *, json_body=None, max_retries: int = 60) -> requests.Response:
    """SP-API-Request mit 429-Backoff. Wirft AuthError/RoleError bei 401/403."""
    for attempt in range(max_retries):
        headers = {"x-amz-access-token": get_access_token()}
        try:
            resp = requests.request(method, url, headers=headers, json=json_body, timeout=60)
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
            # Netzausfall (Standby, WLAN weg): warten statt den Tag als Fehler abhaken
            log.warning("Netzwerk nicht erreichbar (%s), neuer Versuch in 30s …", url.rsplit('/', 1)[-1])
            time.sleep(30)
            continue

        if resp.status_code == 429:
            # Kurz nachfassen statt lange pauschal warten: das Token-Kontingent
            # füllt sich kontinuierlich (~1/min), so verschenken wir max. ~10s
            wait = 10 if method == "POST" else 5
            log.info("Rate-Limit (429), warte %ss …", wait)
            time.sleep(wait)
            continue
        if resp.status_code == 401:
            raise AuthError(f"401 Unauthorized: {resp.text[:500]}")
        if resp.status_code == 403:
            raise RoleError(
                "403 Forbidden — der App fehlt vermutlich die Rolle 'Brand Analytics' "
                "(Entwicklerprofil → Rolle beantragen, danach App neu autorisieren). "
                f"Antwort: {resp.text[:500]}"
            )
        if resp.status_code >= 500:
            log.warning("Serverfehler %s, Versuch %s/%s", resp.status_code, attempt + 1, max_retries)
            time.sleep(10)
            continue
        if not resp.ok:
            raise SpApiError(f"{method} {url} → {resp.status_code}: {resp.text[:500]}")
        return resp
    raise SpApiError(f"{method} {url}: nach {max_retries} Versuchen aufgegeben (Rate-Limit/Serverfehler)")


def create_report(day: str) -> str:
    """Fordert den Sales&Traffic-Report für genau einen Tag an, gibt reportId zurück.

    Wichtig: salesAndTrafficByAsin ist immer über den gesamten Zeitraum aggregiert,
    daher pro Tag ein eigener Report (dataStartTime == dataEndTime).
    """
    # CHILD statt SKU: der SKU-Report lässt Produkte ohne Verkäufe am Tag weg,
    # der CHILD-Report enthält auch reine Traffic-Tage (verifiziert 14.07.2026)
    body = {
        "reportType": config.REPORT_TYPE,
        "reportOptions": {"dateGranularity": "DAY", "asinGranularity": "CHILD"},
        "dataStartTime": f"{day}T00:00:00Z",
        "dataEndTime": f"{day}T23:59:59Z",
        "marketplaceIds": [config.MARKETPLACE_ID],
    }
    resp = _request("POST", f"{REPORTS_BASE}/reports", json_body=body)
    return resp.json()["reportId"]


def wait_for_report(report_id: str, poll_seconds: int = 15, timeout_minutes: int = 20) -> str:
    """Pollt bis DONE und gibt die reportDocumentId zurück."""
    deadline = time.time() + timeout_minutes * 60
    while time.time() < deadline:
        info = _request("GET", f"{REPORTS_BASE}/reports/{report_id}").json()
        status = info.get("processingStatus")
        if status == "DONE":
            return info["reportDocumentId"]
        if status in ("FATAL", "CANCELLED"):
            raise ReportFailed(f"Report {report_id} endete mit {status}")
        time.sleep(poll_seconds)
    raise ReportTimeout(f"Report {report_id} nach {timeout_minutes} min nicht fertig")


def download_file(url: str, max_retries: int = 5) -> bytes:
    """S3-Download mit Retry — die einzige Stelle, die sonst keine Netz-Toleranz hätte."""
    for attempt in range(max_retries):
        try:
            resp = requests.get(url, timeout=120)
            if resp.status_code >= 500:
                raise requests.exceptions.ConnectionError(f"HTTP {resp.status_code}")
            resp.raise_for_status()
            return resp.content
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as exc:
            log.warning("Download fehlgeschlagen (%s), Versuch %s/%s …", exc, attempt + 1, max_retries)
            time.sleep(15)
    raise SpApiError(f"Download nach {max_retries} Versuchen fehlgeschlagen")


def download_report(document_id: str) -> dict:
    doc = _request("GET", f"{REPORTS_BASE}/documents/{document_id}").json()
    raw = download_file(doc["url"])
    if doc.get("compressionAlgorithm") == "GZIP":
        raw = gzip.decompress(raw)
    return json.loads(raw.decode("utf-8"))


def get_catalog_items(asins: list[str]) -> dict[str, dict]:
    """Titel, Bilder und Farbe/Größe über die Catalog-Items-API (max. 20 ASINs pro Request).

    Benötigt die Rolle „Product Listing" — sonst RoleError (403). Bilder: je Bildplatz (MAIN, PT01 …) die größte
    Fassung; Amazon liefert jede davon über einen Größen-Zusatz („._SX160_") auch verkleinert.
    """
    items: dict[str, dict] = {}
    for i in range(0, len(asins), 20):
        batch = asins[i : i + 20]
        url = (
            f"{config.SP_API_ENDPOINT}/catalog/2022-04-01/items"
            f"?identifiers={','.join(batch)}&identifiersType=ASIN"
            f"&marketplaceIds={config.MARKETPLACE_ID}&includedData=summaries,images&pageSize=20"
        )
        data = _request("GET", url).json()
        for item in data.get("items", []):
            summary = (item.get("summaries") or [{}])[0]
            groesste: dict[str, dict] = {}
            for satz in item.get("images") or []:
                for b in satz.get("images") or []:
                    platz = b.get("variant") or "MAIN"
                    if b.get("link") and (b.get("width") or 0) > (groesste.get(platz, {}).get("width") or 0):
                        groesste[platz] = b
            bilder = [groesste[p]["link"] for p in sorted(groesste, key=lambda p: (p != "MAIN", p))]
            items[item["asin"]] = {
                "titel": summary.get("itemName"),
                "bild": bilder[0] if bilder else None,
                "bilder": bilder,
                "farbe": summary.get("color"),
                "groesse": summary.get("size"),
            }
        time.sleep(0.6)  # Rate-Limit der Catalog-API (~2/s) nicht ausreizen
    return items


def fetch_day(day: str) -> dict | None:
    """Kompletter Ablauf für einen Tag. None = Amazon hat keine Daten (FATAL/CANCELLED)."""
    report_id = create_report(day)
    log.info("%s: Report %s angefordert, warte auf Fertigstellung …", day, report_id)
    try:
        document_id = wait_for_report(report_id)
    except ReportFailed as exc:
        log.info("%s: %s — als 'leer' verbucht", day, exc)
        return None
    return download_report(document_id)
