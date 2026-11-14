from pathlib import Path
import base64,json
R=Path(__file__).resolve().parent
def b64(path):return base64.b64encode((R/path).read_bytes()).decode()
def build():
 s=(R/'template.html').read_text(encoding='utf-8')
 for key,path in [('__MANROPE__','assets/Manrope-600.ttf'),('__MANROPE_BOLD__','assets/Manrope-700.ttf'),('__DM__','assets/DM-Sans-500.ttf'),('__DM_BOLD__','assets/DM-Sans-700.ttf'),('__AUDIO__','assets/soundtrack.mp3')]:s=s.replace(key,b64(path))
 s=s.replace('__LOGO__','data:image/svg+xml;base64,'+b64('assets/qualifi-mark.svg'))
 s=s.replace('__TIMELINE__',json.dumps(json.loads((R/'timeline.json').read_text(encoding='utf-8')),ensure_ascii=False,separators=(',',':')))
 (R/'QualiFi-The-Round-Down-Friend.html').write_text(s, encoding='utf-8')
 print('Standalone HTML ready',len(s),'bytes')
if __name__=='__main__':build()
