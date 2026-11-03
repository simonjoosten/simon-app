// Chat, ronde 4: extra inhoud voor chat-core.js: 5 stickerpakketten, 8 thema's, 6 reacties en "Snelle zinnen" (stuurt gewone tekst, werkt dus ook bij oudere versies).
// Alleen data en kleine pure functies, geen imports (voorkomt een kringverwijzing met chat-core).
export const R4_PACKS = [
  { id: 'zee', n: 'Zee', ic: 'whale', items: ['whale', 'shark', 'octopus', 'jellyfish', 'crab', 'turtle', 'fish', 'shell', 'submarine', 'wave', 'boat', 'lighthouse', 'mermaid', 'palm'] },
  { id: 'muziek', n: 'Muziek', ic: 'guitar', items: ['guitar', 'piano', 'drum', 'microphone', 'headphones', 'note', 'bell', 'star', 'crown', 'trophy'] },
  { id: 'school', n: 'School', ic: 'book', items: ['book', 'pencil', 'paint', 'microscope', 'flask', 'globe', 'map', 'compass', 'lightbulb', 'scroll', 'school', 'hourglass', 'gear', 'target'] },
  { id: 'spel', n: 'Spelletjes', ic: 'dice', items: ['dice', 'puzzle', 'sword', 'shield', 'chest', 'key', 'gem', 'coin', 'crystal', 'bomb', 'trophy', 'medal', 'wand', 'potion', 'carousel', 'rollercoaster'] },
  { id: 'gevoel', n: 'Gevoel', ic: 'heart', items: ['heart', 'star', 'rainbow', 'sun', 'flower', 'sunflower', 'clover', 'balloon', 'gift', 'cake', 'cupcake', 'icecream', 'bear', 'panda', 'unicorn', 'fairy'] },
];
export const R4_THEMES = [
  { id: 'snoepwolk', n: 'Suikerspin', ic: 'cupcake', bg: ['#fce7f3', '#e0e7ff'], mine: ['#f472b6', '#a78bfa'], mineText: '#fff', theirs: '#ffffff', theirsText: '#4c1d95', dark: false },
  { id: 'dino', n: 'Dinoland', ic: 'dino', bg: ['#d9f99d', '#86efac'], mine: ['#4d7c0f', '#65a30d'], mineText: '#fff', theirs: '#f7fee7', theirsText: '#1a2e05', dark: false },
  { id: 'diepzee', n: 'Diepzee', ic: 'octopus', bg: ['#082f49', '#0c4a6e'], mine: ['#0891b2', '#22d3ee'], mineText: '#042f2e', theirs: '#164e63', theirsText: '#cffafe', dark: true },
  { id: 'kasteel', n: 'Kasteel', ic: 'castle', bg: ['#e7e5e4', '#d6d3d1'], mine: ['#57534e', '#78716c'], mineText: '#fff', theirs: '#fafaf9', theirsText: '#1c1917', dark: false },
  { id: 'goud', n: 'Schatkist', ic: 'chest', bg: ['#fef3c7', '#fcd34d'], mine: ['#b45309', '#f59e0b'], mineText: '#fff', theirs: '#fffbeb', theirsText: '#451a03', dark: false },
  { id: 'zomernacht', n: 'Zomernacht', ic: 'star', bg: ['#1e1b4b', '#be185d'], mine: ['#f97316', '#f43f5e'], mineText: '#fff', theirs: '#312e81', theirsText: '#fce7f3', dark: true },
  { id: 'robot', n: 'Robotlab', ic: 'robot', bg: ['#0f172a', '#134e4a'], mine: ['#14b8a6', '#2dd4bf'], mineText: '#042f2e', theirs: '#1e293b', theirsText: '#ccfbf1', dark: true },
  { id: 'regenboog', n: 'Regenboog', ic: 'rainbow', bg: ['#fef9c3', '#bae6fd'], mine: ['#8b5cf6', '#ec4899'], mineText: '#fff', theirs: '#ffffff', theirsText: '#312e81', dark: false },
];
export const R4_REACTIONS = ['🎉', '🤩', '🙏', '💯', '🤗', '😅'];
/** Snelle zinnen per groep; "{naam}" wordt vervangen door de naam van de ander. */
export const QUICK_PHRASES = [
  ['Groeten', ['Hoi {naam}!', 'Goedemorgen!', 'Welterusten, slaap lekker!', 'Fijne dag nog!', 'Tot straks!']],
  ['Plannen', ['Ik ben onderweg!', 'Ik ben er over 5 minuten.', 'Zullen we afspreken?', 'Mag ik straks bellen?', 'Ik kom je ophalen.', 'Ik ben er bijna.']],
  ['Reageren', ['Dat is leuk!', 'Haha, goeie!', 'Echt waar?!', 'Dank je wel!', 'Geen probleem.', 'Ik denk er even over na.', 'Sorry, dat was niet de bedoeling.']],
  ['Eten en spelen', ['Wat eten we vandaag?', 'Heb je zin in een spelletje?', 'Ik heb honger!', 'Kom je buitenspelen?', 'Zullen we een film kijken?']],
];
export const fillPhrase = (t, naam) => String(t).replace(/\{naam\}/g, naam ? String(naam).split(' ')[0] : '').replace(/\s+([!?.,])/g, '$1').replace(/\s{2,}/g, ' ').trim().slice(0, 200);
