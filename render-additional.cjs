const fs=require('node:fs'),path=require('node:path');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
module.exports=function({root,write}){
  const pages=JSON.parse(fs.readFileSync(path.join(root,'additional-pages.json'),'utf8'));
  const groups={'pos-graduacao':'Pós-Graduação',contato:'Contato e atendimento','extensao-ucp':'Extensão UCP','cpa-avaliacao':'CPA',revistasucp:'Revistas UCP',alcp:'Academia de Letras do Centro do Paraná',eventos:'Eventos'};
  const routes=new Map(pages.map(p=>[p.source,p.path]));
  const rewrite=html=>html.replace(/href="([^"]+)"/g,(match,url)=>{try{const u=new URL(url.replace(/&amp;/g,'&'));u.hash='';const key=u.href.endsWith('/')?u.href:u.href+'/';return routes.has(key)?`href="${routes.get(key)}"`:match;}catch{return match;}});
  const icon=name=>`<span class="material-icons-outlined" aria-hidden="true">${name}</span>`;
  const cards=list=>`<div class="directory-grid additional-grid">${list.map(p=>`<a href="${p.path}"><h2>${esc(p.title)}</h2><span>Conheça ${icon('arrow_forward')}</span></a>`).join('')}</div>`;
  for(const p of pages){
    const children=pages.filter(c=>c.group===p.group&&!c.index);
    let body=rewrite(p.html);
    if(p.index&&['extensao-ucp','cpa-avaliacao'].includes(p.group))body=cards(children.filter(c=>c.path.split('/').length===3));
    if(p.index&&p.group==='revistasucp')body=cards(children.filter(c=>c.path.split('/').length===3));
    if(p.group==='pos-graduacao')body+=`<aside class="service-note"><h2>Informações sobre pós-graduação</h2><p>Fale com a UCP para consultar cursos, próximas turmas, modalidades e condições de ingresso.</p><a class="solid-button" href="/contato.html">Consultar a oferta de pós-graduação ${icon('arrow_forward')}</a></aside>`;
    if(p.group==='contato'&&p.index){
      body=`<div class="contact-grid"><article class="contact-panel">${icon('mail_outline')}<h2>Fale com a UCP</h2><p>Envie suas dúvidas e solicitações para nossa equipe.</p><a class="solid-button" href="mailto:contato@ucpparana.edu.br">contato@ucpparana.edu.br</a><p><a data-official-service href="https://ucpparana.edu.br/contato/">Enviar pelo formulário institucional ↗</a></p></article><article class="contact-panel">${icon('location_on')}<h2>Venha nos visitar</h2><p>Av. Desembargador Cordeiro Clève, 500<br>Jardim Universitário — Pitanga/PR<br>CEP 85202-300</p><a class="outline-button" href="https://www.waze.com/ul?ll=-24.761645%2C-51.783746&navigate=yes&zoom=17">Como chegar ${icon('arrow_forward')}</a></article></div><h2 class="contact-section-title">Encontre o atendimento que precisa</h2><div class="directory-grid additional-grid">${[['Coordenação','/contato/coordenacao.html'],['Setores','/contato/setores-2.html'],['Ouvidoria','/contato/ouvidoria.html']].map(([name,url])=>`<a href="${url}"><h2>${name}</h2><span>Acessar atendimento ${icon('arrow_forward')}</span></a>`).join('')}</div>`;
    }
    if(p.group==='eventos')body=p.index?`<div class="service-note"><h2>Memória de eventos da UCP</h2><p>Confira os registros institucionais. Os eventos abaixo são históricos; datas, valores e inscrições publicados se referem à época de sua realização.</p></div>${cards(children)}`:`<aside class="service-note"><strong>Registro histórico</strong><p>Este conteúdo pertence ao acervo de eventos da UCP. Informações de inscrições e valores não representam uma oferta atual.</p></aside>${body}`;
    const siblingNav=!p.index?`<aside class="section-menu"><h2>${esc(groups[p.group])}</h2><a href="/${p.group}.html">Visão geral</a>${children.map(c=>`<a href="${c.path}" ${c.path===p.path?'aria-current="page"':''}>${esc(c.title)}</a>`).join('')}</aside>`:'';
    write(p.path.slice(1),p.title,`<div class="page-heading"><div class="wrap"><div class="breadcrumbs"><a href="/">Início</a> / ${p.index?esc(groups[p.group]):`<a href="/${p.group}.html">${esc(groups[p.group])}</a>`}</div><h1>${esc(p.index?groups[p.group]:p.title)}</h1></div></div><div class="wrap section ${siblingNav?'inner-layout':''}">${siblingNav}<article class="imported-content additional-content">${body}</article></div>`);
  }
  console.log(`Additional pages generated: ${pages.length}`);
};
