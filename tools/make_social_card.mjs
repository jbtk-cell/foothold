/**
 * Render the social preview image.
 *
 * Every link to Foothold posted anywhere renders with this picture. Without
 * it a link is a bare blue line of text, which costs clicks for no reason.
 *
 *   node tools/make_social_card.mjs
 *
 * Writes web/assets/social.png at 1200x630, the size Open Graph and Twitter
 * both expect. Regenerate it when the brand or the lesson count changes.
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const manifest = JSON.parse(readFileSync(resolve(root, 'web/content/manifest.json'), 'utf8'));
const lessons = manifest.modules.reduce((sum, m) => sum + m.lessons.length, 0);

// The card shows the product's actual subject: a program mid-execution, with
// the line marker and a variable caught changing.
const html = `<!doctype html><meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; }
  body {
    width: 1200px; height: 630px; display: flex; flex-direction: column;
    justify-content: space-between; padding: 64px 68px;
    background: #101a26; color: #e6ecf1;
    font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  .top { display: flex; align-items: center; gap: 14px; }
  .mark { color: #ff5c39; }
  .word {
    font-family: "Bahnschrift", "Avenir Next Condensed", "Roboto Condensed", Arial, sans-serif;
    font-size: 30px; letter-spacing: .14em; text-transform: uppercase; font-weight: 600;
  }
  h1 {
    font-family: "Bahnschrift", "Avenir Next Condensed", "Roboto Condensed", Arial, sans-serif;
    font-size: 92px; line-height: .96; letter-spacing: -.02em; margin: 26px 0 18px;
  }
  p { font-size: 27px; color: #90a3b4; max-width: 21ch; line-height: 1.42; }
  .body { display: flex; gap: 54px; align-items: center; }
  .left { flex: 1; }
  .demo {
    width: 470px; flex: none; border: 1px solid #263543; border-radius: 12px;
    background: #0b131d; overflow: hidden;
  }
  .demo-head {
    padding: 10px 15px; border-bottom: 1px solid #263543; background: #17232f;
    font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 13px; color: #61758a;
    display: flex; align-items: center; gap: 10px;
  }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: #46c8e0; }
  pre {
    margin: 0; padding: 14px 0; font-family: ui-monospace, Menlo, Consolas, monospace;
    font-size: 16px; line-height: 2;
  }
  .l { padding: 0 15px; display: flex; gap: 14px; border-left: 3px solid transparent; }
  .l.on { background: rgba(70,200,224,.13); border-left-color: #46c8e0; }
  .n { color: #61758a; width: 12px; }
  .k { color: #ff8f6b; } .s { color: #9ed7a4; } .b { color: #7fc3e8; } .num { color: #d8c06a; }
  .vars {
    border-top: 1px solid #263543; padding: 12px 15px;
    font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 15px;
  }
  .vrow { display: flex; justify-content: space-between; padding: 3px 0; }
  .vrow.hit { background: rgba(70,200,224,.13); margin: 0 -15px; padding: 3px 15px; }
  .vname { color: #90a3b4; } .vname.hit { color: #46c8e0; } .vval { color: #9ed7a4; }
  .was { color: #61758a; text-decoration: line-through; font-size: 13px; margin-left: 10px; }
  .foot {
    display: flex; justify-content: space-between; align-items: center;
    font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 20px; color: #61758a;
    border-top: 1px solid #263543; padding-top: 22px;
  }
  .foot b { color: #ff5c39; font-weight: 400; }
</style>
<div class="top"><span class="mark">
<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.7"
     stroke-linecap="round" stroke-linejoin="round">
  <path d="M2 21 L9 6 L13 13 L16 9 L22 21 Z"/><circle cx="9" cy="6" r="1.9" fill="currentColor" stroke="none"/>
</svg></span><span class="word">Foothold</span></div>

<div class="body">
  <div class="left">
    <h1>Watch your<br>code run.</h1>
    <p>A free Python course with a step-through debugger in every exercise.</p>
  </div>

  <div class="demo">
    <div class="demo-head"><span class="dot"></span>python 3.14, in your browser</div>
    <pre><div class="l"><span class="n">1</span><span><span class="b">basket</span> = [<span class="s">"apple"</span>, <span class="s">"pear"</span>]</span></div><div class="l"><span class="n">2</span><span>total = <span class="num">0</span></span></div><div class="l on"><span class="n">3</span><span><span class="k">for</span> fruit <span class="k">in</span> basket:</span></div><div class="l"><span class="n">4</span><span>    total = total + <span class="b">len</span>(fruit)</span></div></pre>
    <div class="vars">
      <div class="vrow"><span class="vname">basket</span><span class="vval">['apple', 'pear']</span></div>
      <div class="vrow hit"><span class="vname hit">total</span><span class="vval">5<span class="was">0</span></span></div>
      <div class="vrow"><span class="vname">fruit</span><span class="vval">'apple'</span></div>
    </div>
  </div>
</div>

<div class="foot">
  <span><b>${lessons} lessons.</b> No account, no install, works offline.</span>
  <span>jbtk-cell.github.io/foothold</span>
</div>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'networkidle' });
const out = resolve(root, 'web/assets/social.png');
await page.screenshot({ path: out });
await browser.close();
console.log(`Wrote ${out} (1200x630, ${lessons} lessons)`);
