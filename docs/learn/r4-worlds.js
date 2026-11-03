// Ronde 4 – extra werelden voor de Learn-spellen. Worden bij het importeren achter de bestaande werelden gezet (gfx/themes.js zelf blijft ongemoeid).
// Alleen bestaande tekenvormen/iconen gebruikt, dus elke wereld tekent met de bestaande Themes.paintBackground.
import { Themes, WORLDS } from '../gfx/themes.js?v=1';

export const R4_WORLDS = [
  { id: 'regenboog', name: 'Regenboogland', emoji: '🌈', bg: ['#a5b4fc', '#f9a8d4', '#fde68a'], accent: '#ec4899', ground: '#fbcfe8', gk: 'cloud', far: 'clouds', mid: 'bumps', sky: 'sun', deco: ['rainbow', 'unicorn', 'fairy', 'balloon', 'star', 'butterfly'], particle: 'sparkles', mood: 'light', hz: 0.82, rays: true },
  { id: 'mijn', name: 'Goudmijn', emoji: '⛏️', bg: ['#1c1917', '#44403c', '#a16207'], accent: '#facc15', ground: '#57534e', gk: 'moon', far: 'crystals', mid: 'mountains', sky: 'none', deco: ['pickaxe', 'gem', 'crystal', 'chest', 'rock', 'lightbulb'], particle: 'dust', mood: 'dark', hz: 0.82 },
  { id: 'strand', name: 'Strand', emoji: '🏖️', bg: ['#38bdf8', '#7dd3fc', '#fde68a'], accent: '#0ea5e9', ground: '#f5d58a', gk: 'sand', far: 'waves', mid: 'dunes', sky: 'sun', deco: ['shell', 'crab', 'palm', 'boat', 'lighthouse', 'turtle'], particle: 'sparkles', mood: 'light', hz: 0.76 },
  { id: 'toverbos', name: 'Toverbos', emoji: '🔮', bg: ['#1e1b4b', '#5b21b6', '#86efac'], accent: '#c084fc', ground: '#14532d', gk: 'grass', far: 'pines', mid: 'blobs', sky: 'moon', deco: ['wizard', 'wand', 'potion', 'mushroom', 'owl', 'dragon'], particle: 'fireflies', mood: 'dark', hz: 0.8, rays: true },
  { id: 'poolnacht', name: 'Poolnacht', emoji: '🌌', bg: ['#020617', '#1e3a8a', '#22d3ee'], accent: '#67e8f9', ground: '#e2e8f0', gk: 'snow', far: 'mountains', mid: 'pines', sky: 'moon', deco: ['igloo', 'penguin', 'bear', 'snowflake', 'comet', 'pine'], particle: 'snow', mood: 'dark', hz: 0.82, cap: true },
  { id: 'circus', name: 'Circus', emoji: '🎪', bg: ['#fb7185', '#f97316', '#fde047'], accent: '#e11d48', ground: '#b91c1c', gk: 'candy', far: 'bumps', mid: 'bumps', sky: 'none', deco: ['tent', 'ticket', 'drum', 'bell', 'carousel', 'balloon'], particle: 'candy', mood: 'light', hz: 0.8 },
];

let done = false;
export function installWorlds() {
  if (done) return R4_WORLDS; done = true;
  try {
    for (const w of R4_WORLDS) if (!WORLDS.some((x) => x.id === w.id)) WORLDS.push(w);
    const byId = new Map(R4_WORLDS.map((w) => [w.id, w]));
    const origWorld = Themes.world.bind(Themes), origFor = Themes.forGame.bind(Themes);
    Themes.world = (id) => byId.get(id) || origWorld(id);
    const origSet = Themes.setForGame.bind(Themes);
    Themes.setForGame = (gameId, worldId) => {
      if (!byId.has(worldId)) return origSet(gameId, worldId);
      try { globalThis.localStorage.setItem('gfx:world:' + gameId, worldId); } catch { /* stil */ }
      return true;
    };
    Themes.forGame = (gameId) => {
      let id = null; try { id = globalThis.localStorage.getItem('gfx:world:' + gameId); } catch { /* stil */ }
      return byId.get(id) || origFor(gameId);
    };
  } catch { /* geen themes: geen extra werelden */ }
  return R4_WORLDS;
}
installWorlds();
