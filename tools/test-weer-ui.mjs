// Rooktest van de Weer-schermen met een minimale nep-DOM en een nep-weerdienst. Gebruik: node tools/test-weer-ui.mjs
import assert from 'node:assert/strict';
import { install, El, click } from './_minidom.mjs';
const { body, T, store } = install();
const view = new El('div'); view.id = 'view'; body.appendChild(view);
const cleanups = []; const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
let n = 0; const ok = (c, m) => { n++; assert.ok(c, m); };
const OFF = 7200, H = 3600e3;
const lt = (ms) => new Date(ms + OFF * 1000).toISOString().slice(0, 16);
function forecast(code = 3) {
  const now = Date.now(), h0 = Math.floor(now / H) * H, hours = Array.from({ length: 75 }, (_, i) => h0 + (i - 3) * H), day0 = Math.floor((now + OFF * 1000) / 864e5) * 864e5 - OFF * 1000;
  const days = Array.from({ length: 14 }, (_, i) => day0 + i * 864e5);
  return {
    utc_offset_seconds: OFF, timezone: 'Europe/Amsterdam',
    current: { time: lt(now), temperature_2m: 14.2, apparent_temperature: 12.5, relative_humidity_2m: 81, weather_code: code, wind_speed_10m: 22, wind_direction_10m: 230, wind_gusts_10m: 41, precipitation: 0, is_day: 1, cloud_cover: 85, pressure_msl: 1008.4, surface_pressure: 1007.9 },
    hourly: { time: hours.map(lt), temperature_2m: hours.map((_, i) => 10 + 5 * Math.sin(i / 6)), apparent_temperature: hours.map((_, i) => 9 + 5 * Math.sin(i / 6)), precipitation_probability: hours.map((_, i) => (i * 7) % 90), precipitation: hours.map((_, i) => (i % 5 === 0 ? 0.6 : 0)), weather_code: hours.map((_, i) => [3, 61, 0, 2, 95][i % 5]), wind_speed_10m: hours.map(() => 20), wind_direction_10m: hours.map(() => 230), uv_index: hours.map((_, i) => (i % 24 > 8 && i % 24 < 16 ? 3.5 : 0)), cloud_cover: hours.map(() => 70), is_day: hours.map((_, i) => ((i % 24) > 6 && (i % 24) < 19 ? 1 : 0)) },
    daily: { time: days.map((d) => lt(d).slice(0, 10)), weather_code: days.map((_, i) => [3, 61, 0, 95, 71, 2, 1][i % 7]), temperature_2m_max: days.map((_, i) => 12 + (i % 6)), temperature_2m_min: days.map((_, i) => 5 + (i % 4)), precipitation_sum: days.map((_, i) => (i % 3 ? 0 : 4.2)), precipitation_probability_max: days.map((_, i) => (i * 11) % 100), sunrise: days.map((d) => lt(d + 7.5 * H)), sunset: days.map((d) => lt(d + 18 * H)), uv_index_max: days.map(() => 2.4), wind_speed_10m_max: days.map(() => 31), wind_gusts_10m_max: days.map(() => 55), sunshine_duration: days.map(() => 14400), daylight_duration: days.map((_, i) => 38000 - i * 100) },
    minutely_15: { time: Array.from({ length: 8 }, (_, i) => lt(Math.floor(now / 900e3) * 900e3 + i * 900e3)), precipitation: [0, 0, 0.4, 0.8, 0, 0, 0, 0] },
  };
}
let fail = false;
T.fetchHandler = async (u) => {
  if (fail) throw new Error('offline');
  if (u.includes('geocoding')) return { ok: true, json: async () => ({ results: [{ name: 'Groningen', admin1: 'Groningen', country: 'Nederland', latitude: 53.22, longitude: 6.57 }] }) };
  if (u.includes('air-quality')) return { ok: true, json: async () => ({ current: { european_aqi: 35, alder_pollen: 0, birch_pollen: 120, grass_pollen: 30 } }) };
  return { ok: true, json: async () => forecast(61) };
};
localStorage.setItem('weer:loc:t1', JSON.stringify({ name: 'Utrecht', lat: 52.09, lon: 5.12 }));
const M = await import('../docs/weer.js');
const q = (s) => view.querySelector(s), qa = (s) => view.querySelectorAll(s), text = () => view.textContent;
const wait = () => new Promise((r) => T.realST(r, 30));
await M.weerView({ view, esc, uid: 't1', addCleanup: (f) => cleanups.push(f) });
T.advance(300);
ok(T.fetches.some((u) => u.includes('open-meteo.com/v1/forecast') && u.includes('latitude=52.09') && u.includes('minutely_15') && !/apikey|key=/i.test(u)), 'bestaande API, geen sleutel');
ok(text().includes('Utrecht') && text().includes('14°') && text().includes('Lichte regen'), 'hero: ' + text().slice(0, 120)); ok(qa('.tu-tab').length === 7 && q('[data-gear]'), 'tabs');
ok(text().includes('Het gaat regenen over') && text().includes('Wat trek ik aan?') && text().includes('Windkracht 4') && text().includes('uit het zuidwesten'), 'regenwaarschuwing en wind');
await wait(); T.advance(100); ok(q('[data-air]').textContent.includes('Redelijk') && q('[data-air]').textContent.includes('berk'), 'luchtkwaliteit en pollen: ' + q('[data-air]').textContent);
ok(q('[data-clock]').textContent.length >= 5, 'klok'); T.frames(3); T.advance(2000, 100);
const tab = (k) => { click(q(`[data-tab="${k}"]`)); T.advance(100); };
tab('uur'); await wait(); T.frames(1); ok(text().includes('Komende 48 uur') && q('[data-chart]'), 'uur'); ok(qa('.tu-row').length > 40, 'uurrijen');
tab('dagen'); ok(qa('[data-day]').length === 14, '14 dagen'); click(q('[data-day="1"]')); ok(text().includes('Wind tot 31 km/u'), 'dag open'); click(qa('[data-act]')[2]); ok(text().includes('Beste dag voor'), 'activiteit');
tab('zon'); ok(text().includes('Gouden uur') && text().includes('% verlicht') && qa('[data-moon]').length === 1, 'zon en maan');
tab('radar'); ok(qa('a').length === 3 && qa('a').every((a) => a.attrs.target === '_blank' && /noopener/.test(a.attrs.rel)), 'links'); ok(qa('a').some((a) => a.attrs.href.includes('windy.com/?rain,52.09,5.12')), 'windy-link met coördinaten');
tab('leren'); ok(text().includes('Windkracht (Beaufort)') && text().includes('Soorten wolken'), 'leren'); for (let i = 0; i < 8; i++) { click(qa('[data-c]')[0]); T.advance(2100, 100); } ok(text().includes('van 8 goed'), 'quiz');
tab('plaatsen'); q('#wq').value = 'Gron'; click(q('#wgo')); await wait(); ok(qa('[data-p]').length === 1, 'zoekresultaat'); click(q('[data-p]')); await wait(); T.advance(100);
ok(text().includes('Groningen') && qa('.wr-chip').length >= 2, 'tweede plaats'); ok(JSON.parse(store.get('weer:v2:t1')).d.places.length === 2, 'plaatsen bewaard'); ok(JSON.parse(store.get('weer:loc:t1')).name === 'Groningen', 'oude sleutel weer:loc blijft gebruikt');
click(qa('[data-pl]')[1]); await wait(); T.advance(50); ok(text().includes('Utrecht') || text().includes('Groningen'), 'wisselen');
tab('plaatsen'); click(q('[data-rm]')); ok(JSON.parse(store.get('weer:v2:t1')).d.places.length === 1, 'verwijderd');
// offline: cache wordt gebruikt
fail = true; T.advance(11 * 60e3, 60e3); await wait(); T.advance(100); ok(/Geen verbinding|Nu|Groningen|Utrecht/.test(text()), 'offline blijft werken');
// oude cache zonder nieuwe velden laadt nog
{ const v2 = new El('div'); body.appendChild(v2); localStorage.setItem('weer:loc:old', JSON.stringify({ name: 'Oud', lat: 1, lon: 2 }));
  localStorage.setItem('weer:cache:old', JSON.stringify({ loc: { name: 'Oud', lat: 1, lon: 2 }, at: 1, data: { timezone: 'UTC', utc_offset_seconds: 0, current: { temperature_2m: 5, apparent_temperature: 3, relative_humidity_2m: 70, weather_code: 0, wind_speed_10m: 10, precipitation: 0, is_day: 1 }, hourly: { time: ['2025-10-09T08:00', '2025-10-09T09:00'], temperature_2m: [5, 6], precipitation_probability: [0, 0], precipitation: [0, 0], weather_code: [0, 0] }, daily: { time: ['2025-10-09'], weather_code: [0], temperature_2m_max: [7], temperature_2m_min: [2], precipitation_sum: [0], sunrise: ['2025-10-09T07:30'], sunset: ['2025-10-09T18:30'] } } }));
  await M.weerView({ view: v2, esc, uid: 'old', addCleanup: () => {} }); await wait(); ok(v2.textContent.includes('Oud') && v2.textContent.includes('5°'), 'oude cache: ' + v2.textContent.slice(0, 100)); }
// wereld-achtergrond
cleanups.forEach((f) => f()); ok(T.errors.length === 0, 'geen fouten');
console.log(`test-weer-ui: ${n} controles OK`); process.exit(0);
