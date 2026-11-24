"""Edit the user's saved deck in place: drop the small section labels, put every title in one
centred box, and enlarge the top-right logo. Nothing else in the file is touched."""
import re
import shutil
import sys
import zipfile

src, dst = sys.argv[1], sys.argv[2]
E = 914400
emu = lambda inch: str(round(inch * E))

# One title box for every content slide: centred between the margins, clear of the logo,
# vertically centred on the logo's line.
TX, TY, TW, TH = 0.6, 0.55, 12.13, 0.7
# Logo lock-up (layout): icon + word, right edge on the 0.6" margin, centred on the title line.
ICON = 0.44
LOGO_Y = 0.14

with zipfile.ZipFile(src) as z:
    names = z.namelist()
    files = {n: z.read(n) for n in names}

changed = []
for n in names:
    m = re.fullmatch(r"ppt/slides/slide(\d+)\.xml", n)
    if not m:
        continue
    s = files[n].decode("utf-8")
    before = s
    # 1) section label: the small 11pt text box at the top left (pptxgenjs "Text 0" at y 0.18")
    def drop_label(mm):
        b = mm.group(0)
        off = re.search(r'<a:off x="(\d+)" y="(\d+)"/>', b)
        if off and int(off.group(2)) < 0.3 * E and 'sz="1100"' in b and 'name="Text 0"' in b:
            return ""
        return b
    s = re.sub(r"<p:sp>.*?</p:sp>", drop_label, s, flags=re.S)

    # 2) the title box, wherever the user moved it
    def place_title(mm):
        b = mm.group(0)
        if 'name="Başlık"' not in b:
            return b
        b = re.sub(r'<a:off x="-?\d+" y="-?\d+"/><a:ext cx="\d+" cy="\d+"/>',
                   f'<a:off x="{emu(TX)}" y="{emu(TY)}"/><a:ext cx="{emu(TW)}" cy="{emu(TH)}"/>', b, count=1)
        b = re.sub(r'anchor="[a-z]+"', 'anchor="ctr"', b)
        b = re.sub(r'wrap="none"', 'wrap="square"', b)
        if 'anchor="ctr"' not in b:
            b = b.replace("<a:bodyPr", '<a:bodyPr anchor="ctr"', 1)
        # centre every paragraph of the title
        b = re.sub(r"<a:pPr([^>]*?)algn=\"[a-z]+\"", r'<a:pPr\1algn="ctr"', b)
        b = re.sub(r"<a:p>(?!<a:pPr)", '<a:p><a:pPr algn="ctr"/>', b)
        b = re.sub(r"<a:pPr(?![^>]*algn=)", '<a:pPr algn="ctr"', b)
        return b
    s = re.sub(r"<p:sp>.*?</p:sp>", place_title, s, flags=re.S)
    if s != before:
        files[n] = s.encode("utf-8")
        changed.append(int(m.group(1)))

# 3) logo lock-up in the content layout
lay = "ppt/slideLayouts/slideLayout2.xml"
s = files[lay].decode("utf-8")
def logo(mm):
    b = mm.group(0)
    if mm.group(1) == "pic":
        return re.sub(r'<a:off x="\d+" y="\d+"/><a:ext cx="\d+" cy="\d+"/>',
                      f'<a:off x="{emu(12.73 - 1.62)}" y="{emu(LOGO_Y)}"/><a:ext cx="{emu(ICON)}" cy="{emu(ICON)}"/>', b, count=1)
    if "<a:t>QualiFi</a:t>" in b:
        b = re.sub(r'<a:off x="\d+" y="\d+"/><a:ext cx="\d+" cy="\d+"/>',
                   f'<a:off x="{emu(12.73 - 1.1)}" y="{emu(LOGO_Y)}"/><a:ext cx="{emu(1.1)}" cy="{emu(ICON)}"/>', b, count=1)
        b = re.sub(r'sz="\d+"', 'sz="1900"', b)
    return b
s = re.sub(r"<p:(sp|pic)>.*?</p:\1>", logo, s, flags=re.S)
files[lay] = s.encode("utf-8")

with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as z:
    for n in names:
        z.writestr(n, files[n])
print("slides changed:", sorted(changed))
