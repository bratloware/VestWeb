import 'dotenv/config';
import bcrypt from 'bcrypt';
import sequelize from './index.js';

// Import all models (triggers associations)
import {
  Student, Banner, Testimonial, InstitutionalVideo,
  Subject, Topic, Subtopic, Vestibular, Question, QuestionVestibular, Alternative,
  Simulation, SimulationQuestion, QuestionSession, Answer,
  Video, VideoProgress, FavoriteVideo,
  Mentor, MentoringSession,
  StudyEvent,
  Post, Comment, Like,
  Points, Badge, StudentBadge, Streak,
} from './models/index.js';

// ─── helpers ────────────────────────────────────────────────────────────────
const hash = (pwd) => bcrypt.hash(pwd, 10);

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const future = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};
const past = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

// ─── main ────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🔄  Conectando ao banco...');
  await sequelize.authenticate();
  console.log('✅  Conexão OK');

  console.log('🔄  Sincronizando tabelas (force: true)...');
  await sequelize.sync({ force: true });
  console.log('✅  Tabelas criadas');

  // ── 1. STUDENTS ────────────────────────────────────────────────────────────
  console.log('🌱  Criando alunos...');

  const studentData = [
    { name: 'Admin VestWeb',      email: 'admin@VestWeb.com',     enrollment: 'ADM001', role: 'admin',   avatar_url: 'https://i.pravatar.cc/150?img=1' },
    { name: 'Prof. Ana Lima',        email: 'ana.lima@VestWeb.com',  enrollment: 'TCH001', role: 'teacher', avatar_url: 'https://i.pravatar.cc/150?img=5',  specialty: 'Biologia',  bio: 'Especialista em Biologia para o ENEM com foco em genética e ecologia.',      experience_years: 10 },
    { name: 'Prof. Carlos Braga',    email: 'carlos@VestWeb.com',    enrollment: 'TCH002', role: 'teacher', avatar_url: 'https://i.pravatar.cc/150?img=12', specialty: 'Química',   bio: 'Mestre em Química Orgânica pela USP, apaixonado por simplificar o difícil.',  experience_years: 8  },
    { name: 'Prof. Marta Fonseca',   email: 'marta@VestWeb.com',     enrollment: 'TCH003', role: 'teacher', avatar_url: 'https://i.pravatar.cc/150?img=20', specialty: 'Física',    bio: 'Referência em Física para vestibulares de medicina há mais de uma década.',   experience_years: 12 },
    { name: 'Prof. Fernanda Torres', email: 'fernanda@VestWeb.com',  enrollment: 'TCH004', role: 'teacher', avatar_url: 'https://i.pravatar.cc/150?img=25', specialty: 'Matemática',bio: 'Transforma a Matemática em algo acessível e objetivo para o vestibular.',     experience_years: 7  },
    { name: 'Prof. Ricardo Moura',   email: 'ricardo@VestWeb.com',   enrollment: 'TCH005', role: 'teacher', avatar_url: 'https://i.pravatar.cc/150?img=15', specialty: 'Português', bio: 'Especialista em redação e interpretação de texto para o ENEM.',              experience_years: 9  },
    { name: 'Prof. Vocês são mlks',  email: 'prof1@VestWeb.com',     enrollment: 'TCH006', role: 'teacher', avatar_url: 'https://i.pravatar.cc/150?img=30', specialty: 'História',  bio: 'Apaixonado por história do Brasil e questões de ciências humanas do ENEM.',  experience_years: 6  },
    { name: 'Prof. Molina',          email: 'prof2@VestWeb.com',     enrollment: 'TCH007', role: 'teacher', avatar_url: 'https://i.pravatar.cc/150?img=35', specialty: 'Geografia', bio: 'Especialista em geopolítica e geografia física para vestibulares.',           experience_years: 5  },
    { name: 'Prof. Franscisco',      email: 'prof3@VestWeb.com',     enrollment: 'TCH008', role: 'teacher', avatar_url: 'https://i.pravatar.cc/150?img=40', specialty: 'Inglês',    bio: 'Fluente em 3 idiomas, foca em inglês instrumental para provas de medicina.',  experience_years: 11 },
    { name: 'João Silva',         email: 'joao@email.com',        enrollment: 'ALU001', role: 'student', avatar_url: 'https://i.pravatar.cc/150?img=33' },
    { name: 'Maria Souza',        email: 'maria@email.com',       enrollment: 'ALU002', role: 'student', avatar_url: 'https://i.pravatar.cc/150?img=47' },
    { name: 'Pedro Alves',        email: 'pedro@email.com',       enrollment: 'ALU003', role: 'student', avatar_url: 'https://i.pravatar.cc/150?img=52' },
    { name: 'Larissa Costa',      email: 'larissa@email.com',     enrollment: 'ALU004', role: 'student', avatar_url: 'https://i.pravatar.cc/150?img=44' },
    { name: 'Rafael Mendes',      email: 'rafael@email.com',      enrollment: 'ALU005', role: 'student', avatar_url: 'https://i.pravatar.cc/150?img=60' },
    { name: 'Camila Rocha',       email: 'camila@email.com',      enrollment: 'ALU006', role: 'student', avatar_url: 'https://i.pravatar.cc/150?img=41' },
    { name: 'Lucas Ferreira',     email: 'lucas@email.com',       enrollment: 'ALU007', role: 'student', avatar_url: 'https://i.pravatar.cc/150?img=68' },
    { name: 'Beatriz Nunes',      email: 'beatriz@email.com',     enrollment: 'ALU008', role: 'student', avatar_url: 'https://i.pravatar.cc/150?img=49' },
  ];

  const students = await Promise.all(
    studentData.map(async (s) => Student.create({ ...s, password_hash: await hash('VestWeb123') }))
  );

  const [admin, teacher1, teacher2, teacher3, ...students_only] = students;
  console.log(`   → ${students.length} alunos criados  (senha padrão: VestWeb123)`);

  // ── 2. BANNERS ─────────────────────────────────────────────────────────────
  console.log('🌱  Criando banners...');
  await Banner.bulkCreate([
    { image_url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1600', title: 'Sua aprovação começa aqui', subtitle: 'O melhor cursinho pré-vestibular para medicina do Brasil.', order: 1, active: true },
    { image_url: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=1600', title: 'Estude com os melhores',        subtitle: 'Professores especializados em medicina e ENEM.',          order: 2, active: true },
    { image_url: 'https://images.unsplash.com/photo-1588776814546-1ffbb2c1e9d4?w=1600', title: 'Questões comentadas diárias',   subtitle: 'Mais de 5.000 questões com gabarito e explicação.',     order: 3, active: true },
  ]);
  console.log('   → 3 banners criados');

  // ── 3. TESTIMONIALS ────────────────────────────────────────────────────────
  console.log('🌱  Criando depoimentos...');
  await Testimonial.bulkCreate([
    { name: 'Ana Paula Ramos',    photo_url: 'https://i.pravatar.cc/150?img=23', course: 'Medicina',           university: 'USP',     text: 'O VestWeb foi fundamental na minha aprovação. A metodologia de questões e simulados me deu toda a segurança que precisava!',             active: true },
    { name: 'Gabriel Torres',    photo_url: 'https://i.pravatar.cc/150?img=70', course: 'Medicina',           university: 'UNIFESP', text: 'Estudei por 1 ano no VestWeb e passei na primeira tentativa. Os professores são incríveis e o material é muito bem feito.',           active: true },
    { name: 'Fernanda Lopes',    photo_url: 'https://i.pravatar.cc/150?img=25', course: 'Medicina',           university: 'UNICAMP', text: 'A plataforma é completa demais! VestWebFlix, simulados, calendário... tudo integrado me ajudou muito a organizar meus estudos.',          active: true },
    { name: 'Bruno Carvalho',    photo_url: 'https://i.pravatar.cc/150?img=65', course: 'Biomedicina',        university: 'UFRJ',    text: 'Mesmo não sendo medicina, os conteúdos do VestWeb foram perfeitos para minha área. Super recomendo!',                                 active: true },
    { name: 'Isabela Martins',   photo_url: 'https://i.pravatar.cc/150?img=36', course: 'Medicina',           university: 'FMUSP',   text: 'As mentorias foram o diferencial. Poder conversar com médicos e estudantes aprovados me deu uma visão completamente diferente.',       active: true },
    { name: 'Thiago Nascimento', photo_url: 'https://i.pravatar.cc/150?img=59', course: 'Medicina Veterinária', university: 'UNESP', text: 'Excelente plataforma! O sistema de gamificação com pontos e streaks me manteve motivado durante toda a preparação.',                 active: true },
  ]);
  console.log('   → 6 depoimentos criados');

  // ── 4. INSTITUTIONAL VIDEO ─────────────────────────────────────────────────
  console.log('🌱  Criando vídeo institucional...');
  await InstitutionalVideo.create({
    youtube_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    title: 'Conheça o VestWeb — A plataforma que transforma sua preparação',
  });

  // ── 5. VESTIBULARES ────────────────────────────────────────────────────────
  console.log('🌱  Criando vestibulares...');

  const vestibularesData = [
    // ── Principais vestibulares (featured) ──────────────────────────────────
    {
      name: 'ENEM',
      full_name: 'Exame Nacional do Ensino Médio',
      institution: 'INEP / MEC',
      state: null,
      description: 'O mais usado do Brasil — abre mais portas. Porta de entrada para universidades federais via SISU, bolsas pelo PROUNI e financiamento pelo FIES. Cobrado por quase todas as faculdades públicas e privadas do país.',
      priority: 1,
      is_featured: true,
    },
    {
      name: 'FUVEST',
      full_name: 'Fundação Universitária para o Vestibular',
      institution: 'Universidade de São Paulo (USP)',
      state: 'SP',
      description: 'Um dos mais difíceis e tradicionais do Brasil. Principal porta de entrada para a USP, a universidade mais bem ranqueada da América Latina. Exige domínio aprofundado de conteúdo e excelente capacidade de redação.',
      priority: 2,
      is_featured: true,
    },
    {
      name: 'UNICAMP',
      full_name: 'Vestibular da Universidade Estadual de Campinas',
      institution: 'UNICAMP',
      state: 'SP',
      description: 'Difícil e tradicional, reconhecido por questões interdisciplinares e criativas que exigem raciocínio além da memorização. A UNICAMP é referência em pesquisa e inovação no Brasil.',
      priority: 3,
      is_featured: true,
    },
    {
      name: 'UNESP',
      full_name: 'Vestibular da Universidade Estadual Paulista',
      institution: 'UNESP / VUNESP',
      state: 'SP',
      description: 'Nível intermediário — equilibrado em dificuldade e abrangência de conteúdo. Boa opção para quem busca uma universidade estadual de qualidade sem o nível extremo de FUVEST e UNICAMP.',
      priority: 4,
      is_featured: true,
    },
    {
      name: 'UNB',
      full_name: 'Processo Seletivo da Universidade de Brasília',
      institution: 'Universidade de Brasília (UnB)',
      state: 'DF',
      description: 'Estilo único com questões do tipo "pegadinha" — exige atenção redobrada aos enunciados e à interpretação. Principal universidade do Centro-Oeste, aceita ENEM/SISU e tem processo seletivo próprio.',
      priority: 5,
      is_featured: true,
    },
    {
      name: 'PUC-SP',
      full_name: 'Vestibular da PUC de São Paulo',
      institution: 'Pontifícia Universidade Católica de São Paulo',
      state: 'SP',
      description: 'Privada, mais acessível em termos de dificuldade. Aceita ENEM e tem processo seletivo próprio. Boa opção para quem busca ensino de qualidade na rede privada paulista.',
      priority: 6,
      is_featured: true,
    },
    {
      name: 'PUC-RIO',
      full_name: 'Vestibular da PUC do Rio de Janeiro',
      institution: 'Pontifícia Universidade Católica do Rio de Janeiro',
      state: 'RJ',
      description: 'Privada, mais acessível em termos de dificuldade. Referência em ensino privado no Rio de Janeiro, aceita ENEM e tem processo seletivo próprio com questões objetivas e discursivas.',
      priority: 7,
      is_featured: true,
    },
    // ── Demais vestibulares ──────────────────────────────────────────────────
    { name: 'UFMG',      full_name: 'Vestibular da Universidade Federal de Minas Gerais',       institution: 'UFMG',   state: 'MG', description: 'Uma das maiores universidades federais do Brasil, com vestibular próprio e SISU.',                        priority: null, is_featured: false },
    { name: 'UFRJ',      full_name: 'Vestibular da Universidade Federal do Rio de Janeiro',     institution: 'UFRJ',   state: 'RJ', description: 'Maior universidade federal do Brasil, aceita ENEM/SISU e tem processo seletivo próprio.',               priority: null, is_featured: false },
    { name: 'UFRGS',     full_name: 'Vestibular da Universidade Federal do Rio Grande do Sul',  institution: 'UFRGS',  state: 'RS', description: 'Principal universidade do Sul do Brasil, com vestibular próprio e ENEM/SISU.',                          priority: null, is_featured: false },
    { name: 'UERJ',      full_name: 'Exame de Qualificação da Universidade do Estado do Rio de Janeiro', institution: 'UERJ', state: 'RJ', description: 'Vestibular próprio da UERJ, tradicional no Rio de Janeiro.',                              priority: null, is_featured: false },
    { name: 'MACKENZIE', full_name: 'Vestibular da Universidade Presbiteriana Mackenzie',       institution: 'Universidade Presbiteriana Mackenzie', state: 'SP', description: 'Uma das maiores universidades privadas de São Paulo, aceita ENEM.', priority: null, is_featured: false },
    { name: 'UFSC',      full_name: 'Vestibular da Universidade Federal de Santa Catarina',     institution: 'UFSC',   state: 'SC', description: 'Principal universidade federal de Santa Catarina.',                                                   priority: null, is_featured: false },
    { name: 'UEL',       full_name: 'Vestibular da Universidade Estadual de Londrina',          institution: 'UEL / COPS', state: 'PR', description: 'Uma das maiores universidades estaduais do Paraná.',                                         priority: null, is_featured: false },
  ];

  const vestibulares = await Vestibular.bulkCreate(vestibularesData);
  const vestibularMap = Object.fromEntries(vestibulares.map(v => [v.name, v]));
  console.log(`   → ${vestibulares.length} vestibulares criados`);

  // ── 6. SUBJECTS, TOPICS & SUBTOPICS ───────────────────────────────────────
  console.log('🌱  Criando matérias, tópicos e subtópicos...');

  const subjectsData = [
    {
      name: 'Biologia',
      topics: [
        { name: 'Citologia', subtopics: ['Membrana Plasmática', 'Organelas Celulares', 'Mitose', 'Meiose', 'Ciclo Celular', 'Transporte Celular'] },
        { name: 'Genética', subtopics: ['Leis de Mendel', 'Herança Ligada ao Sexo', 'Mutações', 'Biotecnologia', 'Engenharia Genética', 'Heranças Não Mendelianas'] },
        { name: 'Ecologia', subtopics: ['Cadeias Alimentares', 'Ciclos Biogeoquímicos', 'Sucessão Ecológica', 'Relações Ecológicas', 'Biomas Brasileiros', 'Impactos Ambientais'] },
        { name: 'Evolução', subtopics: ['Darwinismo', 'Neodarwinismo', 'Especiação', 'Evidências da Evolução', 'Origem da Vida'] },
        { name: 'Embriologia', subtopics: ['Fecundação', 'Segmentação', 'Gastrulação', 'Anexos Embrionários', 'Organogênese'] },
        { name: 'Histologia', subtopics: ['Tecido Epitelial', 'Tecido Conjuntivo', 'Tecido Muscular', 'Tecido Nervoso'] },
        { name: 'Fisiologia Humana', subtopics: ['Sistema Digestório', 'Sistema Circulatório', 'Sistema Respiratório', 'Sistema Nervoso', 'Sistema Endócrino', 'Sistema Imunológico'] },
        { name: 'Botânica', subtopics: ['Morfologia Vegetal', 'Fisiologia Vegetal', 'Fotossíntese', 'Reprodução Vegetal', 'Classificação das Plantas'] },
        { name: 'Microbiologia', subtopics: ['Vírus', 'Bactérias', 'Fungos', 'Protozoários'] },
      ],
    },
    {
      name: 'Química',
      topics: [
        { name: 'Química Orgânica', subtopics: ['Funções Oxigenadas', 'Funções Nitrogenadas', 'Hidrocarbonetos', 'Isomeria', 'Reações Orgânicas', 'Polímeros', 'Bioquímica'] },
        { name: 'Química Inorgânica', subtopics: ['Ácidos e Bases', 'Sais', 'Óxidos', 'Reações Inorgânicas', 'Nomenclatura Inorgânica'] },
        { name: 'Físico-Química', subtopics: ['Estequiometria', 'Gases', 'Termoquímica', 'Cinética Química', 'Equilíbrio Químico'] },
        { name: 'Eletroquímica', subtopics: ['Oxidação e Redução', 'Pilhas e Baterias', 'Eletrólise', 'Potencial de Eletrodo'] },
        { name: 'Soluções', subtopics: ['Concentração de Soluções', 'Propriedades Coligativas', 'pH e pOH', 'Diluição e Mistura'] },
        { name: 'Radioatividade', subtopics: ['Tipos de Radiação', 'Decaimento Radioativo', 'Fissão e Fusão Nuclear', 'Aplicações da Radioatividade'] },
      ],
    },
    {
      name: 'Física',
      topics: [
        { name: 'Mecânica', subtopics: ['Cinemática', 'Dinâmica', 'Trabalho e Energia', 'Quantidade de Movimento', 'Gravitação Universal', 'Hidrostática'] },
        { name: 'Termodinâmica', subtopics: ['Temperatura e Calor', 'Dilatação Térmica', 'Calorimetria', 'Leis da Termodinâmica', 'Máquinas Térmicas'] },
        { name: 'Óptica', subtopics: ['Reflexão', 'Refração', 'Lentes e Espelhos', 'Óptica Geométrica', 'Cor e Luz'] },
        { name: 'Eletromagnetismo', subtopics: ['Eletrostática', 'Eletrodinâmica', 'Circuitos Elétricos', 'Magnetismo', 'Indução Eletromagnética'] },
        { name: 'Ondulatória', subtopics: ['Natureza das Ondas', 'Som', 'Efeito Doppler', 'Ondas Estacionárias', 'Ondas Eletromagnéticas'] },
        { name: 'Física Moderna', subtopics: ['Relatividade', 'Efeito Fotoelétrico', 'Dualidade Onda-Partícula', 'Física Nuclear', 'Modelos Atômicos'] },
      ],
    },
    {
      name: 'Matemática',
      topics: [
        { name: 'Álgebra', subtopics: ['Equações do 1º Grau', 'Equações do 2º Grau', 'Sistemas Lineares', 'Progressões Aritméticas', 'Progressões Geométricas', 'Polinômios', 'Matrizes e Determinantes'] },
        { name: 'Funções', subtopics: ['Função do 1º Grau', 'Função do 2º Grau', 'Função Exponencial', 'Função Logarítmica', 'Função Modular', 'Função Trigonométrica'] },
        { name: 'Trigonometria', subtopics: ['Razões Trigonométricas', 'Lei dos Senos e Cossenos', 'Identidades Trigonométricas', 'Equações Trigonométricas'] },
        { name: 'Geometria Plana', subtopics: ['Triângulos', 'Quadriláteros', 'Circunferência', 'Polígonos', 'Áreas e Perímetros'] },
        { name: 'Geometria Espacial', subtopics: ['Prismas', 'Pirâmides', 'Cilindros', 'Cones', 'Esferas', 'Poliedros de Platão'] },
        { name: 'Geometria Analítica', subtopics: ['Ponto e Reta no Plano', 'Circunferência Analítica', 'Cônicas', 'Vetores'] },
        { name: 'Combinatória e Probabilidade', subtopics: ['Princípio Fundamental da Contagem', 'Permutação', 'Combinação', 'Arranjo', 'Probabilidade Simples', 'Probabilidade Condicional'] },
        { name: 'Estatística', subtopics: ['Média, Mediana e Moda', 'Desvio Padrão', 'Gráficos e Tabelas', 'Frequência e Distribuição'] },
      ],
    },
    {
      name: 'Língua Portuguesa',
      topics: [
        { name: 'Interpretação de Texto', subtopics: ['Ideia Principal', 'Inferência', 'Coerência Textual', 'Tipos de Texto', 'Argumentação'] },
        { name: 'Gramática', subtopics: ['Morfologia', 'Sintaxe', 'Regência e Crase', 'Concordância Verbal e Nominal', 'Pontuação', 'Ortografia'] },
        { name: 'Figuras de Linguagem', subtopics: ['Metáfora e Metonímia', 'Personificação', 'Hipérbole e Eufemismo', 'Ironia e Antítese', 'Comparação e Aliteração'] },
        { name: 'Variação Linguística', subtopics: ['Variedades Regionais', 'Variedades Sociais', 'Linguagem Formal e Informal', 'Língua Culta e Popular'] },
        { name: 'Semântica', subtopics: ['Sinonímia e Antonímia', 'Polissemia e Ambiguidade', 'Denotação e Conotação', 'Campo Semântico'] },
      ],
    },
    {
      name: 'Literatura',
      topics: [
        { name: 'Trovadorismo e Humanismo', subtopics: ['Cantigas', 'Prosa Medieval', 'Gil Vicente'] },
        { name: 'Classicismo', subtopics: ['Camões', 'Lírica e Épica', 'Os Lusíadas'] },
        { name: 'Barroco e Arcadismo', subtopics: ['Gregório de Matos', 'Padre Antônio Vieira', 'Tomás António Gonzaga', 'Cláudio Manuel da Costa'] },
        { name: 'Romantismo', subtopics: ['Prosa Romântica', 'Poesia Romântica', 'José de Alencar', 'Machado de Assis (fase)'] },
        { name: 'Realismo e Naturalismo', subtopics: ['Machado de Assis', 'Eça de Queirós', 'Aluísio de Azevedo'] },
        { name: 'Parnasianismo e Simbolismo', subtopics: ['Olavo Bilac', 'Cruz e Sousa', 'Alphonsus de Guimaraens'] },
        { name: 'Modernismo', subtopics: ['Semana de 22', 'Primeira Geração Modernista', 'Segunda Geração', 'Terceira Geração', 'Concretismo'] },
        { name: 'Literatura Contemporânea', subtopics: ['Clarice Lispector', 'João Guimarães Rosa', 'Drummond', 'Literatura Marginal'] },
      ],
    },
    {
      name: 'Redação',
      topics: [
        { name: 'Dissertação Argumentativa', subtopics: ['Introdução e Tese', 'Desenvolvimento e Argumentação', 'Conclusão e Proposta de Intervenção'] },
        { name: 'Coesão e Coerência', subtopics: ['Conectivos', 'Progressão Temática', 'Coerência Lógica'] },
        { name: 'Repertório Cultural', subtopics: ['Como Usar Referências', 'Dados e Estatísticas', 'Citações e Autores'] },
      ],
    },
    {
      name: 'História',
      topics: [
        { name: 'Brasil Colonial', subtopics: ['Pré-Colonial', 'Ciclo do Pau-Brasil', 'Capitanias Hereditárias', 'Invasões Estrangeiras', 'Período Holandês', 'Entradas e Bandeiras'] },
        { name: 'Brasil Imperial', subtopics: ['Independência do Brasil', 'Primeiro Reinado', 'Período Regencial', 'Segundo Reinado', 'Abolição da Escravatura'] },
        { name: 'Brasil República', subtopics: ['República Velha', 'Era Vargas', 'República Populista', 'Ditadura Militar', 'Redemocratização', 'Brasil Contemporâneo'] },
        { name: 'Antiguidade', subtopics: ['Grécia Antiga', 'Roma Antiga', 'Egito Antigo', 'Mesopotâmia', 'Persas e Fenícios'] },
        { name: 'Idade Média', subtopics: ['Feudalismo', 'Igreja Medieval', 'Cruzadas', 'Formação dos Estados Nacionais', 'Bizâncio e Islã'] },
        { name: 'Idade Moderna', subtopics: ['Renascimento', 'Reforma Protestante', 'Absolutismo', 'Expansão Marítima e Colonial', 'Iluminismo'] },
        { name: 'Revoluções Burguesas', subtopics: ['Revolução Inglesa', 'Revolução Americana', 'Revolução Francesa', 'Independências Latino-Americanas'] },
        { name: 'Imperialismo e Guerras Mundiais', subtopics: ['Imperialismo Europeu', 'Primeira Guerra Mundial', 'Entreguerras', 'Segunda Guerra Mundial', 'Holocausto'] },
        { name: 'Guerra Fria e Mundo Contemporâneo', subtopics: ['Bipolaridade EUA-URSS', 'Descolonização', 'Conflitos Regionais', 'Fim da Guerra Fria', 'Globalização e Terrorismo'] },
        { name: 'História Indígena e Africana', subtopics: ['Povos Indígenas no Brasil', 'África Pré-Colonial', 'Escravidão Africana', 'Diáspora Africana'] },
      ],
    },
    {
      name: 'Geografia',
      topics: [
        { name: 'Cartografia', subtopics: ['Projeções Cartográficas', 'Escalas', 'Coordenadas Geográficas', 'Fusos Horários', 'Sensoriamento Remoto'] },
        { name: 'Geopolítica', subtopics: ['Territórios e Fronteiras', 'Conflitos Internacionais', 'Organismos Internacionais', 'Blocos Econômicos'] },
        { name: 'Climatologia', subtopics: ['Elementos do Clima', 'Tipos Climáticos', 'Climas do Brasil', 'Mudanças Climáticas', 'El Niño e La Niña'] },
        { name: 'Geomorfologia', subtopics: ['Relevo Brasileiro', 'Agentes Externos', 'Solos', 'Rochas e Minerais'] },
        { name: 'Hidrografia', subtopics: ['Bacias Hidrográficas', 'Rios Brasileiros', 'Aquíferos', 'Oceanos e Mares'] },
        { name: 'Urbanização', subtopics: ['Crescimento Urbano', 'Megalópoles', 'Urbanização Brasileira', 'Problemas Urbanos', 'Redes Urbanas'] },
        { name: 'Agropecuária e Industrialização', subtopics: ['Revolução Verde', 'Agronegócio', 'Industrialização Brasileira', 'Desindustrialização'] },
        { name: 'Questões Ambientais', subtopics: ['Desmatamento', 'Desertificação', 'Biodiversidade', 'Recursos Hídricos', 'Energia Renovável'] },
        { name: 'População', subtopics: ['Crescimento Populacional', 'Migrações', 'IDH e Desigualdade', 'Pirâmides Etárias', 'Questões Étnico-Raciais'] },
      ],
    },
    {
      name: 'Filosofia',
      topics: [
        { name: 'Filosofia Antiga', subtopics: ['Pré-Socráticos', 'Sócrates e Método Socrático', 'Platão e o Idealismo', 'Aristóteles e o Empirismo'] },
        { name: 'Filosofia Medieval', subtopics: ['Patrística', 'Escolástica', 'Santo Agostinho', 'São Tomás de Aquino'] },
        { name: 'Filosofia Moderna', subtopics: ['Bacon e Descartes', 'Empirismo Inglês', 'Kant', 'Iluminismo Filosófico'] },
        { name: 'Filosofia Contemporânea', subtopics: ['Marx e o Materialismo', 'Nietzsche', 'Existencialismo', 'Filosofia Analítica', 'Pós-Modernidade'] },
        { name: 'Ética e Política', subtopics: ['Ética Clássica', 'Contrato Social', 'Direitos Humanos', 'Democracia e Cidadania', 'Ética Ambiental'] },
        { name: 'Epistemologia e Lógica', subtopics: ['Teoria do Conhecimento', 'Lógica Formal', 'Falácias', 'Argumento e Verdade'] },
      ],
    },
    {
      name: 'Sociologia',
      topics: [
        { name: 'Fundamentos da Sociologia', subtopics: ['Durkheim', 'Weber', 'Marx', 'Método Sociológico', 'Fato Social'] },
        { name: 'Trabalho e Sociedade', subtopics: ['Capitalismo', 'Alienação', 'Mercado de Trabalho', 'Desemprego', 'Sindicalismo'] },
        { name: 'Estratificação Social', subtopics: ['Classes Sociais', 'Mobilidade Social', 'Castas e Estamentos', 'Desigualdade Social no Brasil'] },
        { name: 'Cultura e Identidade', subtopics: ['Cultura Material e Imaterial', 'Indústria Cultural', 'Etnocentrismo e Relativismo', 'Identidade Nacional', 'Multiculturalismo'] },
        { name: 'Movimentos Sociais', subtopics: ['Movimentos Trabalhistas', 'Movimentos Feministas', 'Movimento Negro', 'Movimentos Indígenas', 'Movimentos LGBTQIA+'] },
        { name: 'Democracia e Cidadania', subtopics: ['Estado e Poder', 'Constituição Brasileira', 'Partidos Políticos', 'Participação Popular'] },
      ],
    },
    {
      name: 'Inglês',
      topics: [
        { name: 'Interpretação de Texto em Inglês', subtopics: ['Inferência e Vocabulário em Contexto', 'Texto Publicitário', 'Texto de Opinião', 'Texto Científico'] },
        { name: 'Gramática Inglesa', subtopics: ['Tempos Verbais', 'Voz Passiva', 'Orações Relativas', 'Conectivos', 'Modais'] },
        { name: 'Falsos Cognatos', subtopics: ['Principais False Friends', 'Vocabulário Enganoso'] },
      ],
    },
    {
      name: 'Espanhol',
      topics: [
        { name: 'Interpretação de Texto em Espanhol', subtopics: ['Vocabulário em Contexto', 'Texto Literário', 'Texto Jornalístico'] },
        { name: 'Gramática Espanhola', subtopics: ['Verbos Irregulares', 'Ser vs Estar', 'Por vs Para', 'Subjuntivo'] },
      ],
    },
  ];

  const subjects = [];
  const topicsAll = [];
  const subtopicsAll = [];

  for (const sd of subjectsData) {
    const subj = await Subject.create({ name: sd.name });
    subjects.push(subj);
    for (const topicData of sd.topics) {
      const t = await Topic.create({ name: topicData.name, subject_id: subj.id });
      topicsAll.push(t);
      for (const stName of (topicData.subtopics || [])) {
        const st = await Subtopic.create({ name: stName, topic_id: t.id });
        subtopicsAll.push(st);
      }
    }
  }
  console.log(`   → ${subjects.length} matérias, ${topicsAll.length} tópicos, ${subtopicsAll.length} subtópicos criados`);

  // ── 6. QUESTIONS & ALTERNATIVES ────────────────────────────────────────────
  console.log('🌱  Criando questões...');

  const questionData = [
    // Biologia — Citologia
    { statement: 'A membrana plasmática é constituída principalmente por uma bicamada de fosfolipídeos. Qual das alternativas abaixo descreve corretamente uma função desta membrana?', topic: 'Citologia', subtopic: 'Membrana Plasmática', difficulty: 'easy', source: 'FUVEST', year: 2022, bank: 'FUVEST', correct: 'B', alts: ['Produção de energia celular pela oxidação de glicose', 'Controle da entrada e saída de substâncias na célula', 'Síntese de proteínas a partir de aminoácidos', 'Digestão intracelular de organelas danificadas', 'Armazenamento de material genético'] },
    { statement: 'Em relação à mitose, é CORRETO afirmar que:', topic: 'Citologia', subtopic: 'Mitose', difficulty: 'medium', source: 'ENEM', year: 2021, bank: 'ENEM', correct: 'C', alts: ['Ocorre apenas em células sexuais', 'Resulta em células com metade do número de cromossomos', 'Garante a manutenção do número cromossômico nas células-filhas', 'É o processo responsável pela formação de gametas', 'Ocorre em duas etapas, ambas com divisão do núcleo'] },
    { statement: 'O retículo endoplasmático rugoso (RER) difere do retículo endoplasmático liso (REL) principalmente por:', topic: 'Citologia', subtopic: 'Organelas Celulares', difficulty: 'medium', source: 'UNICAMP', year: 2023, bank: 'UNICAMP', correct: 'A', alts: ['Possuir ribossomos aderidos à sua membrana', 'Ser responsável pelo armazenamento de cálcio', 'Sintetizar lipídeos e esteroides', 'Estar ausente em células animais', 'Estar ligado diretamente à membrana plasmática'] },
    // Genética
    { statement: 'Uma mulher portadora de daltonismo (gene recessivo ligado ao X) se casa com um homem daltônico. Qual a probabilidade de seus filhos homens serem daltônicos?', topic: 'Genética', subtopic: 'Herança Ligada ao Sexo', difficulty: 'hard', source: 'FUVEST', year: 2020, bank: 'FUVEST', correct: 'D', alts: ['25%', '0%', '75%', '50%', '100%'] },
    { statement: 'O fenômeno de dominância incompleta difere da codominância porque:', topic: 'Genética', subtopic: 'Heranças Não Mendelianas', difficulty: 'medium', source: 'ENEM', year: 2022, bank: 'ENEM', correct: 'E', alts: ['Ocorre apenas em plantas', 'Envolve genes ligados ao sexo', 'Produz um fenótipo idêntico ao parental dominante', 'Resulta em segregação 3:1 na F2', 'Gera um fenótipo intermediário entre os parentais'] },
    // Química — Orgânica
    { statement: 'A fermentação alcoólica, realizada por leveduras, transforma glicose em etanol e gás carbônico. Este processo é um exemplo de:', topic: 'Química Orgânica', subtopic: 'Reações Orgânicas', difficulty: 'easy', source: 'ENEM', year: 2021, bank: 'ENEM', correct: 'A', alts: ['Reação de oxidação incompleta de açúcares', 'Reação de combustão completa', 'Reação de polimerização da glicose', 'Oxidação aeróbica de carboidratos', 'Redução de dióxido de carbono a etanol'] },
    { statement: 'Qual das alternativas abaixo representa corretamente a fórmula geral de um éster?', topic: 'Química Orgânica', subtopic: 'Funções Oxigenadas', difficulty: 'easy', source: 'FUVEST', year: 2019, bank: 'FUVEST', correct: 'C', alts: ['R–CO–R\'', 'R–COOH', 'R–COO–R\'', 'R–OH', 'R–CO–NH2'] },
    // Física — Mecânica
    { statement: 'Um objeto é lançado horizontalmente de uma altura de 80 m com velocidade inicial de 20 m/s. Considerando g = 10 m/s², o alcance horizontal do objeto é:', topic: 'Mecânica', subtopic: 'Cinemática', difficulty: 'medium', source: 'FUVEST', year: 2022, bank: 'FUVEST', correct: 'B', alts: ['40 m', '80 m', '60 m', '100 m', '120 m'] },
    { statement: 'De acordo com a 2ª Lei de Newton, a aceleração de um corpo:', topic: 'Mecânica', subtopic: 'Dinâmica', difficulty: 'easy', source: 'ENEM', year: 2020, bank: 'ENEM', correct: 'A', alts: ['É diretamente proporcional à força resultante e inversamente proporcional à sua massa', 'É inversamente proporcional à força resultante e diretamente proporcional à sua massa', 'Independe da massa do corpo', 'É igual à força aplicada sobre o corpo', 'É sempre constante independente das forças'] },
    // Matemática
    { statement: 'A soma dos termos de uma progressão aritmética com 10 termos, primeiro termo a₁ = 3 e razão r = 2, é igual a:', topic: 'Álgebra', subtopic: 'Progressões Aritméticas', difficulty: 'medium', source: 'ENEM', year: 2023, bank: 'ENEM', correct: 'C', alts: ['100', '110', '120', '130', '140'] },
    { statement: 'Em um triângulo retângulo, a hipotenusa mede 10 cm e um cateto mede 6 cm. O outro cateto mede:', topic: 'Geometria Plana', subtopic: 'Triângulos', difficulty: 'easy', source: 'ENEM', year: 2021, bank: 'ENEM', correct: 'D', alts: ['4 cm', '5 cm', '7 cm', '8 cm', '9 cm'] },
    // Português
    { statement: 'A figura de linguagem presente no verso "O cravo brigou com a rosa" é:', topic: 'Figuras de Linguagem', subtopic: 'Personificação', difficulty: 'easy', source: 'ENEM', year: 2022, bank: 'ENEM', correct: 'A', alts: ['Personificação (prosopopeia)', 'Metáfora', 'Metonímia', 'Hipérbole', 'Antítese'] },
    { statement: 'Leia o trecho: "A vida é uma peça de teatro que não permite ensaios." A figura de linguagem predominante é:', topic: 'Figuras de Linguagem', subtopic: 'Metáfora e Metonímia', difficulty: 'easy', source: 'ENEM', year: 2021, bank: 'ENEM', correct: 'B', alts: ['Hipérbole', 'Metáfora', 'Metonímia', 'Ironia', 'Eufemismo'] },
    // História — corrigido: 'História do Brasil' → 'Brasil República'
    { statement: 'A Proclamação da República no Brasil, em 1889, foi resultado principalmente:', topic: 'Brasil República', subtopic: 'República Velha', difficulty: 'medium', source: 'ENEM', year: 2020, bank: 'ENEM', correct: 'C', alts: ['De uma revolução popular liderada por operários urbanos', 'Da pressão do movimento abolicionista após a Lei Áurea', 'Do enfraquecimento da monarquia e da insatisfação militar e das elites agrárias', 'De uma invasão estrangeira que derrubou o governo imperial', 'De um golpe liderado exclusivamente pela Igreja Católica'] },

    // ── Biologia — Citologia ───────────────────────────────────────────────
    { statement: 'Durante a meiose, a variabilidade genética é aumentada principalmente pelo processo de:', topic: 'Citologia', subtopic: 'Meiose', difficulty: 'medium', source: 'ENEM', year: 2022, bank: 'ENEM', correct: 'B', alts: ['Replicação semiconservativa do DNA', 'Permutação (crossing-over) entre cromátides homólogas', 'Divisão equacional das células-filhas', 'Condensação dos cromossomos na prófase', 'Formação do fuso acromático'] },
    { statement: 'O transporte ativo de íons através da membrana plasmática requer:', topic: 'Citologia', subtopic: 'Transporte Celular', difficulty: 'easy', source: 'UNESP', year: 2021, bank: 'UNESP', correct: 'A', alts: ['Gasto de energia (ATP) e proteínas transportadoras', 'Apenas gradiente de concentração a favor', 'Somente a bicamada lipídica sem proteínas', 'Fusão de vesículas com a membrana', 'Diferença de temperatura entre os meios'] },
    { statement: 'A interfase do ciclo celular é dividida em três fases. A síntese de DNA ocorre na fase:', topic: 'Citologia', subtopic: 'Ciclo Celular', difficulty: 'easy', source: 'FUVEST', year: 2023, bank: 'FUVEST', correct: 'C', alts: ['G1', 'G0', 'S', 'G2', 'M'] },

    // ── Biologia — Genética ────────────────────────────────────────────────
    { statement: 'Segundo a 1ª Lei de Mendel, ao cruzar duas plantas de ervilha, uma de semente amarela (AA) com outra de semente verde (aa), a geração F1 será:', topic: 'Genética', subtopic: 'Leis de Mendel', difficulty: 'easy', source: 'ENEM', year: 2019, bank: 'ENEM', correct: 'D', alts: ['100% verde (aa)', '50% amarela e 50% verde', '75% amarela e 25% verde', '100% amarela (Aa)', '50% amarela (AA) e 50% amarela (Aa)'] },
    { statement: 'Uma mutação de ponto que substitui um nucleotídeo e resulta no mesmo aminoácido é chamada de mutação:', topic: 'Genética', subtopic: 'Mutações', difficulty: 'hard', source: 'UNICAMP', year: 2022, bank: 'UNICAMP', correct: 'E', alts: ['Frameshift', 'Nonsense', 'Missense', 'Deleção', 'Silenciosa'] },

    // ── Biologia — Ecologia ────────────────────────────────────────────────
    { statement: 'Qual dos biomas brasileiros é caracterizado por vegetação xerófila, chuvas irregulares e presença da caatinga?', topic: 'Ecologia', subtopic: 'Biomas Brasileiros', difficulty: 'easy', source: 'ENEM', year: 2021, bank: 'ENEM', correct: 'B', alts: ['Cerrado', 'Caatinga', 'Pantanal', 'Mata Atlântica', 'Pampa'] },
    { statement: 'O ciclo do nitrogênio é fundamental para os seres vivos. Qual processo realizado por bactérias do gênero Rhizobium converte N₂ atmosférico em amônia (NH₃)?', topic: 'Ecologia', subtopic: 'Ciclos Biogeoquímicos', difficulty: 'medium', source: 'FUVEST', year: 2021, bank: 'FUVEST', correct: 'A', alts: ['Fixação biológica do nitrogênio', 'Nitrificação', 'Desnitrificação', 'Amonificação', 'Denitrificação'] },
    { statement: 'A relação ecológica entre o carrapato e o cão é classificada como:', topic: 'Ecologia', subtopic: 'Relações Ecológicas', difficulty: 'easy', source: 'UNESP', year: 2020, bank: 'UNESP', correct: 'C', alts: ['Mutualismo (+/+)', 'Comensalismo (+/0)', 'Parasitismo (+/–)', 'Predatismo (+/–)', 'Protocooperação (+/+)'] },

    // ── Biologia — Fisiologia Humana ───────────────────────────────────────
    { statement: 'O hormônio insulina, produzido pelo pâncreas, tem como principal função:', topic: 'Fisiologia Humana', subtopic: 'Sistema Endócrino', difficulty: 'easy', source: 'ENEM', year: 2022, bank: 'ENEM', correct: 'A', alts: ['Reduzir a glicemia ao promover a captação de glicose pelas células', 'Aumentar a glicemia ao estimular a glicogenólise', 'Estimular a produção de adrenalina pela medula adrenal', 'Controlar a pressão arterial pelos rins', 'Acelerar o metabolismo basal'] },
    { statement: 'No sistema ABO, um indivíduo do grupo O possui:', topic: 'Fisiologia Humana', subtopic: 'Sistema Imunológico', difficulty: 'medium', source: 'FUVEST', year: 2020, bank: 'FUVEST', correct: 'D', alts: ['Antígeno A e anticorpo anti-B', 'Antígenos A e B, sem anticorpos', 'Antígeno B e anticorpo anti-A', 'Nenhum antígeno ABO e anticorpos anti-A e anti-B', 'Antígeno A e nenhum anticorpo'] },

    // ── Química — Inorgânica ───────────────────────────────────────────────
    { statement: 'Segundo a teoria de Arrhenius, uma base é uma substância que, em solução aquosa, libera como único ânion:', topic: 'Química Inorgânica', subtopic: 'Ácidos e Bases', difficulty: 'easy', source: 'ENEM', year: 2020, bank: 'ENEM', correct: 'B', alts: ['H⁺', 'OH⁻', 'O²⁻', 'Cl⁻', 'HCO₃⁻'] },
    { statement: 'A equação H₂SO₄ + 2 NaOH → Na₂SO₄ + 2 H₂O representa uma reação de:', topic: 'Química Inorgânica', subtopic: 'Reações Inorgânicas', difficulty: 'easy', source: 'UNESP', year: 2022, bank: 'UNESP', correct: 'A', alts: ['Neutralização', 'Síntese', 'Análise', 'Oxirredução', 'Deslocamento'] },

    // ── Química — Físico-Química ───────────────────────────────────────────
    { statement: 'Em uma reação exotérmica, em relação ao sistema:', topic: 'Físico-Química', subtopic: 'Termoquímica', difficulty: 'medium', source: 'ENEM', year: 2021, bank: 'ENEM', correct: 'C', alts: ['A entalpia dos produtos é maior que a dos reagentes', 'O ΔH é positivo', 'O ΔH é negativo, pois o sistema libera energia', 'A energia de ativação é zero', 'A temperatura do sistema diminui'] },
    { statement: 'De acordo com a lei dos gases ideais (PV = nRT), mantendo temperatura e volume constantes, ao dobrar o número de mols de gás, a pressão:', topic: 'Físico-Química', subtopic: 'Gases', difficulty: 'easy', source: 'FUVEST', year: 2019, bank: 'FUVEST', correct: 'A', alts: ['Dobra', 'Cai à metade', 'Permanece igual', 'Quadruplica', 'Diminui 1/4'] },

    // ── Química — Eletroquímica ────────────────────────────────────────────
    { statement: 'Na eletrólise da água (2H₂O → 2H₂ + O₂), o gás hidrogênio é produzido:', topic: 'Eletroquímica', subtopic: 'Eletrólise', difficulty: 'medium', source: 'UNICAMP', year: 2021, bank: 'UNICAMP', correct: 'B', alts: ['No ânodo, por oxidação', 'No cátodo, por redução', 'No ânodo, por redução', 'No cátodo, por oxidação', 'Em ambos os eletrodos simultaneamente'] },

    // ── Física — Termodinâmica ─────────────────────────────────────────────
    { statement: 'Um objeto de alumínio com massa de 500 g é aquecido de 20°C a 70°C. Sabendo que o calor específico do alumínio é 0,9 J/(g·°C), a quantidade de calor absorvida é:', topic: 'Termodinâmica', subtopic: 'Calorimetria', difficulty: 'medium', source: 'ENEM', year: 2022, bank: 'ENEM', correct: 'C', alts: ['18.000 J', '20.000 J', '22.500 J', '25.000 J', '31.500 J'] },
    { statement: 'A 1ª Lei da Termodinâmica estabelece que a variação de energia interna de um sistema é:', topic: 'Termodinâmica', subtopic: 'Leis da Termodinâmica', difficulty: 'medium', source: 'FUVEST', year: 2020, bank: 'FUVEST', correct: 'A', alts: ['ΔU = Q – W (calor absorvido menos trabalho realizado)', 'ΔU = Q + W (calor absorvido mais trabalho recebido)', 'ΔU = 0 sempre', 'ΔU = W – Q', 'ΔU = Q × W'] },

    // ── Física — Eletromagnetismo ──────────────────────────────────────────
    { statement: 'Dois corpos eletrizados com cargas de mesmo sinal a uma distância d exercem entre si uma força F. Se a distância for reduzida à metade, a nova força será:', topic: 'Eletromagnetismo', subtopic: 'Eletrostática', difficulty: 'medium', source: 'UNESP', year: 2023, bank: 'UNESP', correct: 'D', alts: ['F/4', 'F/2', 'F', '4F', '2F'] },
    { statement: 'Em um circuito série com resistores de 10 Ω, 20 Ω e 30 Ω ligados a uma bateria de 120 V, a corrente elétrica no circuito é:', topic: 'Eletromagnetismo', subtopic: 'Circuitos Elétricos', difficulty: 'medium', source: 'ENEM', year: 2023, bank: 'ENEM', correct: 'B', alts: ['0,5 A', '2 A', '4 A', '6 A', '12 A'] },

    // ── Física — Ondulatória ───────────────────────────────────────────────
    { statement: 'O efeito Doppler explica por que o som de uma ambulância parece ter frequência maior quando ela se aproxima. Isso ocorre porque:', topic: 'Ondulatória', subtopic: 'Efeito Doppler', difficulty: 'medium', source: 'ENEM', year: 2021, bank: 'ENEM', correct: 'A', alts: ['As frentes de onda se comprimem à frente da fonte em movimento', 'A amplitude do som aumenta com a aproximação', 'A velocidade do som aumenta quando a fonte se aproxima', 'As frentes de onda se expandem à frente da fonte', 'A frequência da fonte aumenta quando ela se move'] },

    // ── Matemática — Funções ───────────────────────────────────────────────
    { statement: 'A função f(x) = 2x² – 8x + 6 tem vértice em:', topic: 'Funções', subtopic: 'Função do 2º Grau', difficulty: 'medium', source: 'ENEM', year: 2022, bank: 'ENEM', correct: 'C', alts: ['(2, 6)', '(–2, –2)', '(2, –2)', '(4, 6)', '(–4, –2)'] },
    { statement: 'Se log₂(x) = 3, então x é igual a:', topic: 'Funções', subtopic: 'Função Logarítmica', difficulty: 'easy', source: 'UNESP', year: 2022, bank: 'UNESP', correct: 'B', alts: ['6', '8', '9', '16', '3'] },
    { statement: 'Uma capital tem população que cresce segundo a função P(t) = 500.000 · (1,02)^t, onde t é o tempo em anos. O modelo de crescimento utilizado é:', topic: 'Funções', subtopic: 'Função Exponencial', difficulty: 'easy', source: 'ENEM', year: 2020, bank: 'ENEM', correct: 'A', alts: ['Crescimento exponencial com taxa de 2% ao ano', 'Crescimento linear de 2.000 habitantes por ano', 'Crescimento quadrático', 'Decrescimento exponencial', 'Crescimento constante de 500.000 por ano'] },

    // ── Matemática — Combinatória ──────────────────────────────────────────
    { statement: 'De quantas maneiras diferentes 5 pessoas podem se sentar em uma fila de 5 cadeiras?', topic: 'Combinatória e Probabilidade', subtopic: 'Permutação', difficulty: 'easy', source: 'ENEM', year: 2021, bank: 'ENEM', correct: 'D', alts: ['25', '60', '100', '120', '150'] },
    { statement: 'Uma urna contém 4 bolas vermelhas e 6 azuis. A probabilidade de sortear 2 bolas vermelhas consecutivamente sem reposição é:', topic: 'Combinatória e Probabilidade', subtopic: 'Probabilidade Condicional', difficulty: 'hard', source: 'FUVEST', year: 2022, bank: 'FUVEST', correct: 'B', alts: ['2/15', '2/15', '1/5', '4/25', '3/10'] },

    // ── Matemática — Geometria Espacial ───────────────────────────────────
    { statement: 'Um cilindro reto tem raio da base igual a 3 cm e altura igual a 10 cm. Seu volume, em cm³, é (use π ≈ 3):', topic: 'Geometria Espacial', subtopic: 'Cilindros', difficulty: 'easy', source: 'ENEM', year: 2020, bank: 'ENEM', correct: 'C', alts: ['90 cm³', '180 cm³', '270 cm³', '300 cm³', '360 cm³'] },

    // ── História ──────────────────────────────────────────────────────────
    { statement: 'A Lei Áurea, assinada em 1888, aboliu a escravidão no Brasil. Porém, críticos apontam que foi uma abolição incompleta porque:', topic: 'Brasil Imperial', subtopic: 'Abolição da Escravatura', difficulty: 'medium', source: 'ENEM', year: 2019, bank: 'ENEM', correct: 'D', alts: ['Manteve a escravidão nos estados do Norte', 'Foi aprovada apenas pela pressão britânica', 'Proibiu o trabalho dos libertos por 5 anos', 'Não previu nenhuma política de integração dos ex-escravizados', 'Libertou apenas os escravos nascidos no Brasil'] },
    { statement: 'A Revolução Francesa de 1789 foi impulsionada pelos ideais iluministas. Qual das alternativas abaixo NÃO representa um ideal iluminista?', topic: 'Revoluções Burguesas', subtopic: 'Revolução Francesa', difficulty: 'medium', source: 'UNICAMP', year: 2021, bank: 'UNICAMP', correct: 'E', alts: ['Liberdade individual', 'Igualdade perante a lei', 'Fraternidade entre os povos', 'Separação dos poderes', 'Direito divino dos reis'] },
    { statement: 'O nazismo ascendeu ao poder na Alemanha em 1933 em grande parte devido:', topic: 'Imperialismo e Guerras Mundiais', subtopic: 'Entreguerras', difficulty: 'medium', source: 'ENEM', year: 2022, bank: 'ENEM', correct: 'B', alts: ['À invasão soviética da Alemanha Oriental', 'À crise econômica pós-1929 e ao ressentimento do Tratado de Versalhes', 'Ao apoio incondicional dos Estados Unidos ao partido nazista', 'À derrota da Alemanha na Segunda Guerra Mundial', 'À expansão do comunismo que exigiu uma resposta armada'] },

    // ── Geografia ─────────────────────────────────────────────────────────
    { statement: 'O fenômeno El Niño é caracterizado pelo aquecimento anormal das águas do Oceano Pacífico equatorial. No Brasil, isso geralmente provoca:', topic: 'Climatologia', subtopic: 'El Niño e La Niña', difficulty: 'medium', source: 'ENEM', year: 2023, bank: 'ENEM', correct: 'A', alts: ['Secas no Nordeste e chuvas excessivas no Sul', 'Chuvas no Nordeste e secas no Sul', 'Aumento de temperaturas uniformes em todo o país', 'Ciclones tropicais no litoral sudeste', 'Nevascas na Região Centro-Oeste'] },
    { statement: 'A megalópole é um conceito geográfico que designa:', topic: 'Urbanização', subtopic: 'Megalópoles', difficulty: 'easy', source: 'UNESP', year: 2021, bank: 'UNESP', correct: 'C', alts: ['Uma cidade com mais de 10 milhões de habitantes', 'O maior município de um estado', 'Uma região urbana contínua formada pela fusão de metrópoles', 'O centro financeiro de um país', 'Qualquer cidade com infraestrutura moderna'] },
    { statement: 'Os blocos econômicos regionais, como o Mercosul e a União Europeia, surgiram principalmente para:', topic: 'Geopolítica', subtopic: 'Blocos Econômicos', difficulty: 'easy', source: 'ENEM', year: 2020, bank: 'ENEM', correct: 'B', alts: ['Substituir a ONU como organismo internacional', 'Facilitar o comércio e a integração entre países membros', 'Criar uma moeda única para todos os países do mundo', 'Uniformizar as legislações trabalhistas globais', 'Promover guerras comerciais contra países não membros'] },

    // ── Português — Gramática ──────────────────────────────────────────────
    { statement: 'Assinale a alternativa em que o uso da crase está CORRETO:', topic: 'Gramática', subtopic: 'Regência e Crase', difficulty: 'medium', source: 'FUVEST', year: 2021, bank: 'FUVEST', correct: 'D', alts: ['Ele foi à pé ao trabalho.', 'Entreguei o relatório à ele.', 'Refiro-me à vários problemas.', 'Fui à farmácia comprar remédio.', 'Ela estava à sorrir na foto.'] },
    { statement: 'Na frase "O aluno, que estudou muito, foi aprovado", a oração "que estudou muito" é:', topic: 'Gramática', subtopic: 'Sintaxe', difficulty: 'medium', source: 'UNICAMP', year: 2022, bank: 'UNICAMP', correct: 'A', alts: ['Oração subordinada adjetiva explicativa', 'Oração subordinada adjetiva restritiva', 'Oração subordinada adverbial causal', 'Oração coordenada sindética aditiva', 'Oração subordinada substantiva subjetiva'] },
  ];

  // helpers: find topic/subtopic by name
  const findTopic = (name) => topicsAll.find(t => t.name === name);
  const findSubtopic = (name, topicId) => subtopicsAll.find(st => st.name === name && st.topic_id === topicId);
  const letters = ['A', 'B', 'C', 'D', 'E'];

  const questions = [];
  for (const qd of questionData) {
    const topic = findTopic(qd.topic);
    if (!topic) { console.warn(`   ⚠ Tópico não encontrado: "${qd.topic}"`); continue; }
    const subtopic = qd.subtopic ? findSubtopic(qd.subtopic, topic.id) : null;
    const q = await Question.create({
      statement: qd.statement,
      topic_id: topic.id,
      subtopic_id: subtopic ? subtopic.id : null,
      difficulty: qd.difficulty,
      source: qd.source,
      year: qd.year,
      bank: qd.bank,
      created_by: teacher1.id,
    });
    for (let i = 0; i < qd.alts.length; i++) {
      await Alternative.create({
        question_id: q.id,
        letter: letters[i],
        text: qd.alts[i],
        is_correct: letters[i] === qd.correct,
      });
    }
    questions.push(q);
  }
  console.log(`   → ${questions.length} questões criadas com alternativas`);

  // Vincular questões aos vestibulares conforme banco de origem
  const bankToVestibular = {
    'ENEM':    ['ENEM'],
    'FUVEST':  ['FUVEST'],
    'UNICAMP': ['UNICAMP'],
    'UNESP':   ['UNESP'],
  };
  for (const q of questions) {
    const vestNames = bankToVestibular[q.bank] || [];
    for (const vName of vestNames) {
      const v = vestibularMap[vName];
      if (v) await QuestionVestibular.create({ question_id: q.id, vestibular_id: v.id });
    }
  }
  console.log('   → Questões vinculadas aos vestibulares');

  // ── 7. SIMULATIONS ─────────────────────────────────────────────────────────
  console.log('🌱  Criando simulados...');

  const bioSubj = subjects.find(s => s.name === 'Biologia');
  const quiSubj = subjects.find(s => s.name === 'Química');
  const fisSubj = subjects.find(s => s.name === 'Física');

  const sim1 = await Simulation.create({ title: 'Simulado de Biologia — Nível 1', subject_id: bioSubj.id, difficulty: 'easy',   total_questions: 5, time_limit_minutes: 30, is_weekly: false, created_by: teacher1.id });
  const sim2 = await Simulation.create({ title: 'Simulado ENEM — Ciências da Natureza', subject_id: bioSubj.id, difficulty: 'mixed', total_questions: 5, time_limit_minutes: 45, is_weekly: true,  created_by: admin.id });
  const sim3 = await Simulation.create({ title: 'Simulado de Química Orgânica',          subject_id: quiSubj.id, difficulty: 'medium', total_questions: 3, time_limit_minutes: 20, is_weekly: false, created_by: teacher2.id });

  // Associate questions to simulations
  const bioQs = questions.filter(q => [0,1,2,3,4].includes(questions.indexOf(q))); // first 5
  for (let i = 0; i < Math.min(5, bioQs.length); i++) {
    await SimulationQuestion.create({ simulation_id: sim1.id, question_id: bioQs[i].id, order: i + 1 });
  }
  // sim2 — mixed
  for (let i = 0; i < Math.min(5, questions.length); i++) {
    await SimulationQuestion.create({ simulation_id: sim2.id, question_id: questions[i].id, order: i + 1 });
  }
  // sim3 — química
  const quiQs = questions.filter(q => { const t = topicsAll.find(t2 => t2.id === q.topic_id); return t && t.name.includes('Química'); });
  for (let i = 0; i < Math.min(3, quiQs.length); i++) {
    await SimulationQuestion.create({ simulation_id: sim3.id, question_id: quiQs[i].id, order: i + 1 });
  }
  console.log('   → 3 simulados criados com questões associadas');

  // ── 8. QUESTION SESSIONS & ANSWERS (for students) ──────────────────────────
  console.log('🌱  Criando sessões e respostas...');

  for (const student of students_only.slice(0, 4)) {
    const session = await QuestionSession.create({
      student_id: student.id,
      simulation_id: sim1.id,
      started_at: past(rand(1, 20)),
      finished_at: past(rand(0, 1)),
      mode: 'simulation',
    });

    for (const q of bioQs.slice(0, 4)) {
      const alts = await Alternative.findAll({ where: { question_id: q.id } });
      const chosen = pick(alts);
      await Answer.create({
        session_id: session.id,
        question_id: q.id,
        student_id: student.id,
        chosen_alternative_id: chosen.id,
        is_correct: chosen.is_correct,
        response_time_seconds: rand(20, 120),
        answered_at: new Date(),
      });
    }
  }
  console.log('   → Sessões e respostas criadas');

  // ── 9. VIDEOS ──────────────────────────────────────────────────────────────
  console.log('🌱  Criando vídeos (VestWebFlix)...');

  const videosData = [
    { title: 'Introdução à Citologia', description: 'Aprenda os fundamentos da biologia celular de forma clara e objetiva.', youtube_url: 'https://www.youtube.com/embed/rvMIRMX5m1E', thumbnail_url: 'https://img.youtube.com/vi/rvMIRMX5m1E/hqdefault.jpg', topic: 'Citologia', teacher: teacher1 },
    { title: 'Divisão Celular — Mitose e Meiose', description: 'Entenda as diferenças entre mitose e meiose com animações e exercícios.', youtube_url: 'https://www.youtube.com/embed/f-ldPgEfAHI', thumbnail_url: 'https://img.youtube.com/vi/f-ldPgEfAHI/hqdefault.jpg', topic: 'Citologia', teacher: teacher1 },
    { title: 'Genética Mendeliana — 1ª Lei', description: 'Resolva problemas de monoibridismo com facilidade.', youtube_url: 'https://www.youtube.com/embed/CBezq1fFUEA', thumbnail_url: 'https://img.youtube.com/vi/CBezq1fFUEA/hqdefault.jpg', topic: 'Genética', teacher: teacher1 },
    { title: 'Ligação Gênica e Crossing Over', description: 'Compreenda genes ligados e como o crossing over afeta a herança.', youtube_url: 'https://www.youtube.com/embed/P-9oetUuDqU', thumbnail_url: 'https://img.youtube.com/vi/P-9oetUuDqU/hqdefault.jpg', topic: 'Genética', teacher: teacher1 },
    { title: 'Química Orgânica — Funções Oxigenadas', description: 'Álcoois, aldeídos, cetonas, ácidos carboxílicos e ésteres.', youtube_url: 'https://www.youtube.com/embed/sH2mZ5rL4qI', thumbnail_url: 'https://img.youtube.com/vi/sH2mZ5rL4qI/hqdefault.jpg', topic: 'Química Orgânica', teacher: teacher2 },
    { title: 'Reações Orgânicas — Adição e Substituição', description: 'Mecanismos das principais reações de compostos orgânicos.', youtube_url: 'https://www.youtube.com/embed/0Zzh_3XDNRY', thumbnail_url: 'https://img.youtube.com/vi/0Zzh_3XDNRY/hqdefault.jpg', topic: 'Química Orgânica', teacher: teacher2 },
    { title: 'Leis de Newton — Fundamentos', description: 'As três leis de Newton explicadas com exemplos do cotidiano.', youtube_url: 'https://www.youtube.com/embed/kKKM8Y-u7ds', thumbnail_url: 'https://img.youtube.com/vi/kKKM8Y-u7ds/hqdefault.jpg', topic: 'Mecânica', teacher: teacher3 },
    { title: 'Cinemática — MRU e MRUV', description: 'Equações horárias e gráficos dos movimentos uniformes.', youtube_url: 'https://www.youtube.com/embed/NMqlBUCUL7E', thumbnail_url: 'https://img.youtube.com/vi/NMqlBUCUL7E/hqdefault.jpg', topic: 'Mecânica', teacher: teacher3 },
    { title: 'Figuras de Linguagem para o ENEM', description: 'As principais figuras de linguagem cobradas no ENEM com exemplos.', youtube_url: 'https://www.youtube.com/embed/y6BdXN85bww', thumbnail_url: 'https://img.youtube.com/vi/y6BdXN85bww/hqdefault.jpg', topic: 'Figuras de Linguagem', teacher: teacher1 },
    { title: 'Ecologia — Cadeias e Teias Alimentares', description: 'Produtores, consumidores, decompositores e fluxo de energia.', youtube_url: 'https://www.youtube.com/embed/WtxwGDJE4nE', thumbnail_url: 'https://img.youtube.com/vi/WtxwGDJE4nE/hqdefault.jpg', topic: 'Ecologia', teacher: teacher1 },
  ];

  const videos = [];
  for (const vd of videosData) {
    const topic = findTopic(vd.topic);
    if (!topic) continue;
    const v = await Video.create({
      title: vd.title,
      description: vd.description,
      youtube_url: vd.youtube_url,
      thumbnail_url: vd.thumbnail_url,
      topic_id: topic.id,
      created_by: vd.teacher.id,
      published_at: past(rand(5, 60)),
    });
    videos.push(v);
  }

  // Video progress for students
  for (const student of students_only.slice(0, 3)) {
    for (const video of videos.slice(0, rand(2, 6))) {
      await VideoProgress.create({
        student_id: student.id,
        video_id: video.id,
        watched: Math.random() > 0.5,
        progress_seconds: rand(0, 3600),
      });
    }
    // Favorites
    const favVideo = pick(videos);
    await FavoriteVideo.create({ student_id: student.id, video_id: favVideo.id });
  }
  console.log(`   → ${videos.length} vídeos criados`);

  // ── 10. MENTORS & MENTORING SESSIONS ───────────────────────────────────────
  console.log('🌱  Criando mentores e sessões...');

  const mentor1 = await Mentor.create({ student_id: teacher1.id, bio: 'Médica formada pela USP com 10 anos de experiência em ensino. Especialidade em Biologia e Química.', specialties: 'Biologia, Química, ENEM' });
  const mentor2 = await Mentor.create({ student_id: teacher2.id, bio: 'Professor de Química e Física com aprovações em FUVEST, UNICAMP e ENEM por 8 anos consecutivos.', specialties: 'Química, Física, Raciocínio Lógico' });
  const mentor3 = await Mentor.create({ student_id: teacher3.id, bio: 'Doutoranda em Física Aplicada. Especialista em resolução de problemas e preparação para vestibulares.', specialties: 'Física, Matemática' });

  const sessionStatuses = ['pending', 'confirmed', 'done', 'cancelled'];
  for (const student of students_only.slice(0, 5)) {
    await MentoringSession.create({
      mentor_id: pick([mentor1, mentor2, mentor3]).id,
      student_id: student.id,
      scheduled_at: future(rand(1, 14)),
      status: pick(sessionStatuses),
      notes: pick(['Quero revisar Genética', 'Preciso de ajuda com cálculos de Física', 'Dúvidas em Química Orgânica', 'Revisão geral para o ENEM']),
    });
  }
  console.log('   → Mentores e sessões criados');

  // ── 11. STUDY EVENTS ────────────────────────────────────────────────────────
  console.log('🌱  Criando eventos de calendário...');

  const eventTypes = ['review', 'study_block'];
  for (const student of students_only.slice(0, 3)) {
    for (let d = -5; d <= 10; d++) {
      if (Math.random() < 0.4) {
        const topic = pick(topicsAll);
        await StudyEvent.create({
          student_id: student.id,
          title: `Estudar ${topic.name}`,
          topic_id: topic.id,
          date: d < 0 ? past(-d) : future(d),
          start_time: `${rand(7, 19).toString().padStart(2, '0')}:00:00`,
          end_time:  `${rand(20, 22).toString().padStart(2, '0')}:00:00`,
          type: pick(eventTypes),
          done: d < 0,
        });
      }
    }
  }
  console.log('   → Eventos de estudo criados');

  // ── 12. COMMUNITY — POSTS, COMMENTS, LIKES ─────────────────────────────────
  console.log('🌱  Criando posts da comunidade...');

  const postContents = [
    'Alguém mais acha que Genética é o tópico mais difícil do ENEM? Estou travando nas questões de herança ligada ao sexo 😅',
    'Dica: para memorizar as organelas celulares, use mapas mentais com cores! Funcionou muito bem pra mim 🧠',
    'Fiz o simulado de Biologia hoje e tirei 8/10! Estou evoluindo. Quem quiser discutir as questões, me chama!',
    'Alguém tem dica de como estudar Química Orgânica? Estou tendo dificuldade com nomenclatura de compostos.',
    'Acabei de assistir a aula de Leis de Newton no VestWebFlix. Sensacional! O professor explica muito bem 🔥',
    'Lembrete para quem está desanimado: cada questão que você erra hoje é uma acerto no vestibular! 💪',
    'Pergunta rápida: qual a diferença entre mitose e meiose em termos de função biológica?',
    'Galera, criamos um grupo de estudos online. Quem quiser entrar, me manda mensagem! Estudamos de segunda a sexta 19h.',
  ];

  const posts = [];
  for (let i = 0; i < postContents.length; i++) {
    const student = pick(students_only);
    const p = await Post.create({
      student_id: student.id,
      content: postContents[i],
      image_url: i === 4 ? 'https://images.unsplash.com/photo-1532094349884-543559244183?w=600' : null,
      created_at: past(rand(0, 15)),
    });
    posts.push(p);
  }

  // Comments
  const commentTexts = [
    'Concordo! É um dos temas mais complexos mesmo.',
    'Essa dica é incrível! Já comecei a usar mapas mentais.',
    'Parabéns!! Continua assim!',
    'Eu recomendo a aula do VestWebFlix sobre isso, ajuda muito!',
    'Também tive essa dificuldade no começo. Com prática melhora!',
    'Boa reflexão! Muda muito a perspectiva.',
    'A meiose produz células haploides (n) para reprodução, a mitose produz células diploides (2n) para crescimento.',
    'Me manda mensagem sim! Quero entrar no grupo.',
  ];

  for (let i = 0; i < posts.length; i++) {
    const commenter = pick(students_only);
    await Comment.create({
      post_id: posts[i].id,
      student_id: commenter.id,
      content: commentTexts[i] || 'Muito bom isso! 👏',
      parent_id: null,
    });

    // Likes
    for (const student of students_only) {
      if (Math.random() > 0.5) {
        await Like.create({ student_id: student.id, post_id: posts[i].id });
      }
    }
  }
  console.log(`   → ${posts.length} posts, comentários e curtidas criados`);

  // ── 13. POINTS, BADGES, STREAKS ────────────────────────────────────────────
  console.log('🌱  Criando gamificação...');

  const badges = await Badge.bulkCreate([
    { name: 'Primeiro Acerto',     description: 'Acertou a primeira questão',        icon_url: '🎯', condition: 'first_correct' },
    { name: 'Maratonista',         description: '7 dias seguidos de estudo',         icon_url: '🔥', condition: 'streak_7' },
    { name: 'Mestre da Biologia',  description: '100 questões de Biologia acertadas', icon_url: '🧬', condition: 'bio_100' },
    { name: 'Velocista',           description: 'Respondeu 10 questões em 5 minutos', icon_url: '⚡', condition: 'speed_10' },
    { name: 'Comunidade Ativa',    description: 'Fez 10 postagens na comunidade',    icon_url: '💬', condition: 'posts_10' },
    { name: 'Simuladeiro',         description: 'Concluiu 5 simulados',              icon_url: '📋', condition: 'sims_5' },
  ]);

  for (const student of students_only) {
    // Points
    const reasons = ['correct_answer', 'simulation', 'streak', 'community'];
    for (let i = 0; i < rand(3, 10); i++) {
      await Points.create({
        student_id: student.id,
        amount: pick([10, 20, 30, 50]),
        reason: pick(reasons),
      });
    }

    // Streak
    await Streak.create({
      student_id: student.id,
      current_streak: rand(1, 15),
      longest_streak: rand(5, 30),
      last_activity_date: past(rand(0, 2)),
    });

    // Random badges
    const earnedBadges = badges.slice(0, rand(1, 3));
    for (const badge of earnedBadges) {
      await StudentBadge.create({
        student_id: student.id,
        badge_id: badge.id,
        earned_at: past(rand(1, 30)),
      });
    }
  }
  console.log('   → Pontos, badges e streaks criados');

  // ── DONE ──────────────────────────────────────────────────────────────────
  console.log('\n✅  Seed completo!\n');
  console.log('📋  Usuários criados:');
  console.log('   Admin:    matrícula=ADM001   senha=VestWeb123');
  console.log('   Teacher1: matrícula=TCH001   senha=VestWeb123  (Prof. Ana Lima)');
  console.log('   Teacher2: matrícula=TCH002   senha=VestWeb123  (Prof. Carlos Braga)');
  console.log('   Student:  matrícula=ALU001   senha=VestWeb123  (João Silva)');
  console.log('   Student:  matrícula=ALU002   senha=VestWeb123  (Maria Souza)');
  console.log('   ... e mais 3 alunos (ALU003 a ALU008)\n');

  await sequelize.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Erro no seed:', err);
  process.exit(1);
});
