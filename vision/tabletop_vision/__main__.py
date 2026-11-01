"""Command line: python -m tabletop_vision <command>

sheets OUT.pdf                          print the marker sheets
markers PHOTO                           list the markers a photo shows, and their size
calibrate --board B.json PHOTO          check a calibration photo
observe --board B.json --calibration-photo CAL PHOTO
                                        read a play photo, print the observation JSON
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np

from .detect import Board, CalibrationError, calibrate, decode_image, find_markers, observe
from .sheets import write_pdf


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m tabletop_vision")
    commands = parser.add_subparsers(dest="command", required=True)

    sheets = commands.add_parser("sheets", help="write the printable marker sheets")
    sheets.add_argument("out", type=Path)

    found = commands.add_parser("markers", help="list the markers a photo shows, and their size")
    found.add_argument("photo", type=Path)

    cal = commands.add_parser("calibrate", help="check a calibration photo")
    cal.add_argument("--board", type=Path, required=True)
    cal.add_argument("photo", type=Path)

    obs = commands.add_parser("observe", help="read a play photo")
    obs.add_argument("--board", type=Path, required=True)
    obs.add_argument("--calibration-photo", type=Path)
    obs.add_argument("photo", type=Path)

    args = parser.parse_args(argv)
    try:
        if args.command == "sheets":
            pages = write_pdf(str(args.out))
            print(f"Wrote {pages} pages to {args.out}")
        elif args.command == "markers":
            image = _photo(args.photo)
            markers = find_markers(image)
            print(f"{len(markers)} markers in a {image.shape[1]} x {image.shape[0]} photo")
            for m in markers:
                side = float(np.mean(np.linalg.norm(m.corners - np.roll(m.corners, 1, 0), axis=1)))
                x, y = m.centre
                print(f"  ID {m.id:3d}: {side:5.1f} px across, at ({x:.0f}, {y:.0f})")
        elif args.command == "calibrate":
            board = _board(args.board)
            print(json.dumps(calibrate(_photo(args.photo), board), indent=2))
        elif args.command == "observe":
            board = _board(args.board)
            calibration = None
            if args.calibration_photo:
                calibration = calibrate(_photo(args.calibration_photo), board)
            print(json.dumps(observe(_photo(args.photo), board, calibration), indent=2))
    except CalibrationError as error:
        print(f"Calibration problem: {error}", file=sys.stderr)
        return 2
    return 0


def _board(path: Path) -> Board:
    return Board.from_json(json.loads(path.read_text(encoding="utf-8")))


def _photo(path: Path):
    return decode_image(path.read_bytes())


if __name__ == "__main__":
    sys.exit(main())
