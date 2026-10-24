const courses = [
  {name:'Administração',area:'Negócios e Direito',symbol:'↗',slug:'administracao',description:'Pessoas, gestão e estratégia para transformar organizações e criar negócios.'},
  {name:'Direito',area:'Negócios e Direito',symbol:'§',slug:'direito',description:'Formação jurídica conectada à sociedade e à prática profissional.',duration:'5 anos · Noturno · Bacharelado'},
  {name:'Medicina Veterinária',area:'Saúde',symbol:'✳',slug:'medicina-veterinaria',description:'Saúde animal e formação prática com a estrutura da clínica escola UCPVet.'},
  {name:'Engenharia Agronômica',area:'Agro',symbol:'⌁',slug:'engenharia-agronomica',description:'Ciência e tecnologia para o campo, a produção e a sustentabilidade.',duration:'5 anos · Noturno · Bacharelado'},
  {name:'Enfermagem',area:'Saúde',symbol:'+',slug:'enfermagem',description:'Conhecimento e cuidado para atuar na saúde e na vida das pessoas.'},
  {name:'Psicologia',area:'Saúde',symbol:'ψ',slug:'psicologia',description:'Compreenda o comportamento humano e as diferentes dimensões do cuidado.'},
  {name:'Educação Física — Bacharelado',area:'Saúde',symbol:'↗',slug:'educacao-fisica-bacharelado',description:'Movimento, esporte e qualidade de vida em diferentes espaços de atuação.'},
  {name:'Educação Física — Licenciatura',area:'Educação',symbol:'↗',slug:'educacao-fisica-licenciatura',description:'Educação e movimento para contribuir com a formação de novas gerações.'},
  {name:'Pedagogia',area:'Educação',symbol:'▤',slug:'pedagogia',description:'Aprendizagem, ensino e desenvolvimento para transformar pela educação.'}
];
let selectedArea = 'Todos';
const grid=document.querySelector('#course-grid');
const search=document.querySelector('#course-search');
const normalize=text=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function renderCourses(){
  const visible=courses.filter(course=>(selectedArea==='Todos'||course.area===selectedArea)&&normalize(course.name).includes(normalize(search.value.trim())));
  document.querySelector('#results').textContent=`${visible.length} ${visible.length===1?'curso encontrado':'cursos encontrados'}`;
  grid.innerHTML=visible.length?visible.map(course=>`<article class="course-card"><div class="course-top"><span class="course-symbol" aria-hidden="true">${course.symbol}</span><span class="tag">${course.area}</span></div><h3>${course.name}</h3><p>${course.description}</p><button data-course="${course.slug}" aria-label="Conhecer o curso de ${course.name}">Conhecer o curso <span aria-hidden="true">↗</span></button></article>`).join(''):'<p class="empty">Nenhum curso encontrado. Tente outro nome ou selecione “Todos os cursos”.</p>';
}
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{selectedArea=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(item=>{item.classList.toggle('active',item===button);item.setAttribute('aria-pressed',String(item===button))});renderCourses()}));
search.addEventListener('input',renderCourses);
const dialog=document.querySelector('#course-dialog');
grid.addEventListener('click',event=>{const button=event.target.closest('[data-course]');if(!button)return;const course=courses.find(item=>item.slug===button.dataset.course);document.querySelector('#dialog-body').innerHTML=`<div class="eyebrow">GRADUAÇÃO / ${course.area}</div><h2 id="dialog-title">${course.name}</h2><p>${course.description}</p>${course.duration?`<p><strong>${course.duration}</strong></p>`:''}<p>Conheça a estrutura, o corpo docente e as informações acadêmicas na página oficial da UCP.</p><a class="button" href="https://ucpparana.edu.br/cursos/${course.slug}/">Ver informações oficiais <span>↗</span></a><p class="dialog-note">Consulte a UCP para confirmar a oferta da turma, os valores e as condições de ingresso vigentes.</p>`;dialog.showModal()});
document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close()}});
const menuButton=document.querySelector('.menu-toggle');const nav=document.querySelector('#main-nav');
menuButton.addEventListener('click',()=>{const open=nav.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');menuButton.textContent=open?'×':'☰'});
nav.addEventListener('click',event=>{if(event.target.closest('a')){nav.classList.remove('open');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Abrir menu');menuButton.textContent='☰'}});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav.classList.contains('open')){nav.classList.remove('open');menuButton.setAttribute('aria-expanded','false');menuButton.textContent='☰';menuButton.focus()}});
renderCourses();
const officialLinks = {"Publicações Legais":"https://ucpparana.edu.br/?page_id=15249","Instalações Acadêmicas":"https://ucpparana.edu.br/?page_id=147","Biblioteca UCP":"https://ucpparana.edu.br/?page_id=963","Calendário Acadêmico":"https://ucpparana.edu.br/?page_id=80","Sou Professor":"https://auth.ucpparana.edu.br","Horários - 2026/2":"https://ucpparana.edu.br/?page_id=76","Central do Aluno":"https://ucpparana.edu.br/central-do-aluno/","Ouvidoria":"https://ucpparana.edu.br/?page_id=92"}; document.querySelectorAll("[data-official]").forEach(link=>{const url=officialLinks[link.dataset.official];if(url&&url.startsWith("https://"))link.href=url});
const officialCourseLinks = {"Educação Física Licenciatura":"https://ucpparana.edu.br/?post_type=graduacao&p=125","Enfermagem":"https://ucpparana.edu.br/?post_type=cursos&p=34117","Medicina Veterinária":"https://ucpparana.edu.br/?post_type=graduacao&p=1724","Psicologia":"https://ucpparana.edu.br/?post_type=cursos&p=34032","Educação Física Bacharelado":"https://ucpparana.edu.br/?post_type=graduacao&p=124","Engenharia Agronômica":"https://ucpparana.edu.br/?post_type=graduacao&p=496","Direito":"https://ucpparana.edu.br/?post_type=graduacao&p=123","Pedagogia":"https://ucpparana.edu.br/?post_type=graduacao&p=128","Administração":"https://ucpparana.edu.br/?post_type=graduacao&p=121"}; dialog.addEventListener("toggle",()=>{if(!dialog.open)return;const name=document.querySelector("#dialog-title").textContent.replace(" — "," ");const link=dialog.querySelector(".button");if(officialCourseLinks[name])link.href=officialCourseLinks[name]});
