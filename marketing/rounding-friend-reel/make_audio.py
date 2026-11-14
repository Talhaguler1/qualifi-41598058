"""Generate fictional character dialogue locally, then mix original procedural SFX.
Run with: /path/to/tts-venv/bin/python make_audio.py
Models are cached outside the deliverable and are not redistributed.
"""
from pathlib import Path
import os,json,math,subprocess
os.environ.setdefault('OMP_NUM_THREADS','2')
os.environ.setdefault('ORT_DISABLE_TELEMETRY','1')
import numpy as np
import soundfile as sf
import onnxruntime as ort
from kokoro_onnx import Kokoro

ROOT=Path(__file__).resolve().parent;A=ROOT/'assets';A.mkdir(exist_ok=True)
MODEL=Path(os.environ.get('QUALIFI_TTS_MODELS',str(Path.home()/'.cache/qualifi-tts')))
SCRIPT=[
 {'id':'bill1','speaker':'friend','voice':'am_puck','speed':1.10,'text':'Owe you twenty-four sixty-two? I send twenty-four twenty-six.','caption':'Owe you $24.62? I send $24.26.'},
 {'id':'bill2','speaker':'friend','voice':'am_puck','speed':1.10,'text':'Seventy-eight? You get seventy-five.','caption':'Owe you $78? You get $75.'},
 {'id':'brag','speaker':'friend','voice':'am_puck','speed':1.12,'text':'Every week? I keep a hundred seventy-four dollars and seventy-two cents a year. Genius.','caption':'Every week? That’s $174.72 a year. Genius.'},
 {'id':'expert','speaker':'expert','voice':'bf_emma','speed':1.05,'text':'You still owe every cent. Got a friend like this? Meet QualiFi.','caption':'You still owe every cent. Got a friend like this? Meet QualiFi.'},
 {'id':'nudge','speaker':'agent','voice':'af_sarah','speed':1.10,'text':"Friendly nudge. This week, you're three dollars thirty-six short. Send the rest, please.",'caption':'Friendly nudge. This week, you’re $3.36 short. Send the rest, please.'},
 {'id':'outro','speaker':'expert','voice':'bf_emma','speed':1.06,'text':'Let your agent handle the details. Join the waiting list.','caption':'Let your agent handle the details. Join the waiting list.'},
]

def envelope(x,sr,rate=40):
 n=max(1,int(sr/rate));out=[]
 for i in range(0,len(x),n):out.append(float(np.sqrt(np.mean(x[i:i+n]**2))))
 top=max(np.percentile(out,92),.03)
 return [round(min(1,v/top),3) for v in out]

