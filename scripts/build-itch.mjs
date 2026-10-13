import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {rollup} from '@rollup/wasm-node';
import {zipSync,strToU8} from 'fflate';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
if(args.length!==2 || args[0]!=='--pack' || !/^[a-z0-9-]+$/.test(args[1])) {
  throw Error('Usage: node scripts/build-itch.mjs --pack volume-1');
}
const name=args[1];
const entry=resolve(root,`packs/${name}/pack.mjs`);
const {PACK}=await import(pathToFileURL(entry));
const bundle=await rollup({input:resolve(root,'app.mjs'),plugins:[{
  name:'active-pack',resolveId(source){if(source.endsWith('/active-pack.mjs')) return entry;}
}]});
const result=await bundle.generate({format:'iife'});
await bundle.close();
const css=await readFile(resolve(root,PACK.theme),'utf8');
const source=await readFile(resolve(root,'index.html'),'utf8');
const html=source.replace(/<title>.*?<\/title>/,`<title>${PACK.title}</title>`)
  .replace('<link id="pack-theme" rel="stylesheet">',()=>`<style>${css}</style>`)
  .replace('<script type="module" src="./app.mjs"></script>',()=>`<script>${result.output[0].code.replace(/<\/script/gi,'<\\/script')}</script>`);
const out=resolve(root,`build/first-light-${name}`);
await mkdir(out,{recursive:true});
await writeFile(resolve(out,'index.html'),html);
await writeFile(`${out}.zip`,zipSync({'index.html':strToU8(html)}));
console.log(`Built ${out}/index.html and ${out}.zip`);
