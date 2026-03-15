"""
Travelsign backend API.
Designed to be safe when exposed: no secrets or internal errors in responses.
"""
import os
import base64
import json
import logging

from flask import Flask, jsonify, request

# Load .env from backend directory (same folder as this script)
_backend_dir = os.path.dirname(os.path.abspath(__file__))
_env_path = os.path.normpath(os.path.join(_backend_dir, ".env"))

try:
  from dotenv import load_dotenv
  load_dotenv(dotenv_path=_env_path, override=True)
  if not os.getenv("GEMINI_API_KEY"):
    load_dotenv(dotenv_path=os.path.normpath(os.path.join(os.getcwd(), ".env")), override=True)
  if not os.getenv("GEMINI_API_KEY"):
    _cwd_backend_env = os.path.normpath(os.path.join(os.getcwd(), "backend", ".env"))
    if os.path.isfile(_cwd_backend_env):
      load_dotenv(dotenv_path=_cwd_backend_env, override=True)
except ImportError:
  pass

# Fallback: if key still missing but .env exists, read it manually (handles BOM/encoding)
if not os.getenv("GEMINI_API_KEY") and os.path.isfile(_env_path):
  try:
    with open(_env_path, "r", encoding="utf-8-sig") as f:
      for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
          k, _, v = line.partition("=")
          k, v = k.strip(), v.strip().strip('"').strip("'")
          if k == "GEMINI_API_KEY" and v:
            os.environ["GEMINI_API_KEY"] = v
            break
  except Exception:
    pass

# -----------------------------------------------------------------------------
# Config (env only; never log or return these)
# -----------------------------------------------------------------------------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PLACES_API_KEY = os.getenv("PLACES_API_KEY")
ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "*")  # Set to your app origin in production
MAX_BODY_MB = int(os.getenv("MAX_BODY_MB", "15"))

if not GEMINI_API_KEY:
  _env_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
  raise RuntimeError(
    "GEMINI_API_KEY env var is required. "
    "Add it to backend/.env (e.g. GEMINI_API_KEY=your_key). "
    "Expected .env at: %s (exists: %s)" % (_env_file, os.path.isfile(_env_file))
  )

import google.generativeai as genai
import requests

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")

# -----------------------------------------------------------------------------
# App
# -----------------------------------------------------------------------------
app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_BODY_MB * 1024 * 1024

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

# Language code -> full name for Gemini
_LANG_FOR_PROMPT = {"en": "English", "ja": "Japanese", "zh": "Simplified Chinese", "es": "Spanish", "ko": "Korean"}
# Accept both codes and full names from client (frontend may send "Japanese" or "ja")
_LANG_ALIASES = {
  "en": "en", "english": "en",
  "ja": "ja", "japanese": "ja",
  "zh": "zh", "chinese": "zh",
  "es": "es", "spanish": "es",
  "ko": "ko", "korean": "ko",
}


def _sanitize_lang(raw: str) -> str:
  if not raw or not isinstance(raw, str):
    return "en"
  v = raw.strip().lower()
  return _LANG_ALIASES.get(v, "en")


def _client_error(message: str, status: int = 400):
  return jsonify({"error": message}), status


def _server_error(public_message: str, internal_error: Exception, context: str = ""):
  log.error("%s: %s", context or "Error", internal_error, exc_info=True)
  return jsonify({"error": public_message}), 500


# -----------------------------------------------------------------------------
# CORS (safe for exposed API)
# -----------------------------------------------------------------------------
@app.after_request
def cors_headers(response):
  origin = request.environ.get("HTTP_ORIGIN", "")
  if ALLOWED_ORIGIN == "*" or origin == ALLOWED_ORIGIN:
    response.headers["Access-Control-Allow-Origin"] = origin or ALLOWED_ORIGIN
  response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
  response.headers["Access-Control-Allow-Headers"] = "Content-Type"
  return response


@app.route("/health", methods=["OPTIONS"])
@app.route("/translate", methods=["OPTIONS"])
@app.route("/ocr", methods=["OPTIONS"])
@app.route("/nearby", methods=["OPTIONS"])
def options_cors():
  return "", 204


# -----------------------------------------------------------------------------
# Health (no secrets, no internal details)
# -----------------------------------------------------------------------------
@app.get("/health")
def health():
  return jsonify({"status": "ok"})


