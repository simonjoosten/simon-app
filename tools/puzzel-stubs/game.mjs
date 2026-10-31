// Stub-spel: haalt de save op, meldt een score en laat de test het "level halen" aanroepen.
export const log = { api: null, loaded: undefined, destroyed: 0, created: 0 };
export default {
  create(host, api) {
    log.api = api; log.created++;
    api.score(0);
    Promise.resolve(api.load()).then((s) => { log.loaded = s; api.score(s ? 900 : 0); });
    return { destroy() { log.destroyed++; } };
  },
};
