// Ronde 4 (Creatief): 14 extra liedjes voor Piano (noten in dezelfde schrijfwijze als piano-songs.js: "E4 D4 C4:2", rust = "r:.5").
// Geen imports. Het zijn vereenvoudigde versies van oude, vrije melodieën.
export const R4_SONGS = [
  { id: 'londen', name: 'London Bridge', level: 1, bpm: 110, icon: 'bridge', notes: 'G4:1.5 A4:.5 G4 F4 E4 F4 G4:2 D4 E4 F4:2 E4 F4 G4:2 G4:1.5 A4:.5 G4 F4 E4 F4 G4:2 D4:2 G4 E4 C4:2' },
  { id: 'yankee', name: 'Yankee Doodle', level: 1, bpm: 120, icon: 'flag', notes: 'C4 C4 D4 E4 C4 E4 D4:2 C4 C4 D4 E4 C4:2 B3:2 C4 C4 D4 E4 F4 E4 D4 C4 B3 G3 A3 B3 C4:2 C4:2' },
  { id: 'cucaracha', name: 'La Cucaracha', level: 2, bpm: 130, icon: 'sun', notes: 'C4 C4 C4 F4:2 A4 C4 C4 C4 F4:2 A4:2 F4 F4 E4 E4 D4 D4 C4:3' },
  { id: 'stillenacht', name: 'Stille nacht', level: 2, bpm: 76, icon: 'star', notes: 'G4:1.5 A4:.5 G4 E4:3 G4:1.5 A4:.5 G4 E4:3 D5:2 D5 B4:3 C5:2 C5 G4:3' },
  { id: 'joy', name: 'Joy to the world', level: 2, bpm: 110, icon: 'bell', notes: 'C5 B4:1.5 A4:.5 G4:1.5 F4:.5 E4 D4 C4:2 G4:.5 A4:.5 A4:1.5 B4:.5 B4:.5 C5:.5 C5:2' },
  { id: 'wewish', name: 'We wish you a merry Christmas', level: 2, bpm: 120, icon: 'gift', notes: 'D4 G4 G4:.5 A4:.5 G4:.5 F#4:.5 E4 E4 E4 A4 A4:.5 B4:.5 A4:.5 G4:.5 F#4 D4 D4 B4 B4:.5 C5:.5 B4:.5 A4:.5 G4 E4 D4:.5 D4:.5 E4 A4 F#4 G4:2' },
  { id: 'maanlicht', name: 'Maanlicht-sonate (begin)', level: 2, bpm: 96, icon: 'moon', notes: 'G#3:.5 C#4:.5 E4:.5 G#3:.5 C#4:.5 E4:.5 G#3:.5 C#4:.5 E4:.5 G#3:.5 C#4:.5 E4:.5 A3:.5 C#4:.5 E4:.5 A3:.5 C#4:.5 E4:.5' },
  { id: 'tetris', name: 'Russisch speelgoed (Korobeiniki)', level: 3, bpm: 140, icon: 'puzzle', notes: 'E5 B4:.5 C5:.5 D5 C5:.5 B4:.5 A4 A4:.5 C5:.5 E5 D5:.5 C5:.5 B4:1.5 C5:.5 D5 E5 C5 A4 A4:2' },
  { id: 'bergkoning', name: 'In de hal van de bergkoning', level: 3, bpm: 140, icon: 'crown', notes: 'B3 C#4 D4 E4 F#4 D4 F#4:2 F4 C4 F4:2 B3 C#4 D4 E4 F#4 D4 F#4:2 B4 A4 F#4 D4 F#4 A4:2' },
  { id: 'greensleeves', name: 'Greensleeves', level: 3, bpm: 100, icon: 'fairy', notes: 'A4 C5:2 D5 E5:1.5 F5:.5 E5 D5:2 B4 G4:1.5 A4:.5 B4 C5:2 A4 A4:1.5 G#4:.5 A4 B4:2 G#4 E4:2' },
  { id: 'nachtmusik', name: 'Kleine nachtmuziek (Mozart)', level: 3, bpm: 120, icon: 'trophy', notes: 'G4 r:.5 D4:.5 G4 r:.5 D4:.5 G4:.5 D4:.5 G4:.5 B4:.5 D5:2 C5 r:.5 A4:.5 C5 r:.5 A4:.5 C5:.5 A4:.5 F#4:.5 A4:.5 D4:2' },
  { id: 'turks', name: 'Turkse mars (Mozart, begin)', level: 3, bpm: 130, icon: 'bolt', notes: 'B4:.5 A4:.5 G#4:.5 A4:.5 C5:2 D5:.5 C5:.5 B4:.5 C5:.5 E5:2 F5:.5 E5:.5 D#5:.5 E5:.5 B5:.5 A5:.5 G#5:.5 A5:.5 B5:.5 A5:.5 G#5:.5 A5:.5 C6:2' },
  { id: 'bachprelude', name: 'Prelude in C (Bach)', level: 3, bpm: 110, icon: 'piano', notes: 'C4:.5 E4:.5 G4:.5 C5:.5 E5:.5 G4:.5 C5:.5 E5:.5 C4:.5 E4:.5 G4:.5 C5:.5 E5:.5 G4:.5 C5:.5 E5:.5 C4:.5 D4:.5 A4:.5 D5:.5 F5:.5 A4:.5 D5:.5 F5:.5 C4:.5 D4:.5 A4:.5 D5:.5 F5:.5 A4:.5 D5:.5 F5:.5' },
  { id: 'brahms', name: 'Slaapliedje (Brahms)', level: 2, bpm: 84, icon: 'heart', notes: 'E4:.5 E4:.5 G4:2 E4:.5 E4:.5 G4:2 E4:.5 G4:.5 C5 B4:1.5 A4:.5 A4 G4:2' },
];

// Liedje van de dag: voor iedereen op dezelfde dag hetzelfde.
export const dailyIndex = (n, t = Date.now()) => (n > 0 ? ((Math.floor(t / 86400000) * 31 + 7) % n + n) % n : 0);

// Pianoleer-oefeningen: toonladders en akkoordsprongen als gewone liedjes (zelfde schrijfwijze).
export const R4_DRILLS = [
  { id: 'ladder-c', name: 'Toonladder C omhoog en omlaag', level: 1, bpm: 100, icon: 'tree', notes: 'C4 D4 E4 F4 G4 A4 B4 C5 B4 A4 G4 F4 E4 D4 C4:2' },
  { id: 'ladder-g', name: 'Toonladder G', level: 1, bpm: 100, icon: 'tree', notes: 'G3 A3 B3 C4 D4 E4 F#4 G4 F#4 E4 D4 C4 B3 A3 G3:2' },
  { id: 'driekl', name: 'Drieklank-sprongen', level: 1, bpm: 90, icon: 'target', notes: 'C4 E4 G4 E4 C4 E4 G4 E4 F4 A4 C5 A4 F4 A4 C5 A4 G4 B4 D5 B4 G4:2' },
  { id: 'oktaaf', name: 'Oktaafsprongen', level: 2, bpm: 100, icon: 'rocket', notes: 'C4 C5 D4 D5 E4 E5 F4 F5 G4 G5 F4 F5 E4 E5 D4 D5 C4:2' },
];
