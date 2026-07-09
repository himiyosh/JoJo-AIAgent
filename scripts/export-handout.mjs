// 配布用ハンドアウト PDF エクスポータ
// -------------------------------------------------------------
// このデッキの「隠れているコンテンツ」は RevealTabs.vue のクリック式タブ
// （Vue 内部 state。Slidev の $clicks ではない）に入っているため、
// 標準の `slidev export` では初期状態しか出力できない。
// そこで本スクリプトは、本番ビルドをヘッドレス Chromium で1枚ずつ巡回し、
// 各スライドのタブ／ページ送りの「全状態」を1ページずつ収録した
// 配布用 PDF（handout.pdf）を生成する。ライブのデッキは一切変更しない。
//
// 使い方:  npm run export:handout
// 出力  :  ./handout.pdf   （.gitignore 済みのビルド生成物）
//
// 依存は既存の @slidev/cli / playwright-chromium のみ（新規依存なし）。
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from '@slidev/parser';
import pw from 'playwright-chromium';

const { chromium } = pw;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_REL = '.handout-tmp';                       // 一時ビルド出力（相対）
const OUT_DIR = path.join(ROOT, OUT_REL);             // 同・絶対
const SHOT_DIR = path.join(os.tmpdir(), `handout-shots-${process.pid}`);
const PDF_OUT = path.join(ROOT, 'handout.pdf');
const VW = 1280, VH = 720, SCALE = 2;                 // 16:9・Retina 相当
const JPEG_QUALITY = 90;                              // 配布サイズを抑えるため JPEG で埋め込む

const log = (...a) => console.log('[handout]', ...a);

function run(cmd, args) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: 'inherit', cwd: ROOT });
    p.on('exit', (code) => (code === 0 ? res() : rej(new Error(`${cmd} exited ${code}`))));
    p.on('error', rej);
  });
}

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject', '.map': 'application/json',
};

function startServer(dir) {
  const server = http.createServer((req, res) => {
    try {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      const fp = path.join(dir, urlPath);
      if (!fp.startsWith(dir)) { res.writeHead(403); return res.end(); }
      if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
        res.writeHead(200, { 'content-type': MIME[path.extname(fp)] || 'application/octet-stream' });
        return fs.createReadStream(fp).pipe(res);
      }
      // SPA (history) フォールバック
      res.writeHead(200, { 'content-type': 'text/html' });
      return fs.createReadStream(path.join(dir, 'index.html')).pipe(res);
    } catch (e) {
      res.writeHead(500); res.end(String(e));
    }
  });
  return new Promise((resolve) => server.listen(0, () => resolve({ server, port: server.address().port })));
}

async function main() {
  // 1) 本番ビルド（base=/ でルート配信できるようにする）
  log('building deck …');
  const slidevBin = path.join(ROOT, 'node_modules', '.bin', 'slidev');
  await run(slidevBin, ['build', '--base', '/', '--out', OUT_REL]);

  // 2) SPA フォールバック付き静的サーバ
  const { server, port } = await startServer(OUT_DIR);
  const BASE = `http://localhost:${port}`;
  log('serving build on', BASE);

  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: SCALE });

  const settle = async () => {
    await page.waitForTimeout(650);
    await page.evaluate(() => (document.fonts ? document.fonts.ready : null)).catch(() => {});
  };
  const shots = [];
  const shoot = async (name) => {
    const f = path.join(SHOT_DIR, `${name}.jpg`);
    await page.screenshot({ path: f, type: 'jpeg', quality: JPEG_QUALITY, clip: { x: 0, y: 0, width: VW, height: VH } });
    shots.push(f);
  };

  // 総スライド数は Slidev 自身のパーサで取得（本番ビルドには __slidev__ が無いため）
  const parsed = await parse(fs.readFileSync(path.join(ROOT, 'slides.md'), 'utf8'), path.join(ROOT, 'slides.md'));
  const total = parsed.slides.length;
  if (!total) throw new Error('slides.md からスライドを検出できませんでした');
  await page.goto(`${BASE}/1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  log('total slides =', total);

  // 3) 巡回キャプチャ（可視スライドにスコープしてタブ状態を全収録）
  for (let i = 1; i <= total; i++) {
    await page.goto(`${BASE}/${i}`, { waitUntil: 'networkidle' }).catch(() => {});
    await settle();
    const num = String(i).padStart(2, '0');
    const scope = `.slidev-page-${i} .rt`;                 // 隣接スライドのブリードを除外
    const tabCount = await page.locator(`${scope} .rt__tab`).count();

    if (tabCount === 0) { await shoot(num); continue; }

    for (let t = 0; t < tabCount; t++) {
      await page.locator(`${scope} .rt__tab`).nth(t).click();
      await page.waitForTimeout(450);
      const pages = await page.locator(`${scope} .rt__pager button`).count();
      if (pages <= 1) {
        await settle();
        await shoot(`${num}-t${t + 1}`);
      } else {
        for (let pg = 0; pg < pages; pg++) {
          await page.locator(`${scope} .rt__pager button`).nth(pg).click();
          await settle();
          await shoot(`${num}-t${t + 1}-p${pg + 1}`);
        }
      }
    }
    log(`slide ${num}: ${tabCount} tab state(s) captured`);
  }

  // 4) PNG 群を1ページ1枚のフルブリード PDF に合成
  const imgs = shots.map((f) => `<img src="${pathToFileURL(f).href}">`).join('');
  const html = `<!doctype html><meta charset="utf-8"><style>
    @page { size: ${VW}px ${VH}px; margin: 0; }
    html,body{margin:0;padding:0;background:#000;font-size:0;}
    img{width:${VW}px;height:${VH}px;display:block;break-after:page;}
    img:last-child{break-after:auto;}
  </style>${imgs}`;
  const htmlPath = path.join(SHOT_DIR, 'handout.html');
  fs.writeFileSync(htmlPath, html);
  const pdfPage = await browser.newPage();
  await pdfPage.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });
  await pdfPage.pdf({
    path: PDF_OUT, width: `${VW}px`, height: `${VH}px`,
    printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  // 5) 後片付け
  await browser.close();
  await new Promise((r) => server.close(r));
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.rmSync(SHOT_DIR, { recursive: true, force: true });
  log(`done → ${PDF_OUT}  (${shots.length} pages)`);
}

main().catch((e) => { console.error('[handout] FAILED:', e); process.exit(1); });