# -----------------------------------------------------------------------------
# Translate
# -----------------------------------------------------------------------------
@app.post("/translate")
def translate():
  try:
    data = request.get_json(force=True, silent=True) or {}
  except Exception as e:
    return _client_error("Invalid JSON body")
  if not isinstance(data, dict):
    return _client_error("Body must be a JSON object")

  text = (data.get("text") or "").strip()
  target_lang = _sanitize_lang(str(data.get("targetLang", "en")))

  if not text:
    return _client_error("text is required")

  lang_name = _LANG_FOR_PROMPT.get(target_lang, "English")
  prompt = (
    f"You are a translator. Translate the following text into {lang_name}. "
    f"Your reply must contain ONLY the {lang_name} translation, no English, no explanation, no extra text. "
    f"If the text is already in {lang_name}, return it unchanged.\n\nText to translate:\n{text}"
  )
  try:
    resp = model.generate_content(prompt)
    translated = (resp.text or "").strip()
    return jsonify({"translatedText": translated})
  except Exception as e:
    return _server_error("Translation failed. Please try again.", e, "translate")


def reverse_geocode(lat: float, lng: float) -> str:
  try:
    url = "https://nominatim.openstreetmap.org/reverse"
    params = {
      "format": "jsonv2",
      "lat": lat,
      "lon": lng,
      "zoom": 12,
      "addressdetails": 1,
    }
    headers = {"User-Agent": "Travelsign/1.0"}
    r = requests.get(url, params=params, headers=headers, timeout=10)
    r.raise_for_status()
    data = r.json()
    addr = data.get("address", {})
    city = addr.get("city") or addr.get("town") or addr.get("village")
    state = addr.get("state")
    country = addr.get("country")
    parts = [p for p in [city, state, country] if p]
    return ", ".join(parts) if parts else data.get("display_name", "")
  except Exception:
    return ""


def ai_suggest_places(location_label: str) -> list[dict]:
  if not location_label:
    return []
  prompt = f"""
You are helping a traveler explore around {location_label}.

List 10 interesting nearby places such as malls, supermarkets, parks, landmarks,
and tourist attractions that a visitor might want to check out.

Return ONLY a JSON array (no extra text) where each item has:
- id: a short unique string (can be slugified name)
- name: place name
- category: short category like "Mall", "Supermarket", "Park", "Tourist spot"

Example:
[
  {{"id": "sm-north-edsa", "name": "SM North EDSA", "category": "Mall"}},
  {{"id": "puregold-xyz", "name": "Puregold XYZ", "category": "Supermarket"}}
]
"""
  try:
    resp = model.generate_content(prompt)
    raw = (resp.text or "").strip()
    if raw.startswith("```"):
      raw = raw.strip("`")
      if "\n" in raw:
        raw = raw.split("\n", 1)[1]
    data = json.loads(raw)
    if isinstance(data, list):
      cleaned = []
      for item in data:
        if not isinstance(item, dict):
          continue
        cleaned.append({
          "id": str(item.get("id") or item.get("name") or len(cleaned)),
          "name": item.get("name") or "Place",
          "category": item.get("category") or "Place",
          "lat": None,
          "lng": None,
        })
      return cleaned
  except Exception:
    pass
  return []


