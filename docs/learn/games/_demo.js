// Oefenspel (test-spel van de hub; id begint met een underscore en staat niet in de lijst).
// 10 vragen, hartjes, reeksbonus. Gebruikt alleen de env uit SPEC §5.
const CSS = `
.lsd{position:absolute;inset:0;display:flex;flex-direction:column;background:linear-gradient(160deg,rgba(13,148,136,.16),rgba(99,102,241,.14));color:var(--ink)}
.lsd *{box-sizing:border-box}
.lsd-top{display:flex;align-items:center;gap:10px;padding:10px 12px;font-weight:800}
.lsd-top .sp{flex:1}
.lsd-bar{height:8px;margin:0 12px;border-radius:99px;background:rgba(127,127,127,.22);overflow:hidden}
.lsd-bar i{display:block;height:100%;background:linear-gradient(90deg,#0d9488,#6366f1);border-radius:99px;transition:width .4s}
.lsd-q{flex:1;overflow-y:auto;padding:10px 12px 16px}
.lsd-fly{position:absolute;left:50%;top:70px;transform:translateX(-50%);font-weight:900;font-size:22px;color:#16a34a;pointer-events:none;animation:lsdFly 1s ease-out forwards}
.lsd-fly.bad{color:#dc2626}
.lsd-intro{margin:auto;text-align:center;padding:24px;max-width:340px}
.lsd-intro h3{margin:6px 0}
.lsd-go{border:0;background:var(--accent);color:#fff;font:inherit;font-weight:800;border-radius:14px;padding:13px 26px;margin-top:14px;cursor:pointer}
@keyframes lsdFly{to{transform:translate(-50%,-46px);opacity:0}}
`;
export default {
  id: '_demo', name: 'Oefenen', emoji: '🎯', color: '#0d9488',
  desc: 'Beantwoord 10 vragen. Een reeks goede antwoorden geeft bonuspunten.',
  tags: ['rustig'], minutes: 3, duo: false,
  create(host, env) {
    const N = 10;
    let dead = false, handle = null, timer = 0;
    const style = document.createElement('style'); style.textContent = CSS; host.appendChild(style);
    const wrap = document.createElement('div'); wrap.className = 'lsd'; host.appendChild(wrap);
    const fxv = env.fx || {};
    let lives = 3 + (fxv.extraLives | 0), shield = fxv.shield | 0, score = Math.round(fxv.startCash || 0);
    let streak = 0, best = 0, correct = 0, wrong = 0, idx = 0, ended = false;
    const qs = env.pick(N);
    const finish = (win) => {
      if (ended) return; ended = true;
      env.end({ score, win, stats: { correct, wrong, bestStreak: best }, summary: win ? `Alle ${qs.length} vragen gehaald met ${lives} ${lives === 1 ? 'hartje' : 'hartjes'} over.` : 'Je hartjes zijn op. Probeer het nog eens!' });
    };
    const hud = () => `<div class="lsd-top"><span>⭐ ${score}</span><span class="sp"></span><span>🔥 ${streak}</span><span>${'❤️'.repeat(Math.max(0, lives))}${shield ? '🛡️' : ''}</span></div><div class="lsd-bar"><i style="width:${Math.round(100 * idx / Math.max(1, qs.length))}%"></i></div>`;
    function fly(txt, bad) { const f = document.createElement('div'); f.className = 'lsd-fly' + (bad ? ' bad' : ''); f.textContent = txt; wrap.appendChild(f); timer = setTimeout(() => { try { f.remove(); } catch {} }, 1000); }
    function next() {
      if (dead || ended) return;
      if (idx >= qs.length || lives <= 0) { finish(lives > 0); return; }
      wrap.innerHTML = hud() + '<div class="lsd-q"></div>';
      const qh = wrap.querySelector('.lsd-q'), q = qs[idx];
      const t0 = Date.now();
      handle = env.ask(qh, q, { time: 0, feedback: true, compact: false, autoNext: 1100, label: `Vraag ${idx + 1} van ${qs.length}` });
      handle.promise.then((res) => {
        if (dead) return;
        const ok = !!(res && res.ok);
        env.report({ q, ok, ms: (res && res.ms) || (Date.now() - t0) });
        if (ok) {
          streak++; best = Math.max(best, streak); correct++;
          const gain = Math.round((10 + Math.min(streak - 1, 10) * (2 + (fxv.streakBonus || 0))) * (fxv.cashMult || 1));
          score += gain; env.snd && env.snd.play('munt'); fly('+' + gain);
        } else {
          wrong++; streak = 0;
          if (shield > 0) { shield--; fly('🛡️', true); } else { lives--; fly('💔', true); }
        }
        idx++;
        timer = setTimeout(next, 250);
      }).catch(() => { if (!dead) { idx++; timer = setTimeout(next, 200); } });
    }
    wrap.innerHTML = `<div class="lsd-intro"><div style="font-size:54px">🎯</div><h3>Oefenen</h3><div>Beantwoord ${qs.length} vragen. Elke goede levert punten op, een reeks geeft bonus. Je hebt ${lives} hartjes.</div><button class="lsd-go">Tik om te beginnen</button></div>`;
    wrap.querySelector('.lsd-go').addEventListener('click', next);
    return {
      destroy() {
        dead = true; clearTimeout(timer);
        try { handle && handle.cancel && handle.cancel(); } catch {}
        try { style.remove(); wrap.remove(); } catch {}
      },
    };
  },
};
