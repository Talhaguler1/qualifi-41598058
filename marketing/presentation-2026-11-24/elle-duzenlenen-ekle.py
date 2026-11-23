"""Put the user's hand-edited slides (saved under locked/) back into a freshly built deck.

The user edits some slides in PowerPoint and asked that those not be touched. The build
regenerates everything, so after each build this replaces those slides' XML with the user's
version and copies their pictures in under unique names.
"""
import re
import shutil
import sys
import zipfile
from pathlib import Path

deck = Path(sys.argv[1])
locked = Path(sys.argv[2])
slides = sys.argv[3:] or ["slide2.xml"]

tmp = deck.with_suffix(".splice.pptx")
with zipfile.ZipFile(deck) as zin:
    names = zin.namelist()
    files = {n: zin.read(n) for n in names}

for slide in slides:
    rels_name = f"ppt/slides/_rels/{slide}.rels"
    rels = (locked / "slides" / "_rels" / f"{slide}.rels").read_text(encoding="utf-8")
    for target in re.findall(r'Target="\.\./media/([^"]+)"', rels):
        new = f"locked_{slide.split('.')[0]}_{target}"
        files[f"ppt/media/{new}"] = (locked / "media" / target).read_bytes()
        rels = rels.replace(f'Target="../media/{target}"', f'Target="../media/{new}"')
    files[f"ppt/slides/{slide}"] = (locked / "slides" / slide).read_bytes()
    files[rels_name] = rels.encode("utf-8")

with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
    order = names + [n for n in files if n not in names]
    for n in order:
        zout.writestr(n, files[n])
shutil.move(tmp, deck)
print("spliced", slides)
