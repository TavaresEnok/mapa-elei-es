const fs = require('fs');
const data = JSON.parse(fs.readFileSync('brazil_svg_paths.json', 'utf8'));

let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

for (const [uf, s] of Object.entries(data)) {
  const nums = s.d.match(/-?\d+\.?\d*/g).map(Number);
  for (let i = 0; i < nums.length; i += 2) {
    const x = nums[i], y = nums[i+1];
    if (!isNaN(x)) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
    if (!isNaN(y)) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  }
  console.log(uf, 'center:', s.center);
}

console.log('\nBounding Box:');
console.log('  X:', minX.toFixed(1), '-', maxX.toFixed(1), '  Width:', (maxX - minX).toFixed(1));
console.log('  Y:', minY.toFixed(1), '-', maxY.toFixed(1), '  Height:', (maxY - minY).toFixed(1));
console.log('\nIdeal viewBox:', 
  Math.floor(minX-10), Math.floor(minY-10),
  Math.ceil(maxX - minX + 20), Math.ceil(maxY - minY + 20)
);
