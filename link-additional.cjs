const fs=require('fs'),path=require('path');
module.exports=function(root){
  const extras=JSON.parse(fs.readFileSync(path.join(root,'additional-pages.json'),'utf8'));
  const routes=new Map(extras.map(p=>[p.source,p.path]));
  const records=fs.readFileSync(path.join(root,'audit-2026-10-16/page-results.jsonl'),'utf8').trim().split(/\r?\n/).map(JSON.parse);
  for(const r of records){const dest=routes.get(r.canonical)||routes.get(r.finalUrl);if(dest)routes.set(r.url,dest);}
  const files=[];const walk=dir=>{for(const f of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,f.name);if(f.isDirectory())walk(p);else if(p.endsWith('.html'))files.push(p);}};walk(path.join(root,'dist'));
  for(const file of files){let html=fs.readFileSync(file,'utf8');html=html.replace(/<a\b[^>]*href="([^"]+)"/g,(match,url)=>{if(match.includes('mailto:')||match.includes('data-official-service'))return match;try{const parsed=new URL(url.replace(/&amp;/g,'&'),'https://ucpparana.edu.br/');const hash=parsed.hash;parsed.hash='';const key=parsed.href;const dest=routes.get(key)||routes.get(key+'/');return dest?match.replace(/href="[^"]+"/,`href="${dest}${hash}"`):match;}catch{return match;}});
    // Source evidence must continue pointing to the original page.
    const own=extras.find(p=>path.join(root,'dist',p.path)===file);
    if(own)html=html.replace(/(<div class="source-note">[^]*?<a href=")[^"]+(">Consultar fonte oficial)/,`$1${own.source}$2`);
    fs.writeFileSync(file,html);
  }
  const file=path.join(root,'dist/migration-index.json'),index=JSON.parse(fs.readFileSync(file,'utf8'));index.additional=extras.map(p=>({name:p.title,path:p.path,source:p.source,status:'importado'}));fs.writeFileSync(file,JSON.stringify(index,null,2));
};
