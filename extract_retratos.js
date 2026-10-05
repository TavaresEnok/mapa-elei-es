const fs = require('fs');
const vm = require('vm');

const inputPath = 'C:/Users/tavares/.gemini/antigravity-ide/brain/a08ed541-8545-44ac-afa5-2e1c0486572f/.system_generated/steps/13/content.md';
let code = fs.readFileSync(inputPath, 'utf8');
const codeStart = code.indexOf('window.CANDIDATOS=');
if (codeStart !== -1) code = code.slice(codeStart);

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

console.log('RETRATOS count:', Object.keys(sandbox.window.RETRATOS || {}).length);
console.log('Sample keys in RETRATOS:', Object.keys(sandbox.window.RETRATOS || {}).slice(0, 10));
const sampleKey = Object.keys(sandbox.window.RETRATOS || {})[0];
console.log('Sample value length:', sandbox.window.RETRATOS[sampleKey]?.length, sandbox.window.RETRATOS[sampleKey]?.slice(0, 50));

fs.writeFileSync('c:/Users/tavares/Documents/mapa/retratos.json', JSON.stringify(sandbox.window.RETRATOS));
console.log('Saved retratos.json, size:', fs.statSync('c:/Users/tavares/Documents/mapa/retratos.json').size);
