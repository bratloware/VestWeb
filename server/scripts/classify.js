/**
 * classify.js
 *
 * Lê um JSON de questões (formato VestWeb normalizado), limpa os enunciados
 * (remove [[placeholder]], headers markdown) e classifica cada questão com
 * subject + topic + subtopic baseados em palavras-chave do enunciado.
 *
 * Uso:
 *   node scripts/classify.js <input.json> [output.json]
 *   node scripts/classify.js data/enem_2024.json data/enem_2024_classified.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// ── Limpeza do enunciado ──────────────────────────────────────────────────────
function cleanStatement(text) {
  if (!text) return '';
  return text
    .replace(/\[\[placeholder\]\]/gi, '')   // remove [[placeholder]]
    .replace(/^#{1,4}\s+.+\n?/gm, '')       // remove linhas ## Título
    .replace(/\n{3,}/g, '\n\n')             // colapsa linhas em branco extras
    .trim();
}

// ── Tabela de classificação ───────────────────────────────────────────────────
// Ordem importa: matérias mais específicas primeiro
const RULES = [
  // ── MATEMÁTICA ─────────────────────────────────────────────────────────────
  {
    subject: 'Matemática',
    patterns: [
      /\b(equa[cç][aã]o|fun[cç][aã]o|f\(x\)|polinômio|polinomio)\b/i,
      /\b(geometria|triângulo|triangulo|círculo|circulo|retângulo|retangulo|área|volume|perímetro|perimetro)\b/i,
      /\b(probabilidade|combinat[oó]ria|permuta[cç][aã]o|arranjo|fatorial)\b/i,
      /\b(estatística|estatistica|média|mediana|moda|desvio padrão|histograma|gráfico de barras)\b/i,
      /\b(matrix|matriz|determinante|sistema linear)\b/i,
      /\b(logaritmo|potência|raiz|exponencial)\b/i,
      /\b(trigonometria|seno|cosseno|tangente|ângulo|angulo)\b/i,
      /\b(progressão|pa|pg|sequência)\b/i,
      /\b(porcentagem|porcentual|desconto|acréscimo|juros|taxa|parcela)\b/i,
      /\b(razão|proporção|regra de três|escala)\b/i,
      /\b(número inteiro|número real|conjunto numérico|fração)\b/i,
      /\b(paralelepípedo|prisma|pirâmide|cone|cilindro|esfera)\b/i,
      /\bvetor\b.*\bmatemática\b/i,
    ],
    topics: [
      { name: 'Funções',                   patterns: [/\bfun[cç][aã]o\b/i, /\bf\(x\)/i, /\bpolinômio\b/i, /\bexponencial\b/i, /\blogaritmo\b/i] },
      { name: 'Álgebra',                   patterns: [/\bequa[cç][aã]o\b/i, /\bsistema linear\b/i, /\bmatriz\b/i, /\bdeterminante\b/i, /\bprogress[aã]o\b/i, /\b(pa|pg)\b/i] },
      { name: 'Geometria Plana',           patterns: [/\b(triângulo|triangulo|círculo|circulo|retângulo|retangulo|polígono|quadrado|trapézio)\b/i, /\b(área|perímetro)\b/i, /\bgeometria plana\b/i] },
      { name: 'Geometria Espacial',        patterns: [/\b(paralelepípedo|prisma|pirâmide|cone|cilindro|esfera|volume|sólido)\b/i, /\bgeometria espacial\b/i] },
      { name: 'Geometria Analítica',       patterns: [/\b(plano cartesiano|coordenada|reta|distância entre pontos|circunferência analítica)\b/i] },
      { name: 'Trigonometria',             patterns: [/\b(seno|cosseno|tangente|trigonometria|ângulo|angulo)\b/i] },
      { name: 'Combinatória e Probabilidade', patterns: [/\b(probabilidade|combinat|permuta|arranjo|fatorial|evento)\b/i] },
      { name: 'Estatística',               patterns: [/\b(estatística|média|mediana|moda|desvio|histograma|frequência)\b/i] },
    ],
  },

  // ── FÍSICA ─────────────────────────────────────────────────────────────────
  {
    subject: 'Física',
    patterns: [
      /\b(velocidade|acelera[cç][aã]o|for[cç]a|massa|movimento|din[aâ]mica|mec[aâ]nica cl[aá]ssica)\b/i,
      /\b(energia cin[eé]tica|energia pot[eê]ncial|trabalho mec[aâ]nico|pot[eê]ncia)\b/i,
      /\b(el[eé]trico|el[eé]tron|corrente el[eé]trica|tens[aã]o|resist[eê]ncia|capacitor|circuito)\b/i,
      /\b(campo magn[eé]tico|indu[cç][aã]o|eletromagnetismo)\b/i,
      /\b(onda|frequ[eê]ncia|comprimento de onda|som|intensidade sonora|efeito doppler)\b/i,
      /\b([oó]ptica|refle[xks][aã]o|refra[cç][aã]o|lente|espelho|luz)\b/i,
      /\b(termodin[aâ]mica|calor|temperatura|press[aã]o|g[aá]s|lei dos gases|ciclo de carnot)\b/i,
      /\b(f[ií]sica moderna|relatividade|f[oó]ton|efeito fotoelétrico|radioatividade f[ií]sica)\b/i,
      /\b(grav(itação|idade)|lei de newton|atrito|impulso|momento angular)\b/i,
      /\b(raio-x|raios-x|quanta|quantum)\b/i,
    ],
    topics: [
      { name: 'Mecânica',          patterns: [/\b(velocidade|acelera[cç][aã]o|for[cç]a|massa|movimento|din[aâ]mica|gravitação|newton|atrito|impulso|trabalho mec|energia)\b/i] },
      { name: 'Termodinâmica',     patterns: [/\b(calor|temperatura|press[aã]o|g[aá]s|termodin|ciclo|entropia|dilatação)\b/i] },
      { name: 'Eletromagnetismo',  patterns: [/\b(el[eé]tric|corrente|tens[aã]o|resist[eê]ncia|capacitor|circuito|campo magn|indu[cç]|eletromagn)\b/i] },
      { name: 'Ondulatória',       patterns: [/\b(onda|frequ[eê]ncia|comprimento de onda|som|doppler|ressoni)\b/i] },
      { name: 'Óptica',            patterns: [/\b([oó]ptica|refle[xks][aã]o|refra[cç][aã]o|lente|espelho|luz|cor|prisma)\b/i] },
      { name: 'Física Moderna',    patterns: [/\b(relatividade|f[oó]ton|fotoelétrico|radioatividade f|quantum|quanta|raio-x)\b/i] },
    ],
  },

  // ── QUÍMICA ────────────────────────────────────────────────────────────────
  {
    subject: 'Química',
    patterns: [
      /\b(mol\b|molar|mol[eé]cula|[aá]tomo|elemento qu[ií]mico|tabela peri[oó]dica)\b/i,
      /\b(rea[cç][aã]o qu[ií]mica|equa[cç][aã]o qu[ií]mica|reagente|produto|catalisador)\b/i,
      /\b([aá]cido|base|sal|[oó]xido|neutraliza[cç][aã]o|pH)\b/i,
      /\b(solu[cç][aã]o|solubilidade|concentra[cç][aã]o|molaridade|soluto|solvente)\b/i,
      /\b(oxida[cç][aã]o|redu[cç][aã]o|el[eé]troquímica|eletrolise|pilha|eletrodo)\b/i,
      /\b(hidrocarboneto|alcano|alceno|alcino|benzeno|aromático|org[aâ]nica)\b/i,
      /\b(radioatividade|deca[ií]mento|meia vida|isótopo)\b/i,
      /\b(termoquímica|entalpia|entropia|gibbs|exotérmica|endotérmica)\b/i,
      /\b(polímero|plástico|nylon|borracha sintética)\b/i,
      /\b(combustão|fermentação|saponificação)\b/i,
    ],
    topics: [
      { name: 'Química Orgânica',   patterns: [/\b(orgânica|hidrocarboneto|alcano|alceno|alcino|benzeno|aromático|álcool|aldeído|cetona|ácido carboxílico|éster|amina|polímero)\b/i] },
      { name: 'Química Inorgânica', patterns: [/\b(inorgânica|[aá]cido|base|sal|[oó]xido|neutraliza|pH|tabela periódica|elemento quím|ligação iônica|covalente)\b/i] },
      { name: 'Físico-Química',     patterns: [/\b(termoquímica|entalpia|entropia|gibbs|cinética|equilíbrio quím|lei de hess|solução|concentração|molaridade)\b/i] },
      { name: 'Eletroquímica',      patterns: [/\b(oxidação|redução|eletroquímica|eletrólise|pilha|eletrodo|nox|semi-reação)\b/i] },
      { name: 'Radioatividade',     patterns: [/\b(radioatividade|decaimento|meia.vida|isótopo|fissão|fusão nuclear)\b/i] },
      { name: 'Soluções',           patterns: [/\b(solução|solubilidade|concentração|molaridade|soluto|solvente|diluição)\b/i] },
    ],
  },

  // ── BIOLOGIA ───────────────────────────────────────────────────────────────
  {
    subject: 'Biologia',
    patterns: [
      /\b(célula|citoplasma|membrana celular|núcleo celular|organela|mitocôndria|ribossomo)\b/i,
      /\b(DNA|RNA|gene|genoma|gen[eé]tica|cromossomo|herança|mutação|biotecnologia)\b/i,
      /\b(evolu[cç][aã]o|sele[cç][aã]o natural|darwin|adaptação|espécie|filogenia)\b/i,
      /\b(ecossistema|cadeia alimentar|teia alimentar|bioma|biodiversidade|ecologia)\b/i,
      /\b(fotoss[ií]ntese|respiração celular|fermentação|metabolismo)\b/i,
      /\b(v[ií]rus|bact[eé]ria|fungo|protozoário|parasita|doença infecciosa)\b/i,
      /\b(fisiologia|sistema nervoso|sistema circulatório|sistema digestório|hormônio|imunidade)\b/i,
      /\b(mitose|meiose|divisão celular|ciclo celular|câncer)\b/i,
      /\b(bo[tâ]nica|planta|fototropismo|angiosperma|gimnosperma|fotoperíodo)\b/i,
      /\b(embriologia|gastrulação|neurulação|desenvolvimento embrionário)\b/i,
      /\b(animal|vertebrado|invertebrado|mamífero|réptil|anfíbio|ave)\b/i,
      /\b(microplástico|poluição biológica|impacto ambiental biológico)\b/i,
      /\b(serpente|coral|veneno|peçonhento)\b/i,
    ],
    topics: [
      { name: 'Genética',          patterns: [/\b(DNA|RNA|gene|genoma|genética|cromossomo|herança|mutação|alelo|dominante|recessivo|daltonismo)\b/i] },
      { name: 'Ecologia',          patterns: [/\b(ecossistema|cadeia alimentar|teia alimentar|bioma|biodiversidade|ecologia|nicho|comunidade|população ecológica)\b/i] },
      { name: 'Evolução',          patterns: [/\b(evolução|seleção natural|darwin|adaptação|espécie|filogenia|especiação)\b/i] },
      { name: 'Citologia',         patterns: [/\b(célula|citoplasma|membrana|organela|mitocôndria|ribossomo|núcleo celular)\b/i] },
      { name: 'Fisiologia Humana', patterns: [/\b(sistema nervoso|sistema circulatório|digestório|hormônio|imunidade|fisiologia|sangue|coração|pulmão)\b/i] },
      { name: 'Botânica',          patterns: [/\b(planta|fototropismo|angiosperma|gimnosperma|fotoperíodo|botânica|vegetal)\b/i] },
      { name: 'Microbiologia',     patterns: [/\b(vírus|bactéria|fungo|protozoário|parasita|doença infecciosa|microorganismo)\b/i] },
      { name: 'Embriologia',       patterns: [/\b(embriologia|gastrulação|neurulação|desenvolvimento embrionário|blástula)\b/i] },
    ],
  },

  // ── HISTÓRIA ───────────────────────────────────────────────────────────────
  {
    subject: 'História',
    patterns: [
      /\b(guerra|revolu[cç][aã]o|imp[eé]rio|col[oô]nia|rep[uú]blica|ditadura|democracia)\b/i,
      /\b(brasil col[oô]nial|brasil imp[eé]rio|brasil rep[uú]blica|independência do brasil)\b/i,
      /\b(escravidão|abolição|escravos|quilombo)\b/i,
      /\b(segunda guerra|primeira guerra|guerra fria|nazismo|fascismo|holocausto)\b/i,
      /\b(revolu[cç][aã]o francesa|revolu[cç][aã]o industrial|iluminismo|absolutismo)\b/i,
      /\b(inquisição|feudalismo|cruzadas|renascimento|reforma protestante)\b/i,
      /\b(get[uú]lio|vargas|estado novo|militares|golpe|anistia|constituição histórica)\b/i,
      /\b(imperialismo|colonialismo|descolonização|africa|asia colonial)\b/i,
      /\b(urss|socialismo histórico|comunismo|capitalismo histórico|guerra fria)\b/i,
      /\b(antiguidade|grécia|roma|egito|mesopotâmia|faraó|gladiador)\b/i,
      /\b(indígena|povo originário|quilombola|história africana|pan-africanismo)\b/i,
      /\b(conselho de segurança|onu|nações unidas)\b/i,
      /\b(século (xix|xx|xxi|\d+))\b/i,
      /\b(revolução russa|bolchevique|lenin|stalin)\b/i,
    ],
    topics: [
      { name: 'Brasil República',              patterns: [/\b(república|vargas|estado novo|militares|golpe|anistia|getúlio|jk|lula|collor|diretas|constituição de 1988)\b/i] },
      { name: 'Brasil Imperial',               patterns: [/\b(imp[eé]rio|dom pedro|princesa isabel|abolição|lei áurea|parlamentarismo imperial|fiscal)\b/i] },
      { name: 'Brasil Colonial',               patterns: [/\b(col[oô]nia|colonial|capitania|sesmaria|escravid[aã]o|quilombo|bandeirante|jesuíta)\b/i] },
      { name: 'Imperialismo e Guerras Mundiais', patterns: [/\b(imperialismo|primeira guerra|segunda guerra|nazismo|fascismo|holocausto|descolonização)\b/i] },
      { name: 'Guerra Fria e Mundo Contemporâneo', patterns: [/\b(guerra fria|urss|nato|capitalismo|socialismo histórico|comunismo|cortina de ferro|onu|conselho de segurança)\b/i] },
      { name: 'Revoluções Burguesas',          patterns: [/\b(revolução francesa|revolução industrial|iluminismo|absolutismo|burguesia|revolução inglesa|revolução americana)\b/i] },
      { name: 'Idade Moderna',                 patterns: [/\b(renascimento|reforma protestante|inquisição|mercantilismo|grandes navegações|humanismo)\b/i] },
      { name: 'Idade Média',                   patterns: [/\b(feudalismo|cruzadas|idade média|medieval|senhorio|vassalo|servo|clero)\b/i] },
      { name: 'Antiguidade',                   patterns: [/\b(antiguidade|grécia|roma|egito|mesopotâmia|faraó|gladiador|ática|espartano|democracia ateniense)\b/i] },
      { name: 'História Indígena e Africana',  patterns: [/\b(indígena|povo originário|quilombola|africana|pan-africanismo|diáspora|tráfico negreiro)\b/i] },
    ],
  },

  // ── GEOGRAFIA ──────────────────────────────────────────────────────────────
  {
    subject: 'Geografia',
    patterns: [
      /\b(clima|bioma|cerrado|amazônia|mata atlântica|caatinga|pampa|pantanal)\b/i,
      /\b(relevo|erosão|sedimentação|planície|planalto|depressão geográfica)\b/i,
      /\b(urbanização|cidade|metrópole|megalópole|êxodo rural|periferização)\b/i,
      /\b(população|migração|emigração|imigração|densidade demográfica|natalidade|mortalidade)\b/i,
      /\b(geopolítica|território|fronteira|estado nacional|soberania)\b/i,
      /\b(industrialização|zona franca|agropecuária|agronegócio|latifúndio|mst)\b/i,
      /\b(hidrografia|bacia hidrográfica|rio|lago|aquífero)\b/i,
      /\b(cartografia|mapa|projeção cartográfica|escala cartográfica|latitude|longitude)\b/i,
      /\b(questão ambiental|desmatamento|aquecimento global|efeito estufa|sustentabilidade)\b/i,
      /\b(globalização geográfica|fluxo comercial|balança comercial|bloco econômico)\b/i,
    ],
    topics: [
      { name: 'Climatologia',               patterns: [/\b(clima|bioma|cerrado|amazônia|mata atlântica|caatinga|temperatura|precipitação|chuva|seca|el niño)\b/i] },
      { name: 'Geopolítica',                patterns: [/\b(geopolítica|território|fronteira|estado nacional|conflito territorial|bloco econômico|globalização)\b/i] },
      { name: 'Urbanização',                patterns: [/\b(urbanização|cidade|metrópole|megalópole|êxodo rural|periferização|favelização|conurbação)\b/i] },
      { name: 'População',                  patterns: [/\b(população|migração|emigração|imigração|densidade demográfica|natalidade|mortalidade|pirâmide etária)\b/i] },
      { name: 'Questões Ambientais',        patterns: [/\b(desmatamento|aquecimento global|efeito estufa|sustentabilidade|poluição ambiental|biodiversidade geog)\b/i] },
      { name: 'Geomorfologia',              patterns: [/\b(relevo|erosão|sedimentação|planície|planalto|depressão|intemperismo|vulcanismo)\b/i] },
      { name: 'Hidrografia',               patterns: [/\b(hidrografia|bacia hidrográfica|rio|lago|aquífero|vazão)\b/i] },
      { name: 'Cartografia',               patterns: [/\b(cartografia|mapa|projeção|escala cartográfica|latitude|longitude|coordenadas geográficas)\b/i] },
      { name: 'Agropecuária e Industrialização', patterns: [/\b(agropecuária|agronegócio|latifúndio|mst|indústria|zona franca|desindustrialização)\b/i] },
    ],
  },

  // ── FILOSOFIA ──────────────────────────────────────────────────────────────
  {
    subject: 'Filosofia',
    patterns: [
      /\b(filosofia|filósofo|platão|aristóteles|sócrates|kant|hegel|nietzsche|descartes|hume|locke|rousseau|marx filosófico)\b/i,
      /\b(ética|moral filosófica|virtude|dever moral|imperativo categórico)\b/i,
      /\b(epistemologia|teoria do conhecimento|empirismo|racionalismo|ceticismo)\b/i,
      /\b(metafísica|ontologia|ser e ente|existencialismo|fenomenologia)\b/i,
      /\b(lógica filosófica|argumento|premissa|silogismo|falácia)\b/i,
      /\b(política filosófica|contrato social|estado de natureza|soberania popular)\b/i,
      /\b(estética filosófica|belo|sublime|arte filosófica)\b/i,
      /\b(poder|exercer o poder público|democracia filosófica)\b/i,
    ],
    topics: [
      { name: 'Ética e Política',        patterns: [/\b(ética|moral filosófica|virtude|dever|imperativo|política filosófica|contrato social|poder público|democracia filosófica)\b/i] },
      { name: 'Epistemologia e Lógica',  patterns: [/\b(epistemologia|conhecimento|empirismo|racionalismo|ceticismo|lógica|argumento|premissa|silogismo)\b/i] },
      { name: 'Filosofia Antiga',        patterns: [/\b(platão|aristóteles|sócrates|pré-socrático|sofista|estoico|epicuro|antiguidade filosófica)\b/i] },
      { name: 'Filosofia Moderna',       patterns: [/\b(descartes|locke|hume|kant|rousseau|hobbes|spinoza|leibniz|moderno filosófico)\b/i] },
      { name: 'Filosofia Contemporânea', patterns: [/\b(hegel|nietzsche|marx filosófico|heidegger|sartre|foucault|habermas|contemporâneo filosófico)\b/i] },
    ],
  },

  // ── SOCIOLOGIA ─────────────────────────────────────────────────────────────
  {
    subject: 'Sociologia',
    patterns: [
      /\b(sociologia|durkheim|weber|marx sociológico|comte)\b/i,
      /\b(classe social|desigualdade social|estratificação|mobilidade social)\b/i,
      /\b(trabalho|mercado de trabalho|desemprego|sindicato|capitalismo sociológico)\b/i,
      /\b(cultura|identidade cultural|multiculturalismo|etnocentrismo|relativismo cultural)\b/i,
      /\b(movimentos sociais|feminismo|lgbtq|antirracismo|direitos humanos)\b/i,
      /\b(democracia sociológica|cidadania|direito|participação política|voto)\b/i,
      /\b(gênero|sexualidade|patriarcado|machismo)\b/i,
      /\b(mídia|fake news|redes sociais sociológica|letramento)\b/i,
      /\b(violência social|criminalidade|segurança pública)\b/i,
      /\b(exclusão social|inclusão|vulnerabilidade|pobreza)\b/i,
      /\b(olimp[ií]ada|esporte|manifestação cultural|folclore|festival)\b/i,
      /\b(operário|fábrica|alienação|fordismo|taylorismo)\b/i,
    ],
    topics: [
      { name: 'Cultura e Identidade',    patterns: [/\b(cultura|identidade cultural|multiculturalismo|etnocentrismo|relativismo|folclore|festival|arte popular)\b/i] },
      { name: 'Estratificação Social',   patterns: [/\b(classe social|desigualdade|estratificação|mobilidade social|exclusão social)\b/i] },
      { name: 'Trabalho e Sociedade',    patterns: [/\b(trabalho|mercado de trabalho|desemprego|sindicato|fordismo|taylorismo|alienação|operário)\b/i] },
      { name: 'Movimentos Sociais',      patterns: [/\b(movimentos sociais|feminismo|lgbtq|antirracismo|direitos humanos|luta|protesto|manifestação social)\b/i] },
      { name: 'Democracia e Cidadania',  patterns: [/\b(democracia sociológica|cidadania|direito|participação política|voto|estado democrático)\b/i] },
      { name: 'Fundamentos da Sociologia', patterns: [/\b(durkheim|weber|marx sociológico|comte|sociologia|fato social|ação social)\b/i] },
    ],
  },

  // ── LITERATURA ─────────────────────────────────────────────────────────────
  {
    subject: 'Literatura',
    patterns: [
      /\b(romance|conto|poema|poesia|lírica|épico|dramático|prosa|verso|estrofe|rima)\b/i,
      /\b(narrador|personagem|enredo|foco narrativo|ponto de vista literário)\b/i,
      /\b(machado de assis|josé de alencar|graciliano|drummond|clarice lispector|vinicius|guimarães rosa)\b/i,
      /\b(modernismo literário|romantismo|realismo|naturalismo|parnasianismo|simbolismo|arcadismo|barroco)\b/i,
      /\b(intertextualidade|metáfora literária|ironia literária|alegoria|eufemismo literário)\b/i,
      /\b(dom casmurro|capitu|brás cubas|iracema|senhora|são bernardo|memorias póstumas)\b/i,
      /\b(literatura brasileira|cânone literário|escola literária)\b/i,
    ],
    topics: [
      { name: 'Modernismo',                patterns: [/\b(modernismo|semana de arte moderna|andrade|drummond|oswald|clarice|guimarães rosa|joão cabral)\b/i] },
      { name: 'Romantismo',                patterns: [/\b(romantismo|alencar|iracema|senhora|indianismo|ultra-romantismo|álvares de azevedo)\b/i] },
      { name: 'Realismo e Naturalismo',    patterns: [/\b(realismo|naturalismo|machado de assis|capitu|dom casmurro|brás cubas|eça de queirós|aluísio)\b/i] },
      { name: 'Literatura Contemporânea',  patterns: [/\b(contemporâneo literário|pós-modernismo literário|literatura atual|conto contemporâneo)\b/i] },
      { name: 'Parnasianismo e Simbolismo',patterns: [/\b(parnasianismo|simbolismo|bilac|cruz e sousa|alphonsus)\b/i] },
      { name: 'Barroco e Arcadismo',       patterns: [/\b(barroco|arcadismo|padre vieira|gregório de matos|tomás antônio gonzaga|cláudio manuel)\b/i] },
    ],
  },

  // ── INGLÊS ─────────────────────────────────────────────────────────────────
  {
    subject: 'Inglês',
    patterns: [
      /\b(the|and|of|to|is|are|was|were|have|has|had|will|would|can|could|should)\b/,
      /\b(text|read|passage|according|following|author|speaker|writer)\b/i,
      /\bin (english|the english)\b/i,
    ],
    topics: [
      { name: 'Interpretação de Texto em Inglês', patterns: [/\b(the|and|of|to|text|read|passage|according)\b/] },
      { name: 'Gramática Inglesa',                patterns: [/\b(grammar|tense|verb|pronoun|adjective|adverb|preposition)\b/i] },
    ],
  },

  // ── LÍNGUA PORTUGUESA (fallback para questões de texto) ────────────────────
  {
    subject: 'Língua Portuguesa',
    patterns: [
      /\b(texto|leitura|interpret|enunciado|parágrafo|língua|português|gramática|sintaxe)\b/i,
      /\b(crônica|carta|reportagem|artigo|editorial|manifesto|discurso|anúncio|propaganda)\b/i,
      /\b(figura de linguagem|metáfora|metonímia|hipérbole|ironia|eufemismo|antítese|paradoxo)\b/i,
      /\b(variação linguística|norma culta|coloquial|dialeto|gíria|registro)\b/i,
      /\b(coesão|coerência textual|progressão temática|referenciação)\b/i,
      /\b(gênero textual|tipo textual|narração|descrição|dissertação|injunção)\b/i,
      /\b(marcador|conector|operador argumentativo|conjunção|advérbio)\b/i,
    ],
    topics: [
      { name: 'Interpretação de Texto',  patterns: [/\b(texto|leitura|interpret|crônica|carta|reportagem|artigo|finalidade|propósito|informa)\b/i] },
      { name: 'Figuras de Linguagem',    patterns: [/\b(figura de linguagem|metáfora|metonímia|hipérbole|ironia|eufemismo|antítese|paradoxo|intertextualidade)\b/i] },
      { name: 'Variação Linguística',    patterns: [/\b(variação linguística|norma culta|coloquial|dialeto|gíria|registro|preconceito linguístico|falar errado)\b/i] },
      { name: 'Gramática',               patterns: [/\b(gramática|sintaxe|morfologia|flexão|concordância|regência|crase|pontuação|ortografia)\b/i] },
      { name: 'Semântica',               patterns: [/\b(semântica|sentido|significado|denotação|conotação|polissemia|sinonímia|antonímia)\b/i] },
    ],
  },
];

// ── Classifica uma questão ────────────────────────────────────────────────────
function classify(statement) {
  const text = statement.toLowerCase();

  let bestSubject = null;
  let bestScore   = 0;

  for (const rule of RULES) {
    let score = 0;
    for (const pat of rule.patterns) {
      if (pat.test(text)) score++;
    }
    if (score > bestScore) {
      bestScore   = score;
      bestSubject = rule;
    }
  }

  if (!bestSubject || bestScore === 0) {
    return { subject: 'Língua Portuguesa', topic: 'Interpretação de Texto', subtopic: null };
  }

  // Encontra o tópico dentro da matéria classificada
  let bestTopic     = null;
  let bestTopicScore = 0;

  for (const t of (bestSubject.topics || [])) {
    let s = 0;
    for (const p of t.patterns) { if (p.test(text)) s++; }
    if (s > bestTopicScore) { bestTopicScore = s; bestTopic = t.name; }
  }

  return {
    subject:  bestSubject.subject,
    topic:    bestTopic || (bestSubject.subject + ' — Geral'),
    subtopic: null,
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────
const [,, inputArg, outputArg] = process.argv;

if (!inputArg) {
  console.error('Uso: node scripts/classify.js <input.json> [output.json]');
  process.exit(1);
}

const inputPath  = resolve(inputArg);
const outputPath = outputArg
  ? resolve(outputArg)
  : inputPath.replace(/\.json$/, '_classified.json');

let raw;
try {
  raw = JSON.parse(readFileSync(inputPath, 'utf8'));
} catch (err) {
  console.error(`Erro ao ler ${inputPath}: ${err.message}`);
  process.exit(1);
}

console.log(`\nClassificando ${raw.length} questões...\n`);

const subjectCount = {};

const classified = raw.map((q, i) => {
  const cleanedStatement = cleanStatement(q.statement);
  const { subject, topic, subtopic } = classify(cleanedStatement);

  subjectCount[subject] = (subjectCount[subject] || 0) + 1;

  return {
    ...q,
    statement: cleanedStatement,
    subject,
    topic,
    subtopic,
  };
});

writeFileSync(outputPath, JSON.stringify(classified, null, 2), 'utf8');

console.log('Distribuição por matéria:');
Object.entries(subjectCount)
  .sort((a, b) => b[1] - a[1])
  .forEach(([s, c]) => console.log(`  ${String(c).padStart(3)}  ${s}`));

console.log(`\nSaída: ${outputPath}\n`);
