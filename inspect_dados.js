const fs = require('fs');

const inputPath = 'C:/Users/tavares/.gemini/antigravity-ide/brain/a08ed541-8545-44ac-afa5-2e1c0486572f/.system_generated/steps/13/content.md';
const content = fs.readFileSync(inputPath, 'utf8');

const re = /(?:window\.)?([A-Z0-9_]+)\s*=\s*[\{\[]/g;
let match;
while ((match = re.exec(content)) !== null) {
  console.log('Object in dados:', match[1]);
}
