// Ronde 4 (Creatief): delen en exporteren zonder server. Deel-menu van het toestel (als dat bestaat), anders downloaden.
export const safeName = (s, d = 'bestand') => String(s || d).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || d;

export function download(blob, name) {
  const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 3000);
}

// Probeert het deel-menu (iOS/Android). Geeft 'shared' | 'downloaded' | 'cancelled' terug.
export async function shareBlob(blob, name, title = '') {
  try {
    const file = typeof File === 'function' ? new File([blob], name, { type: blob.type }) : null;
    if (file && navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) { await navigator.share({ files: [file], title }); return 'shared'; }
  } catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
  download(blob, name); return 'downloaded';
}

// SVG-tekst naar een PNG-blob (canvas). size = pixels.
export function svgToPng(svgText, size = 800) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })), img = new Image();
    img.onload = () => { try { const cv = document.createElement('canvas'); cv.width = cv.height = size; const c = cv.getContext('2d'); c.fillStyle = '#ffffff'; c.fillRect(0, 0, size, size); c.drawImage(img, 0, 0, size, size); URL.revokeObjectURL(url); cv.toBlob((b) => (b ? resolve(b) : reject(new Error('leeg'))), 'image/png'); } catch (e) { reject(e); } };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('svg')); };
    img.src = url;
  });
}

// Afdrukken van een SVG in een eigen venstertje.
export function printSvg(svgText, title = 'Kleurplaat') {
  const w = window.open('', '_blank'); if (!w) return false;
  w.document.write(`<!doctype html><title>${String(title).replace(/[<&]/g, '')}</title><style>body{margin:0;display:grid;place-items:center;min-height:100vh}svg{width:min(96vw,96vh);height:auto}</style>${svgText}<script>setTimeout(function(){print()},300)<\/script>`); w.document.close(); return true;
}
