/**
 * normalize-all.js
 *
 * Roda normalize.js para todos os anos do ENEM (2009–2024).
 * Substitui o loop bash do package.json (não funciona no Windows cmd).
 *
 * Uso:
 *   node scripts/normalize-all.js
 */

import { execSync } from 'child_process';

const START = 2009;
const END   = 2025;

for (let year = START; year <= END; year++) {
  const input  = `data/raw/enem_${year}.json`;
  const output = `data/enem_${year}.json`;
  const cmd    = `node scripts/normalize.js ${input} ENEM ${output}`;

  console.log(`\n── ${year} ──────────────────────────────`);
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch {
    console.error(`  Falhou para ${year} (arquivo ausente ou erro).`);
  }
}
