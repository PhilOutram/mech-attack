# Tabletop vision

Reads a photo of a game table and reports which marked piece sits on which hex or zone. It knows nothing about Mech Attack's rules: the game supplies a board description (`camera/board.json`) and decides what the pieces mean. This folder moves to its own repo once a second game (Myths of Time) uses it.

## Set up on Windows

```powershell
cd vision
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
pytest -q
```

## First table test

1. **Print the markers.** Print at 100% ("actual size", not "fit to page") on matte paper or matte sticker paper. Check the bar on page 1 measures 50 mm.

   ```powershell
   python -m tabletop_vision sheets marker-sheets.pdf
   ```

2. **Size test.** Lay page 1 where the board will go, set the phone on the tripod at playing height, and take a photo. Copy it to `vision\photos\` (not committed), then:

   ```powershell
   python -m tabletop_vision markers photos\sizes.jpg
   ```

   Each marker needs about 40 px across to read reliably. If the 10 mm one (ID 247) is under 40 px, raise the phone's resolution, lower the tripod, or use the 12 mm size.

3. **Measure a hex** flat side to flat side on the printed tiles. Put the figure in `FLAT_TO_FLAT_MM` in `tools/camera-board.mjs`, then from the repo root:

   ```powershell
   node tools/camera-board.mjs
   ```

4. **Make the anchors.** Cut out anchors 0 to 4 on their circles and stick each on a spare token disc, so they sit at the same height as the playing pieces.

5. **Calibration photo.** Lay out Fixed map 1. Put each anchor disc on its numbered hex in `camera/anchor-map.svg` (open it in a browser). Take the photo, then:

   ```powershell
   python -m tabletop_vision calibrate --board ..\camera\board.json photos\cal.jpg
   ```

   All five anchors should be found, with `error_mm` under about 3. A higher figure means an anchor is off its hex centre or the wrong hex.

6. **Play photo.** Lift the anchors off, keep the tripod exactly where it is, put a few stickered tokens on hexes and take another photo:

   ```powershell
   python -m tabletop_vision observe --board ..\camera\board.json --calibration-photo photos\cal.jpg photos\play.jpg
   ```

   Each token should come back with the right hex. `offset_mm` says how far it is from the hex centre.

If the tripod moves, take a new calibration photo.

## Markers

ArUco dictionary DICT_4X4_250. IDs 0 to 9 are anchors (0 to 4 printed). Token stickers come in pairs, one per side of a two-sided token: pair n is IDs 10 + 2n and 11 + 2n, up to 243. IDs 245 to 249 are the size test.

## The service

```powershell
uvicorn tabletop_vision.api:app --host 0.0.0.0 --port 8000
```

| Endpoint | Takes | Returns |
| --- | --- | --- |
| `GET /health` | nothing | `{"ok": true}` |
| `POST /tables/{table}/calibrate` | form fields `image` (photo) and `board` (board JSON) | anchors found, `error_mm` |
| `POST /tables/{table}/observe` | form field `image` | the observation: each marker's cell or zone, unplaced and duplicate markers |

`{table}` is any short code; calibrations are held in memory, so a restart needs a new calibration photo. Set `TABLETOP_STATIC` to a folder to serve it at `/` too, so a phone on the same Wi-Fi loads the app and the API from one address.

## Tests

`pytest -q` draws synthetic table photos (markers on a table, tilted, blurred, noised and JPEG-compressed) and checks every marker lands on the right hex. `tests/fixtures/hex-golden.json` holds hex centres from `hex.js`, so the Python hex maths always matches the app; regenerate it with `node tools/hex-golden.mjs`. CI checks both generated files are up to date, runs Ruff and pytest, and builds the Docker image.

## Files

| File | What it does |
| --- | --- |
| `tabletop_vision/hexgrid.py` | Flat-topped hex maths, matching `hex.js` |
| `tabletop_vision/detect.py` | Finds markers, calibrates from anchors, places each marker on a cell or zone |
| `tabletop_vision/sheets.py` | The printable marker sheets |
| `tabletop_vision/api.py` | The FastAPI service |
| `tabletop_vision/__main__.py` | The command line |
| `tests/synth.py` | Synthetic table photos for the tests |
| `Dockerfile` | The service image |
