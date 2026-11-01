"""The vision service: photos in, observations out.

Run locally:  uvicorn tabletop_vision.api:app --host 0.0.0.0 --port 8000
Set TABLETOP_STATIC to a folder to serve it at / as well (the game app, so a phone on the
same Wi-Fi loads the app and the API from one address).

Calibrations are held in memory per table code, so a restart means a new calibration photo.
"""

from __future__ import annotations

import json
import os
from typing import Annotated

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from . import __version__
from .detect import Board, CalibrationError, calibrate, decode_image, observe

app = FastAPI(title="Tabletop vision", version=__version__)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("TABLETOP_ORIGINS", "*").split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

_tables: dict[str, dict] = {}


@app.get("/health")
def health() -> dict:
    return {"ok": True, "version": __version__}


@app.post("/tables/{table}/calibrate")
async def calibrate_table(
    table: str, image: Annotated[UploadFile, File()], board: Annotated[str, Form()]
):
    board_json = _parse_board(board)
    photo = await _read(image)
    try:
        calibration = calibrate(photo, Board.from_json(board_json))
    except CalibrationError as error:
        raise HTTPException(422, str(error)) from error
    _tables[table] = {"board": board_json, "calibration": calibration}
    return calibration


@app.post("/tables/{table}/observe")
async def observe_table(table: str, image: Annotated[UploadFile, File()]):
    entry = _tables.get(table)
    if entry is None:
        raise HTTPException(404, "This table has no calibration yet")
    photo = await _read(image)
    try:
        result = observe(photo, Board.from_json(entry["board"]), entry["calibration"])
    except CalibrationError as error:
        raise HTTPException(422, str(error)) from error
    return result


def _parse_board(text: str) -> dict:
    try:
        board = json.loads(text)
        Board.from_json(board)
    except (ValueError, KeyError, TypeError) as error:
        raise HTTPException(400, f"Board description not valid: {error}") from error
    return board


async def _read(upload: UploadFile):
    try:
        return decode_image(await upload.read())
    except ValueError as error:
        raise HTTPException(400, str(error)) from error


if os.environ.get("TABLETOP_STATIC"):
    app.mount("/", StaticFiles(directory=os.environ["TABLETOP_STATIC"], html=True), name="app")
