const fs = require('fs');
const vm = require('vm');

const inputPath = 'C:/Users/tavares/.gemini/antigravity-ide/brain/a08ed541-8545-44ac-afa5-2e1c0486572f/.system_generated/steps/13/content.md';
let code = fs.readFileSync(inputPath, 'utf8');

// Strip markdown header if any
const codeStart = code.indexOf('window.CANDIDATOS=');
if (codeStart !== -1) {
  code = code.slice(codeStart);
}

const sandbox = { window: {} };
vm.createContext(sandbox);

try {
  vm.runInContext(code, sandbox);
  console.log('Evaluated successfully!');
  const keys = Object.keys(sandbox.window);
  console.log('Keys in window:', keys);
  
  const electionData = {
    candidatos: sandbox.window.CANDIDATOS,
    partidos: sandbox.window.PARTIDOS,
    federacoes: sandbox.window.FEDERACOES,
    exterior: sandbox.window.EXTERIOR,
    senado: sandbox.window.SENADO,
    r2022: sandbox.window.R2022
  };

  fs.writeFileSync('c:/Users/tavares/Documents/mapa/election_tse_data.json', JSON.stringify(electionData, null, 2));
  console.log('Saved election_tse_data.json');
  console.log('Presidentes count:', (electionData.candidatos?.presidente || []).length);
  console.log('Governadores states count:', Object.keys(electionData.candidatos?.governador || {}).length);
  console.log('Partidos count:', Object.keys(electionData.partidos || {}).length);
} catch (e) {
  console.error('VM error:', e.message);
}
