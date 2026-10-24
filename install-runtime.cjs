const fs=require('node:fs'),path=require('node:path');
module.exports=function installRuntime(root){
  const dist=path.join(root,'dist'),vendor=path.join(dist,'vendor');fs.mkdirSync(vendor,{recursive:true});
  for(const file of ['gsap.min.js','ScrollTrigger.min.js'])fs.copyFileSync(require.resolve('gsap/dist/'+file),path.join(vendor,file));
  const tags='<script src="/vendor/gsap.min.js" defer></script><script src="/vendor/ScrollTrigger.min.js" defer></script><script src="/animations.js" defer></script><script src="/cookies.js" defer></script><script src="/benefits.js" defer></script>';
  function processDirectory(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())processDirectory(file);else if(entry.name.endsWith('.html')){let html=fs.readFileSync(file,'utf8');if(!html.includes('src="/dialogs.js"'))html=html.replace('</head>','<script src="/dialogs.js" defer></script></head>');if(!html.includes('src="/animations.js"'))html=html.replace('</head>',tags+'</head>');fs.writeFileSync(file,html)}}}
  processDirectory(dist);
};
