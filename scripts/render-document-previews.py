import json
from pathlib import Path
import pypdfium2 as pdfium
root=Path(__file__).resolve().parent.parent
assets=json.loads((root/'institutional-assets.json').read_text(encoding='utf-8'))
source, entry=next((k,v) for k,v in assets.items() if 'CALENDARIO-UCP-2026_compressed.pdf' in k)
file=root/'storage/documentos'/Path(entry['file']).name
pdf=pdfium.PdfDocument(str(file))
previews=[]
for i in range(min(len(pdf),6)):
    page=pdf[i]
    image=page.render(scale=1.6).to_pil()
    name=file.stem+'-previa-'+str(i+1)+'.png'
    image.save(root/'storage/documentos'/name,optimize=True)
    previews.append('/assets/documentos/'+name)
(root/'document-previews.json').write_text(json.dumps({source:previews,entry['file']:previews},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'pages':len(pdf),'previews':previews}))
