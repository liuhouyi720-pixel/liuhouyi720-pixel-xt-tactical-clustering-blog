// PLAYWRIGHT_MODULE can point to a preinstalled Playwright package.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/assets/xt-interactive.json')));
  const url = process.env.TEST_URL || 'http://127.0.0.1:3012/#threat-explorer';
  const output = path.join(__dirname, '../.local-checks');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto(url);
    await page.locator('[data-zone="110"]').waitFor();
    assert.equal(await page.locator('[data-zone]').count(), 192);
    // Independently derive the five-action horizon from counts and exported T.
    let five = Array(192).fill(0);
    for (let action = 0; action < 5; action++) {
      five = data.zones.map((z, i) => (z.goals + z.moves * data.transitions[i].reduce((sum, p, j) => sum + p * five[j], 0)) / (z.shots + z.moves));
    }
    for (const z of data.zones) assert.ok(Math.abs(five[z.id] - z.xtFiveActions) < 1e-9);
    assert.equal(await page.getByRole('button', { name: 'xT values', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.equal(await page.getByLabel('xT comparison', { exact: true }).inputValue(), 'research');
    await page.getByText('ATTACKING DIRECTION', { exact: true }).waitFor();
    await page.getByText('OWN GOAL', { exact: true }).waitFor();
    await page.getByText('OPPONENT GOAL', { exact: true }).waitFor();
    let researchColors;
    for (const horizon of ['research', 'five']) {
      await page.getByLabel('xT comparison', { exact: true }).selectOption(horizon);
      const key = horizon === 'research' ? 'xt' : 'xtFiveActions';
      const cells = await page.locator('[data-zone]').evaluateAll(nodes => nodes.map(n => ({id: +n.dataset.zone, xt: +n.dataset.xt, color: n.style.backgroundColor})));
      for (const c of cells) assert.equal(c.xt, data.zones[c.id][key]);
      if (horizon === 'research') researchColors = cells.map(c => c.color);
      else assert.notDeepEqual(cells.map(c => c.color), researchColors);
      // Darker colors must correspond to higher xT, including the defensive half.
      const luminance = c => c.color.match(/\d+/g).map(Number).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
      const ordered = cells.toSorted((a,b) => a.xt-b.xt);
      for (let i=1; i<ordered.length; i++) assert.ok(luminance(ordered[i]) <= luminance(ordered[i-1]) + 0.001);
      for (const zone of data.zones) {
        await page.getByLabel('Starting zone', { exact: true }).selectOption(String(zone.id));
        assert.equal(await page.getByTestId('xt-value').innerText(), zone[key].toFixed(4));
      }
      const beforeHover = await page.locator('[data-zone="0"]').evaluate(n => n.style.backgroundColor);
      await page.locator('[data-zone="110"]').hover();
      assert.equal(await page.locator('[data-zone="0"]').evaluate(n => n.style.backgroundColor), beforeHover, 'xT map must not change with origin');
      await page.locator('#threat-explorer').screenshot({ path: path.join(output, `xt-${horizon}-desktop.png`) });
    }
    const deep = data.zones.filter(z => z.x < 5);
    assert.ok(deep.reduce((s,z) => s+z.xtFiveActions,0)/deep.length < 0.001);
    await page.getByLabel('xT comparison', { exact: true }).selectOption('research');
    await page.getByRole('button', { name: 'Move destinations', exact: true }).click();
    // Every source row must reach the DOM without transposition or reversal.
    for (let origin = 0; origin < 192; origin++) {
      await page.getByLabel('Starting zone', { exact: true }).selectOption(String(origin));
      await page.waitForFunction(id => document.querySelector(`[data-zone="${id}"]`)?.getAttribute('data-origin') === 'true', origin);
      const values = await page.locator('[data-zone]').evaluateAll(cells =>
        cells.map(c => [Number(c.dataset.zone), Number(c.dataset.probability)]));
      for (const [id, p] of values) assert.equal(p, data.transitions[origin][id]);
      assert.equal(await page.getByTestId('xt-value').innerText(), data.zones[origin].xt.toFixed(4));
      const g = data.zones[origin].shotConversion;
      assert.equal(await page.getByTestId('xg-value').innerText(), g === null ? 'No shot sample' : `${(g * 100).toFixed(2)}%`);
    }
    await page.getByRole('button', { name: 'Unpin start', exact: true }).click();
    await page.locator('[data-zone="104"]').hover();
    assert.equal(await page.getByTestId('origin-label').innerText(), '(8, 6)');
    const oldColor = await page.locator('[data-zone="104"]').evaluate(el => el.style.backgroundColor);
    await page.locator('[data-zone="110"]').hover();
    assert.equal(await page.getByTestId('origin-label').innerText(), '(14, 6)');
    assert.notEqual(await page.locator('[data-zone="104"]').evaluate(el => el.style.backgroundColor), oldColor);
    await page.locator('[data-zone="110"]').click();
    await page.locator('[data-zone="111"]').hover();
    assert.equal(await page.getByTestId('origin-label').innerText(), '(14, 6)');
    assert.match(await page.getByRole('status').innerText(), /From \(14, 6\) to \(15, 6\)/);
    assert.match(await page.getByRole('status').innerText(), new RegExp((data.transitions[110][111] * 100).toFixed(2).replace('.', '\\.')));
    await page.locator('[data-zone="110"]').focus();
    await page.keyboard.press('Escape');
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.getByTestId('origin-label').innerText(), '(13, 6)');
    await page.keyboard.press('ArrowUp');
    assert.equal(await page.getByTestId('origin-label').innerText(), '(13, 7)');
    const lower = await page.locator('[data-zone="0"]').boundingBox();
    const upper = await page.locator('[data-zone="176"]').boundingBox();
    assert.ok(lower.y > upper.y, 'y=0 must be at the bottom');
    await page.getByLabel('Starting zone', { exact: true }).selectOption('110');
    await page.locator('#threat-explorer').screenshot({ path: path.join(output, 'xt-explorer-desktop.png') });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    mobile.on('pageerror', err => errors.push(err.message));
    await mobile.goto(url);
    await mobile.locator('[data-zone="110"]').waitFor();
    await mobile.getByLabel('xT comparison', { exact: true }).selectOption('five');
    await mobile.locator('[data-zone="0"]').tap();
    assert.equal(await mobile.getByTestId('xt-value').innerText(), data.zones[0].xtFiveActions.toFixed(4));
    await mobile.locator('#threat-explorer').screenshot({ path: path.join(output, 'xt-five-mobile.png') });
    await mobile.getByRole('button', { name: 'Move destinations', exact: true }).click();
    await mobile.locator('[data-zone="136"]').tap();
    assert.equal(await mobile.getByTestId('origin-label').innerText(), '(8, 8)');
    await mobile.locator('[data-zone="137"]').tap();
    assert.equal(await mobile.getByTestId('origin-label').innerText(), '(8, 8)');
    assert.match(await mobile.getByRole('status').innerText(), /to \(9, 8\)/);
    assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await mobile.locator('#threat-explorer').screenshot({ path: path.join(output, 'xt-explorer-mobile.png') });

    const recovery = await browser.newPage();
    await recovery.route('**/assets/xt-interactive.json', route => route.fulfill({ status: 503, body: 'unavailable' }));
    await recovery.goto(url);
    await recovery.getByText('The movement map could not load.').waitFor();
    await recovery.unroute('**/assets/xt-interactive.json');
    await recovery.getByRole('button', { name: 'Try again' }).click();
    await recovery.locator('[data-zone="110"]').waitFor();
    assert.deepEqual(errors, []);
    console.log('PASS: independently derived five-action values, all xT values and monotonic colors in both horizons, fixed xT map, attack labels; all 36,864 probabilities and all 192 xT/xG sidebar values; hover color changes; pin/destination inspection; keyboard orientation; mobile taps; no horizontal overflow; load-error retry; no browser errors.');
    console.log('Screenshots:', output);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
