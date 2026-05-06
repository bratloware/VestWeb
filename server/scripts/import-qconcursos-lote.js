import { execFileSync } from 'child_process';
import { readFileSync, unlinkSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const CATEGORY = 'QCONCURSOS_LOTE_1_100';
const EXPECTED_COUNT = 100;

const __dirname = dirname(fileURLToPath(import.meta.url));
const inputArg = process.argv[2] ?? '../data/qconcursos_lote_1_100.json';
const inputPath = resolve(__dirname, inputArg);
const tempPath = resolve(__dirname, '../data/.qconcursos_lote_1_100.prepared.json');
const importScriptPath = resolve(__dirname, 'import.js');

let parsed;
try {
  parsed = JSON.parse(readFileSync(inputPath, 'utf8'));
} catch (error) {
  console.error(`Erro ao ler JSON de entrada: ${error.message}`);
  process.exit(1);
}

if (!Array.isArray(parsed)) {
  console.error('O arquivo de entrada precisa ser um array JSON.');
  process.exit(1);
}

if (parsed.length !== EXPECTED_COUNT) {
  console.error(
    `Quantidade invalida para o lote: esperado ${EXPECTED_COUNT} questoes, recebido ${parsed.length}.`,
  );
  process.exit(1);
}

const prepared = parsed.map((question) => ({
  ...question,
  source: CATEGORY,
}));

writeFileSync(tempPath, JSON.stringify(prepared, null, 2), 'utf8');

try {
  execFileSync(process.execPath, [importScriptPath, tempPath, CATEGORY], { stdio: 'inherit' });
} finally {
  try {
    unlinkSync(tempPath);
  } catch {
    // ignore cleanup failures
  }
}
