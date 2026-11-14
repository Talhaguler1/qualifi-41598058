"""Render the standalone HTML to a narrated, H.264 Instagram Reel.

Requires Python playwright, Chromium and ffmpeg on PATH. No browser download
is needed if Chromium is already installed. Run `python render.py`.
"""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import json, math, os, shutil, subprocess, threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
NAME = 'QualiFi-The-Round-Down-Friend'

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass

def srt_time(t):
    ms = round(t * 1000)
    return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'

def main():
    data = json.loads((ROOT / 'timeline.json').read_text(encoding='utf-8'))
    fps = data['fps']; duration = data['duration']
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    ff = None
    try:
        with sync_playwright() as p:
            chromium = os.environ.get('QUALIFI_CHROMIUM') or shutil.which('chromium') or shutil.which('chromium-browser')
            opts = {'headless': True, 'args': ['--disable-dev-shm-usage']}
            if chromium: opts['executable_path'] = chromium
            if hasattr(os, 'geteuid') and os.geteuid() == 0: opts['args'].append('--no-sandbox')
            browser = p.chromium.launch(**opts)
            page = browser.new_page(viewport={'width': data['width'], 'height': data['height']}, device_scale_factor=1)
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.goto(f'http://127.0.0.1:{server.server_port}/{NAME}.html?render=1')
            page.evaluate('document.fonts.ready')
            captions = page.evaluate('window.captionChunks')
            (ROOT / f'{NAME}.srt').write_text('\n\n'.join(f'{i+1}\n{srt_time(c["start"])} --> {srt_time(c["end"])}\n{c["text"]}' for i,c in enumerate(captions)) + '\n')
            cmd = ['ffmpeg', '-hide_banner', '-loglevel', 'warning', '-y', '-f', 'image2pipe', '-vcodec', 'png', '-framerate', str(fps), '-i', 'pipe:0', '-i', str(ROOT/'assets/soundtrack.wav'), '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-threads', '2', '-pix_fmt', 'yuv420p', '-r', str(fps), '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-t', str(duration), '-movflags', '+faststart', str(ROOT/f'{NAME}.mp4')]
            with (ROOT/'qa/render.log').open('w') as log:
                ff = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=log)
                count = math.ceil(duration * fps)
                for i in range(count):
                    page.evaluate('(t)=>window.renderAt(t)', i/fps)
                    ff.stdin.write(page.screenshot(type='png', animations='allow'))
                    if i % 120 == 0: print(f'Rendered {i}/{count} frames', flush=True)
                ff.stdin.close()
                if ff.wait() != 0: raise RuntimeError('FFmpeg failed; see qa/render.log')
            if errors: raise RuntimeError(errors)
            page.evaluate('(t)=>window.renderAt(t)', 22.0)
            page.screenshot(path=str(ROOT/'QualiFi-Reel-Cover.png'))
            browser.close()
            print(f'Complete: {count} frames, {duration}s, {NAME}.mp4', flush=True)
    finally:
        server.shutdown()
        if ff is not None and ff.poll() is None:
            ff.kill(); ff.wait()

if __name__ == '__main__': main()
