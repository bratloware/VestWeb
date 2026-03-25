import 'dotenv/config';
import bcrypt from 'bcrypt';
import sequelize from './index.js';

// Import all models (triggers associations)
import {
  Student, Banner, Testimonial, InstitutionalVideo,
  Subject, Topic, Question, Alternative,
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
    { name: 'Admin Sinapse',      email: 'admin@sinapse.com',     enrollment: 'ADM001', role: 'admin',   avatar_url: 'https://i.pravatar.cc/150?img=1' },
    { name: 'Prof. Ana Lima',     email: 'ana.lima@sinapse.com',  enrollment: 'TCH001', role: 'teacher', avatar_url: 'https://i.pravatar.cc/150?img=5' },
    { name: 'Prof. Carlos Braga', email: 'carlos@sinapse.com',    enrollment: 'TCH002', role: 'teacher', avatar_url: 'https://i.pravatar.cc/150?img=12' },
    { name: 'Prof. Marta Fonseca',email: 'marta@sinapse.com',     enrollment: 'TCH003', role: 'teacher', avatar_url: 'https://i.pravatar.cc/150?img=20' },
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
    studentData.map(async (s) => Student.create({ ...s, password_hash: await hash('sinapse123') }))
  );

  const [admin, teacher1, teacher2, teacher3, ...students_only] = students;
  console.log(`   → ${students.length} alunos criados  (senha padrão: sinapse123)`);

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
    { name: 'Ana Paula Ramos',    photo_url: 'https://i.pravatar.cc/150?img=23', course: 'Medicina',           university: 'USP',     text: 'O Sinapse foi fundamental na minha aprovação. A metodologia de questões e simulados me deu toda a segurança que precisava!',             active: true },
    { name: 'Gabriel Torres',    photo_url: 'https://i.pravatar.cc/150?img=70', course: 'Medicina',           university: 'UNIFESP', text: 'Estudei por 1 ano no Sinapse e passei na primeira tentativa. Os professores são incríveis e o material é muito bem feito.',           active: true },
    { name: 'Fernanda Lopes',    photo_url: 'https://i.pravatar.cc/150?img=25', course: 'Medicina',           university: 'UNICAMP', text: 'A plataforma é completa demais! Sinaflix, simulados, calendário... tudo integrado me ajudou muito a organizar meus estudos.',          active: true },
    { name: 'Bruno Carvalho',    photo_url: 'https://i.pravatar.cc/150?img=65', course: 'Biomedicina',        university: 'UFRJ',    text: 'Mesmo não sendo medicina, os conteúdos do Sinapse foram perfeitos para minha área. Super recomendo!',                                 active: true },
    { name: 'Isabela Martins',   photo_url: 'https://i.pravatar.cc/150?img=36', course: 'Medicina',           university: 'FMUSP',   text: 'As mentorias foram o diferencial. Poder conversar com médicos e estudantes aprovados me deu uma visão completamente diferente.',       active: true },
    { name: 'Thiago Nascimento', photo_url: 'https://i.pravatar.cc/150?img=59', course: 'Medicina Veterinária', university: 'UNESP', text: 'Excelente plataforma! O sistema de gamificação com pontos e streaks me manteve motivado durante toda a preparação.',                 active: true },
  ]);
  console.log('   → 6 depoimentos criados');

  // ── 4. INSTITUTIONAL VIDEO ─────────────────────────────────────────────────
  console.log('🌱  Criando vídeo institucional...');
  await InstitutionalVideo.create({
    youtube_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    title: 'Conheça o Sinapse — A plataforma que transforma sua preparação',
  });

  // ── 5. SUBJECTS & TOPICS ───────────────────────────────────────────────────
  console.log('🌱  Criando matérias e tópicos...');

  const subjectsData = [
    { name: 'Biologia', topics: ['Citologia', 'Genética', 'Ecologia', 'Evolução', 'Embriologia', 'Histologia', 'Fisiologia Animal', 'Botânica'] },
    { name: 'Química',  topics: ['Química Orgânica', 'Química Inorgânica', 'Físico-Química', 'Eletroquímica', 'Termoquímica', 'Soluções'] },
    { name: 'Física',   topics: ['Mecânica', 'Termodinâmica', 'Óptica', 'Eletromagnetismo', 'Ondulatória', 'Gravitação'] },
    { name: 'Matemática', topics: ['Álgebra', 'Geometria Plana', 'Geometria Espacial', 'Trigonometria', 'Probabilidade', 'Funções'] },
    { name: 'Português',  topics: ['Interpretação de Texto', 'Gramática', 'Redação', 'Literatura', 'Figuras de Linguagem'] },
    { name: 'História',   topics: ['História do Brasil', 'História Geral', 'História Contemporânea', 'Geopolítica'] },
    { name: 'Geografia',  topics: ['Climatologia', 'Geopolítica', 'Urbanização', 'Geomorfologia', 'Cartografia'] },
  ];

  const subjects = [];
  const topicsAll = [];

  for (const sd of subjectsData) {
    const subj = await Subject.create({ name: sd.name });
    subjects.push(subj);
    for (const tName of sd.topics) {
      const t = await Topic.create({ name: tName, subject_id: subj.id });
      topicsAll.push(t);
    }
  }
  console.log(`   → ${subjects.length} matérias, ${topicsAll.length} tópicos criados`);

  // ── 6. QUESTIONS & ALTERNATIVES ────────────────────────────────────────────
  console.log('🌱  Criando questões...');

  const questionData = [
    // Biologia — Citologia
    { statement: 'A membrana plasmática é constituída principalmente por uma bicamada de fosfolipídeos. Qual das alternativas abaixo descreve corretamente uma função desta membrana?', topic: 'Citologia', difficulty: 'easy', source: 'FUVEST', year: 2022, bank: 'FUVEST', correct: 'B', alts: ['Produção de energia celular pela oxidação de glicose', 'Controle da entrada e saída de substâncias na célula', 'Síntese de proteínas a partir de aminoácidos', 'Digestão intracelular de organelas danificadas', 'Armazenamento de material genético'] },
    { statement: 'Em relação à mitose, é CORRETO afirmar que:', topic: 'Citologia', difficulty: 'medium', source: 'ENEM', year: 2021, bank: 'ENEM', correct: 'C', alts: ['Ocorre apenas em células sexuais', 'Resulta em células com metade do número de cromossomos', 'Garante a manutenção do número cromossômico nas células-filhas', 'É o processo responsável pela formação de gametas', 'Ocorre em duas etapas, ambas com divisão do núcleo'] },
    { statement: 'O retículo endoplasmático rugoso (RER) difere do retículo endoplasmático liso (REL) principalmente por:', topic: 'Citologia', difficulty: 'medium', source: 'UNICAMP', year: 2023, bank: 'UNICAMP', correct: 'A', alts: ['Possuir ribossomos aderidos à sua membrana', 'Ser responsável pelo armazenamento de cálcio', 'Sintetizar lipídeos e esteroides', 'Estar ausente em células animais', 'Estar ligado diretamente à membrana plasmática'] },
    // Genética
    { statement: 'Uma mulher portadora de daltonismo (gene recessivo ligado ao X) se casa com um homem daltônico. Qual a probabilidade de seus filhos homens serem daltônicos?', topic: 'Genética', difficulty: 'hard', source: 'FUVEST', year: 2020, bank: 'FUVEST', correct: 'D', alts: ['25%', '0%', '75%', '50%', '100%'] },
    { statement: 'O fenômeno de dominância incompleta difere da codominância porque:', topic: 'Genética', difficulty: 'medium', source: 'ENEM', year: 2022, bank: 'ENEM', correct: 'E', alts: ['Ocorre apenas em plantas', 'Envolve genes ligados ao sexo', 'Produz um fenótipo idêntico ao parental dominante', 'Resulta em segregação 3:1 na F2', 'Gera um fenótipo intermediário entre os parentais'] },
    // Química — Orgânica
    { statement: 'A fermentação alcoólica, realizada por leveduras, transforma glicose em etanol e gás carbônico. Este processo é um exemplo de:', topic: 'Química Orgânica', difficulty: 'easy', source: 'ENEM', year: 2021, bank: 'ENEM', correct: 'A', alts: ['Reação de oxidação incompleta de açúcares', 'Reação de combustão completa', 'Reação de polimerização da glicose', 'Oxidação aeróbica de carboidratos', 'Redução de dióxido de carbono a etanol'] },
    { statement: 'Qual das alternativas abaixo representa corretamente a fórmula geral de um éster?', topic: 'Química Orgânica', difficulty: 'easy', source: 'FUVEST', year: 2019, bank: 'FUVEST', correct: 'C', alts: ['R–CO–R\'', 'R–COOH', 'R–COO–R\'', 'R–OH', 'R–CO–NH2'] },
    // Física — Mecânica
    { statement: 'Um objeto é lançado horizontalmente de uma altura de 80 m com velocidade inicial de 20 m/s. Considerando g = 10 m/s², o alcance horizontal do objeto é:', topic: 'Mecânica', difficulty: 'medium', source: 'FUVEST', year: 2022, bank: 'FUVEST', correct: 'B', alts: ['40 m', '80 m', '60 m', '100 m', '120 m'] },
    { statement: 'De acordo com a 2ª Lei de Newton, a aceleração de um corpo:', topic: 'Mecânica', difficulty: 'easy', source: 'ENEM', year: 2020, bank: 'ENEM', correct: 'A', alts: ['É diretamente proporcional à força resultante e inversamente proporcional à sua massa', 'É inversamente proporcional à força resultante e diretamente proporcional à sua massa', 'Independe da massa do corpo', 'É igual à força aplicada sobre o corpo', 'É sempre constante independente das forças'] },
    // Matemática
    { statement: 'A soma dos termos de uma progressão aritmética com 10 termos, primeiro termo a₁ = 3 e razão r = 2, é igual a:', topic: 'Álgebra', difficulty: 'medium', source: 'ENEM', year: 2023, bank: 'ENEM', correct: 'C', alts: ['100', '110', '120', '130', '140'] },
    { statement: 'Em um triângulo retângulo, a hipotenusa mede 10 cm e um cateto mede 6 cm. O outro cateto mede:', topic: 'Geometria Plana', difficulty: 'easy', source: 'ENEM', year: 2021, bank: 'ENEM', correct: 'D', alts: ['4 cm', '5 cm', '7 cm', '8 cm', '9 cm'] },
    // Português
    { statement: 'A figura de linguagem presente no verso "O cravo brigou com a rosa" é:', topic: 'Figuras de Linguagem', difficulty: 'easy', source: 'ENEM', year: 2022, bank: 'ENEM', correct: 'A', alts: ['Personificação (prosopopeia)', 'Metáfora', 'Metonímia', 'Hipérbole', 'Antítese'] },
    { statement: 'Leia o trecho: "A vida é uma peça de teatro que não permite ensaios." A figura de linguagem predominante é:', topic: 'Figuras de Linguagem', difficulty: 'easy', source: 'ENEM', year: 2021, bank: 'ENEM', correct: 'B', alts: ['Hipérbole', 'Metáfora', 'Metonímia', 'Ironia', 'Eufemismo'] },
    // História
    { statement: 'A Proclamação da República no Brasil, em 1889, foi resultado principalmente:', topic: 'História do Brasil', difficulty: 'medium', source: 'ENEM', year: 2020, bank: 'ENEM', correct: 'C', alts: ['De uma revolução popular liderada por operários urbanos', 'Da pressão do movimento abolicionista após a Lei Áurea', 'Do enfraquecimento da monarquia e da insatisfação militar e das elites agrárias', 'De uma invasão estrangeira que derrubou o governo imperial', 'De um golpe liderado exclusivamente pela Igreja Católica'] },
  ];

  // helper: find topic by name
  const findTopic = (name) => topicsAll.find(t => t.name === name);
  const letters = ['A', 'B', 'C', 'D', 'E'];

  const questions = [];
  for (const qd of questionData) {
    const topic = findTopic(qd.topic);
    if (!topic) continue;
    const q = await Question.create({
      statement: qd.statement,
      topic_id: topic.id,
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
  console.log('🌱  Criando vídeos (Sinaflix)...');

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
    'Acabei de assistir a aula de Leis de Newton no Sinaflix. Sensacional! O professor explica muito bem 🔥',
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
    'Eu recomendo a aula do Sinaflix sobre isso, ajuda muito!',
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
  console.log('   Admin:    matrícula=ADM001   senha=sinapse123');
  console.log('   Teacher1: matrícula=TCH001   senha=sinapse123  (Prof. Ana Lima)');
  console.log('   Teacher2: matrícula=TCH002   senha=sinapse123  (Prof. Carlos Braga)');
  console.log('   Student:  matrícula=ALU001   senha=sinapse123  (João Silva)');
  console.log('   Student:  matrícula=ALU002   senha=sinapse123  (Maria Souza)');
  console.log('   ... e mais 3 alunos (ALU003 a ALU008)\n');

  await sequelize.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Erro no seed:', err);
  process.exit(1);
});
