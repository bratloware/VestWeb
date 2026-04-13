/**
 * import-all.js
 *
 * Roda import.js para todos os anos do ENEM (2009–2025).
 *
 * Uso:
 *   node scripts/import-all.js
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

const START = 2009;
const END   = 2025;

for (let year = START; year <= END; year++) {
  const file = `data/enem_${year}.json`;

  console.log(`\n── ${year} ──────────────────────────────`);

  if (!existsSync(file)) {
    console.log(`  Arquivo ${file} não encontrado, pulando.`);
    continue;
  }

  try {
    execSync(`node scripts/import.js ${file}`, { stdio: 'inherit' });
  } catch {
    console.error(`  Falhou para ${year}.`);
  }
}
