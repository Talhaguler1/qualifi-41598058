from pathlib import Path
import json,base64,io
import fitz
from PIL import Image
R=Path(__file__).resolve().parent
doc=fitz.open(R/'QualiFi-Gorusme-Bulgulari-Sunum-v2.pdf');manifest=json.loads((R/'deck-manifest.json').read_text())
masks={
2:[[100,555+i*118,1720,115,i+1] for i in range(3)],
3:[[110+i*342,510,330,320,max(1,i)] for i in range(5)],
4:[[110,480+i*108,1000,105,i+1] for i in range(4)]+[[1150,480,660,420,4]],
5:[[780,480+i*150,1020,145,i+1] for i in range(3)],
6:[[110+i*890,500,790,410,i+1] for i in range(2)],
7:[[110,555+i*100,1700,99,i+1] for i in range(3)],
8:[[110+i*580,500,545,400,i+1] for i in range(3)],
9:[[110,565+i*105,1700,105,i+1] for i in range(3)],
10:[[110+i*428,500,410,430,i+1] for i in range(4)],
12:[[780,445+i*77,1030,78,[1,2,2,3,4][i]] for i in range(5)]}
slides=[]
for i,page in enumerate(doc):
 if i==12:
  im=Image.open(R/'current-09.png').convert('RGB');buff=io.BytesIO();im.save(buff,format='PNG');raw=buff.getvalue()
 else:raw=page.get_pixmap(matrix=fitz.Matrix(.75,.75)).tobytes('png')
 slides.append(dict(image='data:image/png;base64,'+base64.b64encode(raw).decode(),title=manifest['pages'][i]['section'],notes=manifest['pages'][i]['notes'],masks=masks.get(i+1,[])))
html='''<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>QualiFi · Tıklamalı Prova</title><style>
*{box-sizing:border-box}body{margin:0;background:#203b30;color:#f6f7f2;font:16px Arial,sans-serif}nav{height:58px;display:flex;gap:14px;align-items:center;padding:10px 20px}button,select{font:inherit;border:1px solid #637362;border-radius:8px;padding:7px 12px;background:#f6f7f2;color:#203b30;cursor:pointer}main{height:calc(100vh - 58px);display:flex;align-items:center;justify-content:center;overflow:hidden}#frame{position:relative;background:#f6f7f2}#stage{width:1920px;height:1080px;position:absolute;transform-origin:top left}#stage img{width:1920px;height:1080px}.cover{position:absolute;background:#f6f7f2;pointer-events:none;transition:opacity .22s ease}.cover.shown{opacity:0}aside{position:fixed;right:20px;bottom:20px;width:min(580px,90vw);max-height:60vh;overflow:auto;background:#f6f7f2;color:#203b30;padding:24px;border:1px solid #dce3d4;border-radius:12px;white-space:pre-wrap;line-height:1.6;box-shadow:0 4px 32px #0005;display:none}#counter{margin-left:auto}small{opacity:.8}@media(prefers-reduced-motion:reduce){.cover{transition:none}}</style>
<nav><strong>QualiFi · Prova</strong><select id="jump" aria-label="Sayfa seç"></select><button id="prev" aria-label="Önceki adım">←</button><button id="next" aria-label="Sonraki adım">İlerle →</button><button id="notes">Notlar (N)</button><button id="full">Tam ekran (F)</button><span id="counter"></span></nav><main><div id="frame"><div id="stage"></div></div></main><aside id="speech"></aside><script>const slides=REPLACE_DATA;let page=0,step=0;const stage=document.querySelector('#stage'),frame=document.querySelector('#frame'),jump=document.querySelector('#jump'),speech=document.querySelector('#speech');slides.forEach((s,i)=>{const o=document.createElement('option');o.value=i;o.textContent=s.title;jump.append(o)});function max(){return Math.max(0,...slides[page].masks.map(m=>m[4]))}function resize(){const k=Math.min((innerWidth-24)/1920,(innerHeight-82)/1080);frame.style.width=(1920*k)+'px';frame.style.height=(1080*k)+'px';stage.style.transform='scale('+k+')'}function draw(){stage.replaceChildren();const im=document.createElement('img');im.src=slides[page].image;im.alt=slides[page].title;stage.append(im);for(const m of slides[page].masks){const e=document.createElement('div');e.className='cover'+(step>=m[4]?' shown':'');Object.assign(e.style,{left:m[0]+'px',top:m[1]+'px',width:m[2]+'px',height:m[3]+'px'});stage.append(e)}jump.value=page;speech.textContent=slides[page].notes;document.querySelector('#counter').textContent=(page+1)+'/13 · adım '+step+'/'+max();resize()}function forward(){if(step<max()){step++;document.querySelectorAll('.cover').forEach((e,i)=>e.classList.toggle('shown',step>=slides[page].masks[i][4]));document.querySelector('#counter').textContent=(page+1)+'/13 · adım '+step+'/'+max()}else if(page<12){page++;step=0;draw()}}function back(){if(step>0){step--;draw()}else if(page>0){page--;step=max();draw()}}function note(){speech.style.display=speech.style.display==='block'?'none':'block'}function full(){if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen()}document.querySelector('#next').onclick=forward;document.querySelector('#prev').onclick=back;document.querySelector('#notes').onclick=note;document.querySelector('#full').onclick=full;jump.onchange=()=>{page=Number(jump.value);step=0;draw()};addEventListener('resize',resize);addEventListener('keydown',e=>{if(e.target.tagName==='SELECT')return;if(['ArrowRight',' ','PageDown'].includes(e.key)){e.preventDefault();forward()}if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();back()}if(e.key.toLowerCase()==='n')note();if(e.key.toLowerCase()==='f')full()});draw();</script></html>'''
html=html.replace('REPLACE_DATA',json.dumps(slides,ensure_ascii=False).replace('</','<\\/'))
(R/'QualiFi-Tiklamali-Prova.html').write_text(html)
print('Built standalone rehearsal with click-by-click reveals, notes and original founder slide.')
