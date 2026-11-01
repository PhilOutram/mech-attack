# Experiments

Trials that are not part of the service yet.

## Identifying tokens from their art, without stickers (1 November 2026)

`appearance.py` tests whether the camera can tell a token's type and colour from its art alone. It draws a virtual Fixed map 1 with tokens (25 mm cream discs carrying the game's art) on about 60% of the hexes, at random angles and up to 4 mm off centre. A reference strip beside the board holds one token of each type and one of each colour. The table is photographed with tilt, blur, noise and JPEG compression, with and without a warm, uneven light.

Method, all classical OpenCV and NumPy, no trained model:
1. Map the photo onto the table with the anchor calibration.
2. For each hex, find a cream disc on the red tile, and its centre.
3. Cut the disc out as a 64 x 64 top-down crop.
4. Type: compare the dark ink lines and edges (the same in every colour) with the reference strip's tokens at 36 rotations.
5. Colour: white-balance the crop on its own cream rim, then compare its main colour with that type's art in each of the seven colours.

Results, 4 photos per row, 193 tokens and 143 empty hexes:

| Photo detail | Disc size in photo | Type right | Colour right | Empty hexes read as tokens |
| --- | --- | --- | --- | --- |
| 6 px/mm | 150 px | 99–100% | 100% | 0 |
| 4 px/mm | 100 px | 99–100% | 98% | 0 |
| 3 px/mm | 75 px | 100% | 96–97% | 0 |

Repeated mistakes: light medic and light harvester (heavy cannon read as harvester once or twice), purple spotter drones read as blue, flat yellow units read as orange. White units are recognised by having almost no colour against the cream disc.

Not tested: printed tokens (ink colour, gloss, glare, shadows), the firing side, red tokens on red tiles, hands in the shot. These synthetic photos flatter the method; a real photo is the next test.

To run it, render the token art to PNGs named `<type>-<colour>.png`, then:

```powershell
$env:PYTHONPATH = "."
python experiments/appearance.py <art folder> ..\camera\board.json --trials 4
```
