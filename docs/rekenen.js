// Rekenen: oefenen (11 onderwerpen x 5 niveaus), tafelkamp, rekenrace, monsterjacht, dagelijkse uitdaging, puzzels,
// voortgang en badges, plus het gereedschap (rekenmachine, eenheden, valuta, procent, fooi, datum).
// Entry-bestand: de pure rekenfuncties blijven hier beschikbaar; de speelomgeving staat in rekenen-play.js.
export { evaluate, convert, daysBetween, addDays, ageBetween } from './rekenen-calc.js?v=1';

// ctx: { db, me, esc, uid, view, addCleanup }
export async function rekenenView(ctx) {
  const m = await import('./rekenen-play.js?v=1');
  return m.playApp(ctx);
}
