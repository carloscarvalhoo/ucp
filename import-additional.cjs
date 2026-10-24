const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const root=__dirname;
// Reuse the importer sanitizer without executing its data-writing section.
const utils=fs.readFileSync(path.join(root,'import-content.cjs'),'utf8').split('const data=read(')[0];
const {safeHtml,plain}=new Function('require','__dirname',utils+';return {safeHtml,plain};')(require,root);
const records=fs.readFileSync(path.join(root,'audit-2026-10-16/page-results.jsonl'),'utf8').trim().split(/\r?\n/).map(JSON.parse);
const roots=['pos-graduacao','contato','extensao-ucp','cpa-avaliacao','revistasucp','alcp','eventos'];
const selected=records.filter(p=>{const u=new URL(p.url);return p.status===200&&!u.search&&roots.some(r=>u.pathname===`/${r}/`||u.pathname.startsWith(`/${r}/`));});
const seen=new Set(),pages=[];
for(const record of selected){
  const pathname=new URL(record.url).pathname;if(pathname.startsWith('/pos-graduacao/')&&pathname!=='/pos-graduacao/')continue;if(seen.has(pathname))continue;seen.add(pathname);
  const parts=pathname.split('/').filter(Boolean),group=parts[0];
  const raw=zlib.gunzipSync(fs.readFileSync(path.join(root,'audit-2026-10-16',record.evidence))).toString();
  const heading=/<h1\b[^>]*>[^]*?<\/h1>/i.exec(raw);
  let body=heading?raw.slice(heading.index+heading[0].length).split(/<footer\b/i)[0]:'';
  if(group==='pos-graduacao')body=(body.match(/<div class="descricao">[^]*?(?=<\/section>)/)||[''])[0];
  // Layout wrappers from the legacy theme have no meaning in the new layout.
  let clean=safeHtml(body,record.url).replace(/<\/?(?:div|span|section|article)\b[^>]*>/gi,'');
  const title=plain(record.h1?.[0]||record.title.replace(/\s*\|.*$/,''));
  const route='/'+parts.join('/')+'.html';
  pages.push({title,source:record.url,path:route,group,index:parts.length===1,html:clean,hasForm:record.forms>0,importedAt:'2026-10-16'});
}
fs.writeFileSync(path.join(root,'additional-pages.json'),JSON.stringify(pages,null,2));
console.log(`Additional official pages imported: ${pages.length}`);
