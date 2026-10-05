const fs = require('fs');

const html = fs.readFileSync('C:/Users/tavares/.gemini/antigravity-ide/brain/a08ed541-8545-44ac-afa5-2e1c0486572f/.system_generated/steps/7/content.md', 'utf8');

const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["']/g);
console.log('Images in initial HTML:', imgMatches);