# -----------------------------------------------------------------------------
# OCR
# -----------------------------------------------------------------------------
@app.post("/ocr")
def ocr():
  try:
    data = request.get_json(force=True, silent=True) or {}
  except Exception:
    return _client_error("Invalid JSON body")
  if not isinstance(data, dict):
    return _client_error("Body must be a JSON object")

  image_b64 = (data.get("imageBase64") or "").strip()
  crop_rect = data.get("cropRect") or {}

  if not image_b64:
    return _client_error("imageBase64 is required")

  if "," in image_b64:
    image_b64 = image_b64.split(",")[-1]
  image_b64 = image_b64.replace(" ", "").replace("\n", "").replace("\r", "")

  try:
    image_bytes = base64.b64decode(image_b64)
  except Exception:
    return _client_error("Invalid base64 image data")

  # Reasonable size limit (e.g. 10MB decoded)
  if len(image_bytes) > 10 * 1024 * 1024:
    return _client_error("Image too large")

  mime_type = "image/jpeg"
  if len(image_bytes) >= 4:
    if image_bytes[:4] == b"\x89PNG":
      mime_type = "image/png"
    elif image_bytes[:2] == b"\xff\xd8":
      mime_type = "image/jpeg"
    elif image_bytes[:4] == b"RIFF" and image_bytes[8:12] == b"WEBP":
      mime_type = "image/webp"
    elif image_bytes[:6] in (b"GIF87a", b"GIF89a"):
      mime_type = "image/gif"

  # Normalize image for OCR: apply EXIF orientation (critical for Android camera), resize if needed, re-encode as JPEG.
  # Android (and some iOS) cameras often send JPEGs with EXIF rotation; raw bytes are not rotated, so OCR would see wrong orientation.
  try:
    from PIL import Image, ImageOps
    import io
    img = Image.open(io.BytesIO(image_bytes))
    # Apply EXIF orientation so image is in correct display rotation (fixes Android/iOS camera orientation)
    try:
      img = ImageOps.exif_transpose(img)
    except Exception:
      pass
    w, h = img.size
    max_side = 2048
    max_bytes = 2 * 1024 * 1024
    if w > max_side or h > max_side or len(image_bytes) > max_bytes:
      ratio = min(max_side / w, max_side / h, 1.0)
      if ratio < 1.0:
        nw, nh = int(w * ratio), int(h * ratio)
        img = img.resize((nw, nh), Image.Resampling.LANCZOS)
    if img.mode in ("RGBA", "P"):
      img = img.convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85, optimize=True)
    image_bytes = buf.getvalue()
    mime_type = "image/jpeg"
    log.info("OCR: normalized image to %sx%s, %s bytes", img.width, img.height, len(image_bytes))
  except Exception as norm_err:
    log.warning("OCR: image normalize failed, using original: %s", norm_err)

  hint = ""
  if isinstance(crop_rect, dict) and all(k in crop_rect for k in ("x", "y", "width", "height")):
    try:
      x, y, w, h = crop_rect["x"], crop_rect["y"], crop_rect["width"], crop_rect["height"]
      hint = (
        "Only read the text inside the rectangle defined by "
        f"x={x:.2f}, y={y:.2f}, width={w:.2f}, height={h:.2f} (normalized 0-1). "
      )
    except (ValueError, TypeError):
      pass

  prompt = (
    f"{hint}Return exactly the text you see in that area, preserving line breaks. "
    "Do not add explanations or translation, only the raw text."
  )

  try:
    resp = model.generate_content([
      {"mime_type": mime_type, "data": image_bytes},
      {"text": prompt},
    ])
    text = (resp.text or "").strip()
    return jsonify({"text": text})
  except Exception as e:
    err_msg = str(e).lower()
    log.error("OCR Gemini error: %s", e, exc_info=True)
    if "size" in err_msg or "dimension" in err_msg or "3072" in err_msg or "resolution" in err_msg:
      return jsonify({"error": "Image is too large. Try a smaller or lower-quality photo."}), 413
    if "blocked" in err_msg or "policy" in err_msg or "safe" in err_msg:
      return jsonify({"error": "Image could not be processed. Try a different photo."}), 400
    if "quota" in err_msg or "limit" in err_msg or "429" in err_msg:
      return jsonify({"error": "Service is busy. Please try again in a moment."}), 503
    return _server_error("OCR processing failed. Please try again.", e, "ocr")


# -----------------------------------------------------------------------------
# Nearby places
# -----------------------------------------------------------------------------
@app.get("/nearby")
def nearby():
  if not PLACES_API_KEY:
    log.error("PLACES_API_KEY not set")
    return jsonify({"error": "Service unavailable"}), 503

  try:
    lat = float(request.args.get("lat", ""))
    lng = float(request.args.get("lng", ""))
  except (ValueError, TypeError):
    return _client_error("lat and lng query params are required")

  if not (-90 <= lat <= 90 and -180 <= lng <= 180):
    return _client_error("lat/lng out of range")

  try:
    radius = int(request.args.get("radius_m", "5000"))
    radius = max(100, min(50000, radius))
  except (ValueError, TypeError):
    radius = 5000

  url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
  params = {
    "location": f"{lat},{lng}",
    "radius": radius,
    "keyword": "supermarket grocery mall market tourist attraction",
    "key": PLACES_API_KEY,
  }

  try:
    r = requests.get(url, params=params, timeout=10)
    r.raise_for_status()
    data = r.json()
  except Exception as e:
    return _server_error("Places request failed. Please try again.", e, "nearby")

  results = data.get("results", [])[:20]
  places = []
  for r in results:
    loc = r.get("geometry", {}).get("location", {})
    places.append({
      "id": r.get("place_id"),
      "name": r.get("name"),
      "category": ", ".join(r.get("types", [])[:3]) if r.get("types") else "Market",
      "lat": loc.get("lat"),
      "lng": loc.get("lng"),
    })

  if not places:
    location_label = reverse_geocode(lat, lng)
    ai_places = ai_suggest_places(location_label)
    places.extend(ai_places)

  return jsonify({"places": places})


# -----------------------------------------------------------------------------
# Request size and 404
# -----------------------------------------------------------------------------
@app.errorhandler(413)
def request_too_large(_e):
  return jsonify({"error": "Request body too large"}), 413


@app.errorhandler(404)
def not_found(_e):
  return jsonify({"error": "Not found"}), 404


if __name__ == "__main__":
  app.run(host="0.0.0.0", port=5000)
