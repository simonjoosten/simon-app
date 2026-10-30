import fs from 'fs'; import path from 'path'; import {fileURLToPath} from 'url';
const d = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(d,'..','..');
const H = fs.readFileSync(path.join(d,'src-c','helpers.txt'),'utf8');
for (const f of fs.readdirSync(path.join(d,'src-c'))) {
  if (!f.endsWith('.src.js')) continue;
  const out = f.replace('.src.js','.js');
  const s = fs.readFileSync(path.join(d,'src-c',f),'utf8').replace('//@HELPERS', H);
  fs.writeFileSync(path.join(root,'docs','learn','games',out), s);
  console.log('gebouwd', out, s.split('\n').length+' regels');
}
