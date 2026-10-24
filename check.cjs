const fs=require('node:fs');const path=require('node:path');
const root=path.join(__dirname,'dist');const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const references=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match=>match[1]);
const missingAssets=references.filter(ref=>!ref.startsWith('http')&&!ref.startsWith('#')&&!fs.existsSync(path.join(root,ref.split(/[?#]/)[0])));
const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(match=>match[1]));
const brokenAnchors=references.filter(ref=>ref.startsWith('#')&&!ids.has(ref.slice(1)));
const courses=JSON.parse(fs.readFileSync(path.join(__dirname,'content-source.json'),'utf8').replace(/^\uFEFF/,''));
console.log(JSON.stringify({missingAssets,brokenAnchors,sections:(html.match(/<section/g)||[]).length,courses:courses.courses.length}));
if(missingAssets.length||brokenAnchors.length)process.exit(1);
