import 'dotenv/config';
import sequelize from './index.js';
import { Subject, Topic, Subtopic, Vestibular } from './models/index.js';

async function seedVestibulares() {
  console.log('🔄  Conectando ao banco...');
  await sequelize.authenticate();
  console.log('✅  Conexão OK\n');

  // ── 1. VESTIBULARES ──────────────────────────────────────────────────────────
  console.log('🌱  Inserindo vestibulares...');

  const vestibularesData = [
    {
      name: 'ENEM',
      full_name: 'Exame Nacional do Ensino Médio',
      institution: 'INEP / MEC',
      state: null,
      description: 'O mais usado do Brasil. Abre portas para universidades federais via SISU, bolsas pelo ProUni e financiamento pelo FIES. Estilo interdisciplinar, com foco em interpretação e raciocínio lógico.',
    },
    {
      name: 'FUVEST',
      full_name: 'Fundação Universitária para o Vestibular',
      institution: 'Universidade de São Paulo (USP)',
      state: 'SP',
      description: 'Um dos mais difíceis e tradicionais do Brasil. Exige domínio profundo dos conteúdos e tem questões que cobram raciocínio elaborado. Porta de entrada para a USP.',
    },
    {
      name: 'UNICAMP',
      full_name: 'Vestibular da Universidade Estadual de Campinas',
      institution: 'UNICAMP',
      state: 'SP',
      description: 'Tradicional e muito exigente. Famoso por questões criativas e interdisciplinares que fogem do padrão. Exige leitura ampla e pensamento crítico.',
    },
    {
      name: 'UNESP',
      full_name: 'Vestibular da Universidade Estadual Paulista',
      institution: 'UNESP / VUNESP',
      state: 'SP',
      description: 'Nível intermediário entre o ENEM e a FUVEST. Questões objetivas e bem estruturadas. Boa opção para quem busca uma universidade estadual de qualidade em SP.',
    },
    {
      name: 'UNB',
      full_name: 'Processo Seletivo da Universidade de Brasília',
      institution: 'Universidade de Brasília (UnB)',
      state: 'DF',
      description: 'Estilo único, com questões que costumam "pegar" quem decora sem entender. Valoriza raciocínio e interpretação. Aceita ENEM pelo SISU, mas tem PAS próprio.',
    },
    {
      name: 'PUC-SP',
      full_name: 'Vestibular da PUC de São Paulo',
      institution: 'Pontifícia Universidade Católica de São Paulo',
      state: 'SP',
      description: 'Universidade privada de prestígio em SP. Vestibular mais acessível que os estaduais, com questões bem elaboradas mas de nível moderado.',
    },
    {
      name: 'PUC-RIO',
      full_name: 'Vestibular da PUC do Rio de Janeiro',
      institution: 'Pontifícia Universidade Católica do Rio de Janeiro',
      state: 'RJ',
      description: 'Referência em ensino privado no Rio. Processo seletivo acessível e bem organizado. Aceita nota do ENEM.',
    },
    {
      name: 'PUC-MG',
      full_name: 'Vestibular da PUC de Minas Gerais',
      institution: 'Pontifícia Universidade Católica de Minas Gerais',
      state: 'MG',
      description: 'PUC com forte presença em Minas Gerais. Processo seletivo acessível, aceita ENEM e tem vestibular próprio.',
    },
  ];

  let vestibularesInseridos = 0;
  for (const v of vestibularesData) {
    const [, created] = await Vestibular.findOrCreate({
      where: { name: v.name },
      defaults: v,
    });
    if (created) vestibularesInseridos++;
    else console.log(`   ⚠️  Vestibular "${v.name}" já existe, pulando.`);
  }
  console.log(`   → ${vestibularesInseridos} vestibulares inseridos\n`);

  // ── 2. SUBTÓPICOS ────────────────────────────────────────────────────────────
  console.log('🌱  Inserindo subtópicos...');

  // Mapeamento: matéria → tópico → [subtópicos]
  const subtopicsMap = {
    'Biologia': {
      'Citologia': [
        'Membrana Plasmática', 'Organelas Celulares', 'Núcleo e Material Genético',
        'Mitose', 'Meiose', 'Ciclo Celular', 'Transporte Celular', 'Metabolismo Energético',
      ],
      'Genética': [
        '1ª Lei de Mendel (Monoibridismo)', '2ª Lei de Mendel (Diibridismo)',
        'Herança Ligada ao Sexo', 'Herança Influenciada pelo Sexo',
        'Dominância Incompleta e Codominância', 'Alelos Múltiplos',
        'Genes Letais', 'Epistasia', 'Mutações', 'Biotecnologia e Engenharia Genética',
      ],
      'Ecologia': [
        'Cadeias e Teias Alimentares', 'Níveis Tróficos e Pirâmides Ecológicas',
        'Ciclos Biogeoquímicos', 'Sucessão Ecológica', 'Relações Ecológicas',
        'Biomas Brasileiros', 'Biomas Mundiais', 'Impactos Ambientais e Poluição',
        'Aquecimento Global', 'Unidades de Conservação',
      ],
      'Evolução': [
        'Lamarckismo', 'Darwinismo', 'Neodarwinismo (Teoria Sintética)',
        'Especiação', 'Deriva Genética', 'Evidências da Evolução', 'Origem da Vida',
        'Evolução Humana',
      ],
      'Embriologia': [
        'Fecundação', 'Segmentação (Clivagem)', 'Gastrulação', 'Nêurula',
        'Folhetos Germinativos', 'Anexos Embrionários', 'Desenvolvimento Pós-natal',
      ],
      'Histologia': [
        'Tecido Epitelial de Revestimento', 'Tecido Epitelial Glandular',
        'Tecido Conjuntivo Propriamente Dito', 'Tecido Adiposo', 'Tecido Cartilaginoso',
        'Tecido Ósseo', 'Tecido Muscular Liso', 'Tecido Muscular Estriado Esquelético',
        'Tecido Muscular Cardíaco', 'Tecido Nervoso',
      ],
      'Fisiologia Humana': [
        'Sistema Digestório', 'Sistema Circulatório', 'Sistema Respiratório',
        'Sistema Excretor', 'Sistema Nervoso Central', 'Sistema Nervoso Periférico',
        'Sistema Endócrino (Hormônios)', 'Sistema Imunológico', 'Sistema Reprodutor',
        'Sistema Locomotor (Ossos e Músculos)',
      ],
      'Botânica': [
        'Morfologia Vegetal (Raiz, Caule, Folha)', 'Flores e Frutos',
        'Fotossíntese', 'Respiração Celular em Plantas',
        'Transporte de Seiva', 'Reprodução Vegetal', 'Classificação das Plantas',
        'Briófitas e Pteridófitas', 'Gimnospermas e Angiospermas',
      ],
      'Microbiologia': [
        'Vírus', 'Bactérias', 'Fungos', 'Protozoários',
        'Doenças Causadas por Vírus', 'Doenças Causadas por Bactérias',
        'Doenças Causadas por Protozoários',
      ],
    },
    'Química': {
      'Química Orgânica': [
        'Hidrocarbonetos (Alcanos, Alcenos, Alcinos)', 'Funções Oxigenadas (Álcoois, Aldeídos, Cetonas)',
        'Ácidos Carboxílicos e Ésteres', 'Funções Nitrogenadas', 'Isomeria Plana',
        'Isomeria Espacial (Estereoisomeria)', 'Reações Orgânicas (Adição, Substituição, Eliminação)',
        'Polímeros e Plásticos', 'Bioquímica (Lipídeos, Proteínas, Carboidratos)',
      ],
      'Química Inorgânica': [
        'Ácidos (Arrhenius e Brønsted)', 'Bases (Arrhenius e Brønsted)',
        'Sais (Nomenclatura e Propriedades)', 'Óxidos', 'Reações Inorgânicas',
        'Tabela Periódica', 'Ligações Químicas (Iônica, Covalente, Metálica)',
        'Geometria Molecular', 'Polaridade de Moléculas', 'Funções Inorgânicas',
      ],
      'Físico-Química': [
        'Estequiometria', 'Leis dos Gases (Boyle, Charles, Gay-Lussac)',
        'Gases Reais e Ideais', 'Termoquímica (Entalpia)', 'Lei de Hess',
        'Cinética Química (Velocidade de Reação)', 'Catalisadores',
        'Equilíbrio Químico', 'Le Chatelier', 'Produto de Solubilidade (Kps)',
      ],
      'Eletroquímica': [
        'Oxidação e Redução (Nox)', 'Pilhas e Baterias', 'Eletrólise',
        'Potencial de Eletrodo Padrão', 'Corrosão',
      ],
      'Soluções': [
        'Concentração Comum (g/L)', 'Concentração em Mol/L (Molaridade)',
        'Título e Fração Molar', 'Diluição e Mistura de Soluções',
        'Propriedades Coligativas (Tonoscopia, Crioscopia, Ebulioscopia, Osmoscopia)',
        'pH e pOH',
      ],
      'Radioatividade': [
        'Tipos de Radiação (Alfa, Beta, Gama)', 'Decaimento Radioativo',
        'Meia-vida', 'Fissão e Fusão Nuclear', 'Aplicações Médicas e Industriais',
      ],
    },
    'Física': {
      'Mecânica': [
        'Movimento Retilíneo Uniforme (MRU)', 'Movimento Retilíneo Uniformemente Variado (MRUV)',
        'Queda Livre e Lançamento Vertical', 'Lançamento Horizontal e Oblíquo',
        '1ª Lei de Newton (Inércia)', '2ª Lei de Newton (F = ma)', '3ª Lei de Newton (Ação e Reação)',
        'Força de Atrito', 'Trabalho e Potência', 'Energia Cinética e Potencial',
        'Conservação de Energia', 'Quantidade de Movimento e Impulso',
        'Colisões (Elástica e Inelástica)', 'Gravitação Universal', 'Hidrostática e Hidráulica',
      ],
      'Termodinâmica': [
        'Temperatura e Escalas Termométricas', 'Dilatação Térmica',
        'Calorimetria (Calor Específico, Calor Latente)', 'Propagação de Calor',
        '1ª Lei da Termodinâmica', '2ª Lei da Termodinâmica',
        'Máquinas Térmicas e Rendimento', 'Ciclo de Carnot',
      ],
      'Óptica': [
        'Reflexão da Luz', 'Espelhos Planos', 'Espelhos Esféricos',
        'Refração da Luz', 'Lentes Delgadas', 'Olho Humano e Defeitos da Visão',
        'Dispersão da Luz e Arco-íris', 'Fibra Óptica',
      ],
      'Eletromagnetismo': [
        'Eletrostática (Carga Elétrica, Lei de Coulomb)', 'Campo Elétrico',
        'Potencial Elétrico', 'Capacitores', 'Corrente Elétrica e Resistência',
        'Lei de Ohm', 'Circuitos em Série e Paralelo', 'Efeito Joule',
        'Magnetismo (Campo Magnético)', 'Força de Lorentz',
        'Indução Eletromagnética (Lei de Faraday)', 'Geradores e Transformadores',
      ],
      'Ondulatória': [
        'Natureza e Classificação das Ondas', 'Fenômenos Ondulatórios (Reflexão, Refração, Difração)',
        'Som (Características e Propagação)', 'Efeito Doppler',
        'Ondas Estacionárias e Ressonância', 'Espectro Eletromagnético',
      ],
      'Física Moderna': [
        'Modelos Atômicos (Thomson, Rutherford, Bohr)', 'Dualidade Onda-Partícula',
        'Efeito Fotoelétrico', 'Relatividade Restrita (Einstein)',
        'Física Nuclear (Fissão e Fusão)', 'Radioatividade',
      ],
    },
    'Matemática': {
      'Álgebra': [
        'Conjuntos Numéricos', 'Operações com Frações e Potências',
        'Equações do 1º Grau', 'Inequações do 1º Grau', 'Equações do 2º Grau',
        'Fórmula de Bhaskara', 'Sistemas de Equações Lineares',
        'Progressão Aritmética (PA)', 'Progressão Geométrica (PG)',
        'Matrizes', 'Determinantes', 'Sistemas Lineares (Regra de Cramer)',
        'Polinômios e Fatoração',
      ],
      'Funções': [
        'Definição e Domínio de Funções', 'Função do 1º Grau (Afim)',
        'Função do 2º Grau (Quadrática)', 'Função Exponencial',
        'Logaritmos e Função Logarítmica', 'Função Modular',
        'Função Trigonométrica (Seno, Cosseno, Tangente)',
        'Composição e Inversão de Funções',
      ],
      'Trigonometria': [
        'Razões Trigonométricas no Triângulo Retângulo',
        'Ciclo Trigonométrico', 'Identidades Trigonométricas',
        'Lei dos Senos', 'Lei dos Cossenos', 'Equações Trigonométricas',
      ],
      'Geometria Plana': [
        'Triângulos (Classificação, Área, Semelhança)',
        'Quadriláteros (Paralelogramos, Trapézios)', 'Circunferência e Círculo',
        'Polígonos Regulares', 'Áreas e Perímetros',
        'Teorema de Tales', 'Teorema de Pitágoras',
      ],
      'Geometria Espacial': [
        'Prismas (Volume e Área)', 'Pirâmides (Volume e Área)',
        'Cilindros', 'Cones', 'Esferas', 'Poliedros e Euler',
        'Troncos de Pirâmide e Cone',
      ],
      'Geometria Analítica': [
        'Ponto no Plano Cartesiano', 'Distância entre Pontos',
        'Equação da Reta', 'Posição Relativa entre Retas',
        'Distância Ponto-Reta', 'Equação da Circunferência',
        'Parábola, Elipse e Hipérbole (Cônicas)', 'Vetores',
      ],
      'Combinatória e Probabilidade': [
        'Princípio Fundamental da Contagem', 'Fatorial',
        'Arranjo Simples', 'Permutação Simples e com Repetição',
        'Combinação Simples', 'Probabilidade Simples',
        'Probabilidade Condicional', 'Probabilidade com Complementar',
        'Distribuição Binomial',
      ],
      'Estatística': [
        'Média Aritmética', 'Média Ponderada', 'Mediana', 'Moda',
        'Desvio Padrão e Variância', 'Gráficos (Barras, Pizza, Histograma)',
        'Tabelas de Frequência', 'Quartis e Percentis',
      ],
    },
    'Língua Portuguesa': {
      'Interpretação de Texto': [
        'Localização de Informações Explícitas', 'Inferência e Informação Implícita',
        'Tema e Ideia Principal', 'Tipos de Texto (Narrativo, Descritivo, Expositivo, Argumentativo)',
        'Gêneros Textuais', 'Progressão e Coesão Textual', 'Intertextualidade',
        'Intencionalidade e Argumentação',
      ],
      'Gramática': [
        'Classes de Palavras (Substantivo, Adjetivo, Verbo, etc.)',
        'Morfologia (Formação de Palavras)', 'Sintaxe (Sujeito e Predicado)',
        'Complementos Verbais e Nominais', 'Adjuntos e Aposto',
        'Concordância Verbal', 'Concordância Nominal',
        'Regência Verbal', 'Regência Nominal', 'Crase',
        'Pontuação', 'Ortografia e Acentuação',
      ],
      'Figuras de Linguagem': [
        'Metáfora', 'Metonímia', 'Personificação (Prosopopeia)',
        'Hipérbole', 'Eufemismo', 'Ironia', 'Antítese e Paradoxo',
        'Comparação (Símile)', 'Aliteração e Assonância', 'Elipse e Zeugma',
      ],
      'Variação Linguística': [
        'Variedades Regionais (Dialetos)', 'Variedades Sociais',
        'Linguagem Formal e Informal', 'Norma Culta e Norma Popular',
        'Preconceito Linguístico',
      ],
      'Semântica': [
        'Sinonímia e Antonímia', 'Polissemia', 'Ambiguidade',
        'Denotação e Conotação', 'Campo Semântico e Lexical',
        'Neologismo e Arcaísmo',
      ],
    },
    'Literatura': {
      'Trovadorismo e Humanismo': [
        'Cantigas de Amor e de Amigo', 'Cantigas de Escárnio e Maldizer',
        'Gil Vicente e o Teatro Medieval', 'Prosa Medieval',
      ],
      'Classicismo': [
        'Camões — Sonetos Líricos', 'Os Lusíadas (Estrutura e Temas)',
        'Épica e Lírica Renascentista',
      ],
      'Barroco e Arcadismo': [
        'Gregório de Matos', 'Padre Antônio Vieira', 'Características do Barroco',
        'Arcadismo (Contexto e Características)', 'Tomás António Gonzaga',
        'Cláudio Manuel da Costa',
      ],
      'Romantismo': [
        'Características Gerais do Romantismo', 'Geração Byroniana/Ultra-Romântica',
        'Geração Condoreira', 'Indianismo — José de Alencar',
        'Romance Urbano e Regional', 'Castro Alves e o Abolicionismo',
      ],
      'Realismo e Naturalismo': [
        'Machado de Assis — Fase Realista', 'Memórias Póstumas de Brás Cubas',
        'Dom Casmurro', 'Aluísio de Azevedo — O Cortiço',
        'Eça de Queirós', 'Diferença entre Realismo e Naturalismo',
      ],
      'Parnasianismo e Simbolismo': [
        'Olavo Bilac e o Parnasianismo', 'Cruz e Sousa',
        'Alphonsus de Guimaraens', 'Características do Simbolismo',
      ],
      'Modernismo': [
        'Semana de Arte Moderna de 1922', '1ª Geração Modernista (Oswald, Mário de Andrade)',
        '2ª Geração (Drummond, Cecília Meireles, Murilo Mendes)',
        '3ª Geração (Guimarães Rosa, Clarice Lispector)',
        'Concretismo e Poesia Visual',
      ],
      'Literatura Contemporânea': [
        'João Guimarães Rosa — Grande Sertão: Veredas',
        'Clarice Lispector', 'Carlos Drummond de Andrade',
        'Literatura Marginal e Periférica',
      ],
    },
    'Redação': {
      'Dissertação Argumentativa': [
        'Leitura e Análise da Proposta', 'Tese e Argumentação',
        'Introdução (Tipos: Citação, Dados, Histórica, Conceitual)',
        'Desenvolvimento e Coerência', 'Proposta de Intervenção (ENEM)',
        'Conclusão',
      ],
      'Coesão e Coerência': [
        'Conectivos Adversativos, Conclusivos, Explicativos',
        'Progressão Temática', 'Retomada Referencial (Pronomes)',
        'Coerência Lógica e Progressão',
      ],
      'Repertório Cultural': [
        'Como Citar Filósofos e Pensadores', 'Como Usar Dados e Estatísticas',
        'Como Referenciar Obras Literárias', 'Repertório Científico',
      ],
    },
    'História': {
      'Brasil Colonial': [
        'Período Pré-Colonial', 'Tratado de Tordesilhas',
        'Capitanias Hereditárias e Governo Geral', 'Invasões Francesas e Holandesas',
        'Entradas, Bandeiras e Expansão Territorial', 'Escravidão Indígena e Africana',
        'Economia Colonial (Ciclos)', 'Igreja e Jesuítas no Brasil Colonial',
      ],
      'Brasil Imperial': [
        'Processo de Independência do Brasil', 'Primeiro Reinado (D. Pedro I)',
        'Período Regencial e Revoltas', 'Segundo Reinado (D. Pedro II)',
        'Crise do Império', 'Abolição da Escravatura (Lei Áurea)',
      ],
      'Brasil República': [
        'República Velha (Coronelismo, Café com Leite)',
        'Revolução de 1930 e Era Vargas', 'Estado Novo',
        'República Populista (JK, Jânio, Jango)',
        'Golpe Militar de 1964', 'Ditadura Militar e AI-5',
        'Abertura Política e Redemocratização', 'Nova República e Constituição de 1988',
        'Governos Contemporâneos',
      ],
      'Antiguidade': [
        'Mesopotâmia (Sumérios, Babilônios, Assírios)', 'Egito Antigo (Civilização e Faraós)',
        'Grécia Antiga (Polis, Democracia, Cultura)', 'Guerras Médicas e do Peloponeso',
        'Roma Antiga (Monarquia, República, Império)', 'Queda do Império Romano',
        'Fenícios, Persas e Hebreus',
      ],
      'Idade Média': [
        'Feudalismo (Estrutura Social e Econômica)', 'Igreja Católica Medieval',
        'Cruzadas', 'Bizâncio e o Império Islâmico',
        'Formação dos Estados Nacionais Europeus', 'Crise do Século XIV',
      ],
      'Idade Moderna': [
        'Renascimento Cultural e Científico', 'Reforma Protestante (Lutero, Calvino)',
        'Contrarreforma e Inquisição', 'Absolutismo Monárquico',
        'Expansão Marítima Europeia', 'Iluminismo',
      ],
      'Revoluções Burguesas': [
        'Revolução Inglesa (Puritana e Gloriosa)', 'Revolução Americana',
        'Revolução Francesa (Fases)', 'Napoleão Bonaparte',
        'Independências na América Latina',
      ],
      'Imperialismo e Guerras Mundiais': [
        'Imperialismo Europeu na África e Ásia', 'Causas da Primeira Guerra Mundial',
        'Primeira Guerra Mundial (1914-1918)', 'Revolução Russa (1917)',
        'Período Entreguerras (Crise de 1929, Fascismo, Nazismo)',
        'Segunda Guerra Mundial (1939-1945)', 'Holocausto',
      ],
      'Guerra Fria e Mundo Contemporâneo': [
        'Bipolaridade EUA x URSS', 'ONU e Ordem Internacional',
        'Descolonização da África e Ásia', 'Conflitos Regionais (Coreia, Vietnã)',
        'Fim da Guerra Fria e Dissolução da URSS',
        'Globalização', 'Terrorismo Internacional', 'Multipolaridade Atual',
      ],
      'História Indígena e Africana': [
        'Povos Indígenas no Brasil (Diversidade e Direitos)',
        'África Pré-Colonial', 'Tráfico Negreiro',
        'Diáspora Africana e Resistência', 'Lei 10.639 (Cultura Afro-Brasileira)',
      ],
    },
    'Geografia': {
      'Cartografia': [
        'Projeções Cartográficas', 'Escala Numérica e Gráfica',
        'Coordenadas Geográficas (Latitude e Longitude)',
        'Fusos Horários', 'Sensoriamento Remoto e GPS', 'Mapas Temáticos',
      ],
      'Geopolítica': [
        'Territórios, Fronteiras e Soberania', 'ONU e Organismos Internacionais',
        'Blocos Econômicos (Mercosul, UE, NAFTA)', 'BRICS e Países Emergentes',
        'Conflitos Internacionais Atuais', 'Neocolonialismo',
      ],
      'Climatologia': [
        'Elementos e Fatores do Clima', 'Massas de Ar no Brasil',
        'Tipos Climáticos Mundiais', 'Climas do Brasil',
        'Mudanças Climáticas e Efeito Estufa', 'El Niño e La Niña',
        'Ilhas de Calor Urbanas',
      ],
      'Geomorfologia': [
        'Formação do Relevo Terrestre', 'Relevo Brasileiro (Classificação)',
        'Agentes Externos (Erosão, Intemperismo)', 'Tipos de Solo',
        'Desertificação',
      ],
      'Hidrografia': [
        'Bacias Hidrográficas do Brasil', 'Rios Brasileiros (Regimes e Usos)',
        'Aquífero Guarani', 'Oceanos e Mares', 'Recursos Hídricos e Crise da Água',
      ],
      'Urbanização': [
        'Crescimento Urbano Mundial', 'Urbanização Brasileira (Histórico)',
        'Problemas Urbanos (Favelização, Segregação)', 'Megalópoles e Metropolização',
        'Redes Urbanas e Hierarquia', 'Movimentos Pendulares',
      ],
      'Agropecuária e Industrialização': [
        'Revolução Verde', 'Agronegócio Brasileiro',
        'Modernização Agrícola e Conflitos no Campo',
        'Industrialização Mundial (Primeira e Segunda Revolução Industrial)',
        'Industrialização Brasileira', 'Desindustrialização e Neoliberalismo',
        'Indústria 4.0',
      ],
      'Questões Ambientais': [
        'Desmatamento (Amazônia e Cerrado)', 'Queimadas e Incêndios',
        'Biodiversidade e Extinção de Espécies',
        'Recursos Hídricos e Poluição', 'Energia Renovável e Não Renovável',
        'Protocolo de Kyoto e Acordo de Paris',
      ],
      'População': [
        'Crescimento Populacional Mundial', 'Teoria Malthusiana',
        'Transição Demográfica', 'Migrações Internacionais',
        'Migrações no Brasil', 'IDH e Desigualdade Social',
        'Pirâmides Etárias', 'Questões Étnico-Raciais',
      ],
    },
    'Filosofia': {
      'Filosofia Antiga': [
        'Pré-Socráticos (Tales, Heráclito, Parmênides)',
        'Sócrates e o Método Maiêutico', 'Platão e o Mundo das Ideias',
        'Aristóteles e a Lógica', 'Epicurismo e Estoicismo', 'Ceticismo',
      ],
      'Filosofia Medieval': [
        'Patrística (Santo Agostinho)', 'Escolástica (São Tomás de Aquino)',
        'Fé e Razão', 'Nominalismo e Realismo',
      ],
      'Filosofia Moderna': [
        'Bacon e o Método Indutivo', 'Descartes e o Racionalismo',
        'Locke, Berkeley e Hume (Empirismo)', 'Espinosa e Leibniz',
        'Kant e o Criticismo', 'Contrato Social (Hobbes, Locke, Rousseau)',
        'Iluminismo Filosófico',
      ],
      'Filosofia Contemporânea': [
        'Hegel e a Dialética', 'Marx e o Materialismo Histórico',
        'Nietzsche e a Crítica à Moral', 'Existencialismo (Sartre, Camus)',
        'Escola de Frankfurt', 'Foucault e o Poder', 'Filosofia Analítica',
      ],
      'Ética e Política': [
        'Ética nas Antigas (Virtude)', 'Ética Kantiana (Imperativo Categórico)',
        'Utilitarismo (Bentham e Mill)', 'Democracia e Cidadania',
        'Direitos Humanos', 'Ética Ambiental e Bioética',
      ],
      'Epistemologia e Lógica': [
        'Teoria do Conhecimento (Racionalismo x Empirismo)', 'Lógica Formal (Silogismo)',
        'Falácias Lógicas', 'Argumento Válido e Verdadeiro', 'Filosofia da Ciência',
      ],
    },
    'Sociologia': {
      'Fundamentos da Sociologia': [
        'Durkheim e o Fato Social', 'Weber e a Ação Social',
        'Marx e a Luta de Classes', 'Método Sociológico',
        'Imaginação Sociológica (Mills)',
      ],
      'Trabalho e Sociedade': [
        'Capitalismo e suas Fases', 'Alienação e Mais-Valia',
        'Fordismo e Taylorismo', 'Toyotismo e Acumulação Flexível',
        'Mercado de Trabalho Atual', 'Desemprego Estrutural',
        'Trabalho Informal e Uberização',
      ],
      'Estratificação Social': [
        'Classes Sociais no Capitalismo', 'Mobilidade Social',
        'Castas e Estamentos', 'Desigualdade Social no Brasil',
        'Índice de Gini',
      ],
      'Cultura e Identidade': [
        'Conceito de Cultura', 'Indústria Cultural (Adorno e Horkheimer)',
        'Etnocentrismo e Relativismo Cultural', 'Identidade Nacional',
        'Multiculturalismo e Diversidade',
      ],
      'Movimentos Sociais': [
        'Movimentos Trabalhistas', 'Feminismo e Movimentos de Mulheres',
        'Movimento Negro no Brasil', 'Movimentos Indígenas',
        'Movimentos LGBTQIA+', 'Movimentos Ambientalistas',
      ],
      'Democracia e Cidadania': [
        'Conceito de Estado e Poder', 'Constituição Brasileira de 1988',
        'Partidos Políticos e Eleições', 'Participação Popular e Democracia Direta',
        'Direitos Civis, Políticos e Sociais',
      ],
    },
    'Inglês': {
      'Interpretação de Texto em Inglês': [
        'Inferência e Vocabulário em Contexto', 'Texto Publicitário em Inglês',
        'Texto de Opinião (Opinion Text)', 'Texto Científico e Acadêmico',
        'Gráficos e Infográficos em Inglês',
      ],
      'Gramática Inglesa': [
        'Tempos Verbais (Present, Past, Future, Perfect)',
        'Voz Passiva', 'Orações Relativas (Relative Clauses)',
        'Conectivos e Coesão', 'Verbos Modais', 'Condicional (If Clauses)',
        'Reported Speech',
      ],
      'Falsos Cognatos': [
        'Principais False Friends', 'Vocabulário que Engana',
        'Como Deduzir Significado pelo Contexto',
      ],
    },
    'Espanhol': {
      'Interpretação de Texto em Espanhol': [
        'Vocabulário em Contexto', 'Texto Literário em Espanhol',
        'Texto Jornalístico e Publicitário',
      ],
      'Gramática Espanhola': [
        'Ser vs Estar', 'Por vs Para', 'Verbos Irregulares',
        'Subjuntivo', 'Pronomes e Artigos',
      ],
    },
  };

  let topicsNaoEncontrados = [];
  let subtopicsInseridos = 0;

  for (const [subjectName, topicsData] of Object.entries(subtopicsMap)) {
    const subject = await Subject.findOne({ where: { name: subjectName } });
    if (!subject) {
      console.log(`   ⚠️  Matéria "${subjectName}" não encontrada no banco.`);
      continue;
    }

    for (const [topicName, subtopicNames] of Object.entries(topicsData)) {
      const topic = await Topic.findOne({ where: { name: topicName, subject_id: subject.id } });
      if (!topic) {
        topicsNaoEncontrados.push(`${subjectName} → ${topicName}`);
        continue;
      }

      for (const stName of subtopicNames) {
        const [, created] = await Subtopic.findOrCreate({
          where: { name: stName, topic_id: topic.id },
          defaults: { name: stName, topic_id: topic.id },
        });
        if (created) subtopicsInseridos++;
      }
    }
  }

  if (topicsNaoEncontrados.length > 0) {
    console.log(`\n   ⚠️  Tópicos não encontrados (rode o seed completo primeiro):`);
    topicsNaoEncontrados.forEach(t => console.log(`      - ${t}`));
  }

  console.log(`\n✅  Concluído!`);
  console.log(`   → ${subtopicsInseridos} subtópicos inseridos`);

  await sequelize.close();
}

seedVestibulares().catch(err => {
  console.error('❌  Erro:', err.message);
  process.exit(1);
});