def main():
 model=Kokoro(str(MODEL/'kokoro-v1.0.int8.onnx'),str(MODEL/'voices-v1.0.bin'))
 # Keep inference small and predictable on the shared CPU.
 available=model.get_voices();print('Required voices available',all(s['voice'] in available for s in SCRIPT),flush=True)
 pieces=[];cursor=.32;sr=24000
 gaps=[.35,.36,.20,.35,.36,1.75]
 for i,item in enumerate(SCRIPT):
  target=A/(item['id']+'.wav')
  if target.exists():audio,sr=sf.read(target,dtype='float32')
  else:
   audio,sr=model.create(item['text'],voice=item['voice'],speed=item['speed'],lang='en-gb' if item['speaker']=='expert' else 'en-us',sentence_pause=.13,clause_pause=.07)
   # Clean edges and normalize each actor to comparable perceived level.
   audio=np.asarray(audio,dtype=np.float32);peak=max(float(np.max(np.abs(audio))),.01)
   audio=audio*(.78/peak);fade=min(200,len(audio)//4);audio[:fade]*=np.linspace(0,1,fade);audio[-fade:]*=np.linspace(1,0,fade)
   sf.write(target,audio,sr,subtype='PCM_16')
  duration=len(audio)/sr
  item={**item,'start':round(cursor,3),'end':round(cursor+duration,3),'duration':round(duration,3),'amplitude':envelope(audio,sr)}
  pieces.append((item,audio));cursor+=duration+gaps[i]
  print(item['id'],round(duration,2),'at',item['start'],flush=True)
 total=math.ceil(cursor*30)/30
 mix=np.zeros(int(total*sr),dtype=np.float64);voice=np.zeros_like(mix)
 for item,audio in pieces:
  begin=round(item['start']*sr);voice[begin:begin+len(audio)]+=audio
 mix+=voice
 # A restrained, original plucked pulse under the skit. No stock music or borrowed recordings.
 beat=.5
 for n in range(int(total/beat)):
  at=n*beat;freq=[110,164.81,146.83,130.81][(n//2)%4]
  length=.23;t=np.arange(int(sr*length))/sr
  pluck=(np.sin(2*np.pi*freq*t)+.25*np.sin(4*np.pi*freq*t))*np.exp(-t*21)*.021
  begin=round(at*sr);end=min(len(mix),begin+len(pluck));mix[begin:end]+=pluck[:end-begin]
 rng=np.random.default_rng(62)
 def add_sfx(at,kind):
  if kind=='coin':
   t=np.arange(int(sr*.23))/sr;v=(np.sin(2*np.pi*1200*t)+.5*np.sin(2*np.pi*1800*t))*np.exp(-t*24)*.10
  elif kind=='interrupt':
   t=np.arange(int(sr*.35))/sr;v=np.sin(2*np.pi*(330*t+600*t*t))*(rng.random(len(t))*.8+.2)*np.exp(-t*11)*.12
  elif kind=='pop':
   t=np.arange(int(sr*.12))/sr;v=(rng.normal(0,.6,len(t))+np.sin(2*np.pi*180*t))*np.exp(-t*50)*.20
  else:
   t=np.arange(int(sr*.36))/sr;v=(np.sin(2*np.pi*660*t)+.35*np.sin(2*np.pi*990*t))*np.exp(-t*12)*.075
  begin=round(at*sr);end=min(len(mix),begin+len(v));mix[begin:end]+=v[:end-begin]
 lookup={p[0]['id']:p[0] for p in pieces}
 for cue in ['bill1','bill2']:add_sfx(lookup[cue]['end']-.15,'coin')
 add_sfx(lookup['expert']['start']-.12,'interrupt')
 smack=lookup['nudge']['start']+.16;add_sfx(smack,'pop');add_sfx(lookup['nudge']['start']+1.05,'ding')
 add_sfx(lookup['outro']['start']+.1,'ding')
 fade=int(.35*sr);mix[-fade:]*=np.linspace(1,0,fade)
 sf.write(A/'mix-raw.wav',np.clip(mix,-.98,.98),sr,subtype='PCM_16')
 sf.write(A/'dialogue-only.wav',voice,sr,subtype='PCM_16')
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(A/'mix-raw.wav'),'-af','loudnorm=I=-16:TP=-1.0:LRA=7','-ar','48000',str(A/'soundtrack.wav')],check=True)
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(A/'soundtrack.wav'),'-codec:a','libmp3lame','-b:a','160k',str(A/'soundtrack.mp3')],check=True)
 meta={'duration':round(total,3),'fps':30,'width':1080,'height':1920,'math':{'bill1_due_cents':2462,'bill1_paid_cents':2426,'bill2_due_cents':7800,'bill2_paid_cents':7500,'weekly_gap_cents':336,'weeks':52,'annual_gap_cents':17472},'cues':[p[0] for p in pieces],'sfx':{'cartoon_nudge':round(smack,3)},'audio_note':'Synthetic English characters. Original procedural music/SFX. No real-person imitation.'}
 (ROOT/'timeline.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2))
 print('TOTAL',total,flush=True)

if __name__=='__main__':main()
