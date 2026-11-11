// Exporta PDF vetorial (e prévia PNG com fundo transparente) a partir dos SVGs.
// Uso: NODE_PATH=$(npm root -g) node export_pdf_png.cjs <pasta-logo>
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{
  const dir=path.resolve(process.argv[2]); const F=path.join(dir,'fontes')+'/';
  const items=[['simbolo-produtos-do-sitio_1-literal','previa/1-literal.png'],['simbolo-produtos-do-sitio_2-editavel','previa/2-editavel.png']];
  const b=await chromium.launch();
  for(const [name,png] of items){
    let svg=fs.readFileSync(path.join(dir,name+'.svg'),'utf8').replace(/<\?xml[^>]*\?>/,'');
    const html=`<style>@font-face{font-family:Domine;font-weight:700;src:url(file://${F}Domine-Bold.ttf)}
@font-face{font-family:Lobster;src:url(file://${F}Lobster-Regular.ttf)}
@font-face{font-family:'Roboto Condensed';font-weight:700;src:url(file://${F}RobotoCondensed-Bold.ttf)}
@page{size:1024px 1024px;margin:0}html,body{margin:0;background:transparent}svg{width:1024px;height:1024px;display:block}</style>${svg}`;
    const h=path.join('/tmp',name+'.html'); fs.writeFileSync(h,html);
    const p=await b.newPage({viewport:{width:1024,height:1024}});
    await p.goto('file://'+h); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(600);
    await p.pdf({path:path.join(dir,name+'.pdf'),width:'1024px',height:'1024px',printBackground:true,pageRanges:'1',margin:{top:0,right:0,bottom:0,left:0}});
    await p.screenshot({path:path.join(dir,png),omitBackground:true});
    await p.close();
  }
  await b.close();
})();
