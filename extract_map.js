const fs = require('fs');

const inputPath = 'C:/Users/tavares/.gemini/antigravity-ide/brain/a08ed541-8545-44ac-afa5-2e1c0486572f/.system_generated/steps/17/content.md';
const content = fs.readFileSync(inputPath, 'utf8');

const prefix = 'window.BRASIL=';
const start = content.indexOf(prefix);
if (start !== -1) {
  let jsonStr = content.slice(start + prefix.length).trim();
  // Strip trailing semicolon if present
  let semiIdx = jsonStr.indexOf('};\n');
  if (semiIdx === -1) semiIdx = jsonStr.indexOf('};');
  if (semiIdx !== -1) {
    jsonStr = jsonStr.slice(0, semiIdx + 1);
  }
  fs.writeFileSync('c:/Users/tavares/Documents/mapa/brasil_topo.json', jsonStr);
  console.log('Successfully saved brasil_topo.json, size:', jsonStr.length);
  const vars = [];
  const re = /(?:window\.)?([A-Z0-9_]+)\s*=\s*\{/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    vars.push(match[1]);
  }
  console.log('Detected objects in file:', vars);
} else {
  console.error('Prefix not found');
}
