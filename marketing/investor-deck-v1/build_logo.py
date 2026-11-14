"""Optical cleanup of QualiFi's existing q-and-dot identity as outlined SVG.
The image-generation study is a concept reference; the deliverable uses flat,
precise brand colours and font outlines, without raster effects.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
import json

ROOT=Path(__file__).resolve().parent
BRAND=ROOT/'brand'; BRAND.mkdir(exist_ok=True)
FONT=BRAND/'fonts'

def outline(char,weight=600):
    f=TTFont(FONT/f'Manrope-{weight}.ttf');g=f.getGlyphSet();name=f.getBestCmap()[ord(char)]
    pen=SVGPathPen(g);g[name].draw(pen)
    return pen.getCommands(),f['hmtx'][name][0],f['head'].unitsPerEm

q,_,_=outline('q')
mark=f'<rect width="1024" height="1024" rx="240" fill="#203B30"/><path d="{q}" transform="translate(270 716) scale(.3836 -.3836)" fill="#D8EEA6"/><circle cx="746" cy="224" r="61" fill="#D8EEA6"/>'
svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" role="img" aria-label="QualiFi q mark">{mark}</svg>'
(BRAND/'QualiFi-Mark.svg').write_text(svg,encoding='utf-8')
parts=[];x=400;size=260
for ch in 'QualiFi':
    path,advance,upem=outline(ch,700);scale=size/upem
    parts.append(f'<path d="{path}" transform="translate({x:.3f} 294) scale({scale:.6f} {-scale:.6f})" fill="#203B30"/>')
    x+=advance*scale
width=round(x+80)
word=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} 420" role="img" aria-label="QualiFi"><g transform="translate(12 50) scale(.3125)">{mark}</g>'+''.join(parts)+f'<circle cx="{x+18:.2f}" cy="278" r="15" fill="#91B85B"/></svg>'
(BRAND/'QualiFi-Wordmark.svg').write_text(word,encoding='utf-8')
(BRAND/'brand-identity-v2.md').write_text('''# QualiFi logo refinement v2

Existing brand source: marketing/instagram-6day-v1/brand-identity.md and the original q-and-dot mark. The user requested a logo refinement on 15 November 2026. This new version retains the q-and-dot identity; it does not replace unrelated Canva designs or the live website.

## Refinement

- Keep the forest rounded badge, pale lime q and detached dot.
- Use outlined Manrope 600 for a consistent q instead of a runtime-dependent Arial glyph.
- Give the descender balanced bottom clearance and the dot its own optical space.
- Build the wordmark from outlined Manrope 700 so the SVG has no external font dependency.
- Use flat colours only; no glows, gradients or shadows. The preliminary generated study is not the production master.

## Brand tokens

Forest #203B30; lime #D8EEA6; paper #F6F7F2; secondary text #637362; soft surface #EAF0DF; dividers #DCE3D4. Headings Manrope 600–700. Body DM Sans 400–500. On paper, all essential text is forest; lime is an accent, never small body text.

## Usage

QualiFi-Mark.svg is the scalable icon. QualiFi-Wordmark.svg is the horizontal lockup. The SVG glyphs are outlined. PNG exports are provided for Canva and office tools. Leave clear space of at least one detached-dot diameter. Minimum icon use 24 px, preferably 32 px. Do not distort, rotate, recolour, remove the dot, or add banking/partner logos.

## Investor deck

16:9 landscape; light paper background throughout, dark forest headings, restrained lime highlights, large whitespace. One takeaway per slide. Investor claims must distinguish observed state, intended product and unvalidated hypothesis. Team, financial forecasts and investment request remain blank at the user's instruction.
''',encoding='utf-8')
print('Outlined mark and wordmark ready',width)
