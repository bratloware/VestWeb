# 🧠 Sinapse — Prompt de Desenvolvimento Completo

> Você é um desenvolvedor fullstack sênior especializado em React, Node.js e PostgreSQL. Vou te descrever um sistema completo que preciso que você desenvolva.

---

## 📌 Sobre o Projeto

O sistema se chama **Sinapse** — uma plataforma web educacional voltada para alunos de cursinho pré-vestibular com foco em medicina. O sistema tem duas grandes partes: uma **landing page pública** e um **Espaço Aluno** (área logada).

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React + TypeScript |
| Estado Global | Redux Toolkit |
| Roteamento | React Router DOM |
| Requisições HTTP | Axios |
| Ícones | Lucide React |
| Estilização | CSS puro |
| Bundler | Vite |
| Backend | Node.js + Express (ESM) |
| Banco de Dados | PostgreSQL + Sequelize ORM |
| Autenticação | JWT + bcrypt |
| Outros | CORS, dotenv, nodemon |

---

## 📁 Estrutura de Pastas

```
sinapse/
├── client/                  ← React
│   ├── src/
│   │   ├── api/             ← axios configurado com interceptor
│   │   ├── components/      ← componentes reutilizáveis
│   │   ├── pages/           ← páginas da aplicação
│   │   ├── slices/          ← Redux slices
│   │   ├── store/           ← configuração do Redux store
│   │   └── main.tsx
└── server/                  ← Express
    ├── src/
    │   ├── controllers/     ← lógica de negócio
    │   ├── db/
    │   │   ├── models/      ← models do Sequelize
    │   │   └── index.js     ← conexão com o banco
    │   ├── middlewares/     ← authMiddleware, etc
    │   ├── routes/          ← rotas agrupadas por domínio
    │   └── services/        ← serviços auxiliares (jwt, hash)
    └── app.js
```

---

## 🗄️ Banco de Dados

### Usuários e Acesso

```
students
├── id
├── name
├── email (unique)
├── enrollment (unique)
├── password_hash
├── avatar_url
├── role (student | teacher | admin)
└── created_at

sessions
├── id
├── student_id (FK → students)
├── token
├── expires_at
└── created_at
```

### Landing Page

```
banners
├── id
├── image_url
├── title
├── subtitle
├── order
├── active (boolean)
└── created_at

testimonials
├── id
├── name
├── photo_url
├── course
├── university
├── text
├── active (boolean)
└── created_at

institutional_video
├── id
├── youtube_url
├── title
└── updated_at
```

### Questões

```
subjects
├── id
└── name

topics
├── id
├── name
└── subject_id (FK → subjects)

questions
├── id
├── statement
├── topic_id (FK → topics)
├── difficulty (easy | medium | hard)
├── source
├── year
├── bank
├── created_by (FK → students)
└── created_at

alternatives
├── id
├── question_id (FK → questions)
├── letter (A | B | C | D | E)
├── text
└── is_correct (boolean)
```

### Simulados e Respostas

```
simulations
├── id
├── title
├── subject_id (FK → subjects)
├── difficulty (easy | medium | hard | mixed)
├── total_questions
├── time_limit_minutes
├── is_weekly (boolean)
├── created_by (FK → students)
└── created_at

simulation_questions
├── id
├── simulation_id (FK → simulations)
├── question_id (FK → questions)
└── order

question_sessions
├── id
├── student_id (FK → students)
├── simulation_id (FK → simulations)
├── started_at
├── finished_at
└── mode (simulation | practice)

answers
├── id
├── session_id (FK → question_sessions)
├── question_id (FK → questions)
├── chosen_alternative_id (FK → alternatives)
├── is_correct (boolean)
├── response_time_seconds
└── answered_at
```

### Sinaflix — Videoaulas

```
videos
├── id
├── title
├── description
├── youtube_url
├── thumbnail_url
├── topic_id (FK → topics)
├── created_by (FK → students)
├── published_at
└── created_at

video_progress
├── id
├── student_id (FK → students)
├── video_id (FK → videos)
├── watched (boolean)
├── progress_seconds
└── updated_at

favorite_videos
├── id
├── student_id (FK → students)
├── video_id (FK → videos)
└── created_at
```

### Mentoria

```
mentors
├── id
├── student_id (FK → students)
├── bio
├── specialties
└── created_at

mentoring_sessions
├── id
├── mentor_id (FK → mentors)
├── student_id (FK → students)
├── scheduled_at
├── status (pending | confirmed | done | cancelled)
├── notes
└── created_at
```

### Calendário e Sala de Estudos

```
study_events
├── id
├── student_id (FK → students)
├── title
├── topic_id (FK → topics)
├── date
├── start_time
├── end_time
├── type (review | study_block)
├── done (boolean)
└── created_at
```

### Comunidade

```
posts
├── id
├── student_id (FK → students)
├── content
├── image_url
├── created_at
└── updated_at

comments
├── id
├── post_id (FK → posts)
├── student_id (FK → students)
├── content
├── parent_id (FK → comments)
└── created_at

likes
├── id
├── student_id (FK → students)
├── post_id (FK → posts)
├── comment_id (FK → comments)
└── created_at

reports
├── id
├── student_id (FK → students)
├── post_id (FK → posts)
├── reason
└── created_at
```

### Gamificação e Ranking

```
points
├── id
├── student_id (FK → students)
├── amount
├── reason (correct_answer | simulation | streak | community)
└── created_at

badges
├── id
├── name
├── description
├── icon_url
└── condition

student_badges
├── id
├── student_id (FK → students)
├── badge_id (FK → badges)
└── earned_at

streaks
├── id
├── student_id (FK → students)
├── current_streak
├── longest_streak
└── last_activity_date
```

---

## 🔐 Autenticação

- Login com **matrícula** (`enrollment`) e senha
- JWT gerado no login, salvo no `localStorage`
- Middleware `authMiddleware` em todas as rotas protegidas
- Roles: `student`, `teacher`, `admin`
- `ProtectedRoute` no frontend verifica o token via Redux antes de renderizar a página

---

## 🗺️ Fluxo de Navegação

```
/ (Landing Page — pública)
    ↓ botão "Acessar"
/login
    ↓ login bem-sucedido
/select-platform
    ├── /sinaflix              ← videoaulas estilo Netflix
    └── /classroom             ← Espaço Aluno (rotas protegidas)
            ├── /home          ← dashboard com métricas
            ├── /questions     ← resolver questões
            ├── /simulations   ← simulados
            ├── /review-calendar
            ├── /study-room
            ├── /metrics
            ├── /community
            ├── /mentoring
            └── /settings
```

---

## 📄 Páginas e Funcionalidades

### Landing Page (`/`)

**Referência visual de estilo:** https://med.estrategia.com/

Usar essa página como referência de estilo visual e composição geral da landing page — design moderno, sóbrio com destaques coloridos, seções bem definidas com muito espaçamento, tipografia grande e impactante, imagens de alta qualidade e CTAs bem destacados. Adaptar cores e identidade visual para o Sinapse (cor primária: `#0f8b8d`).

**Header fixo no topo com navegação por âncoras (não são páginas separadas — são seções dentro da própria landing page):**

| Item do Menu | Âncora | Descrição |
|---|---|---|
| Home | `#home` | Scroll para o topo da página |
| Colaboradores | `#colaboradores` | Seção de professores e mentores |
| Espaço Aluno | `#espaco-aluno` | Apresentação da área logada |
| Sobre | `#sobre` | História e proposta do cursinho |
| Depoimentos | `#depoimentos` | Cards de alunos aprovados |
| Contato | `#contato` | Formulário de contato |

O header deve ser fixo (`position: sticky` ou `fixed`), com fundo semi-transparente que escurece ao rolar a página. No mobile, o menu vira um hamburguer que abre um drawer lateral. No canto direito do header deve ter um botão de CTA "Acessar Espaço Aluno" que leva para `/login`.

**Seções da Landing Page (de cima para baixo):**

1. **Hero (`#home`)** — Banner principal com título impactante, subtítulo, botão de CTA e imagem ou vídeo de fundo. Carrossel de banners com autoplay e navegação manual. Conteúdo vem da API.

2. **Espaço Aluno (`#espaco-aluno`)** — Apresentação visual dos módulos da plataforma (Questões, Simulados, Sinaflix, Mentoria, etc.) com ícones e descrições curtas. Botão para acessar o login.

3. **Sobre (`#sobre`)** — Seção com vídeo institucional embedado do YouTube (URL configurável via admin) e texto sobre a proposta do cursinho.

4. **Colaboradores (`#colaboradores`)** — Grid ou carrossel com cards dos professores e mentores. Cada card tem: foto, nome, disciplina e breve bio.

5. **Depoimentos (`#depoimentos`)** — Grid ou carrossel de cards de alunos aprovados. Cada card tem: foto, nome, curso e universidade aprovado e texto do depoimento. Conteúdo vem da API.

6. **Contato (`#contato`)** — Formulário com campos: nome, e-mail, mensagem e botão de enviar. Exibir também redes sociais e WhatsApp.

7. **Footer** — Logo, links do menu, redes sociais e copyright.

Todo o conteúdo dinâmico (banners, vídeo, depoimentos, colaboradores) deve vir da API e ser gerenciável pelo admin.

### Login (`/login`)
- Campo de matrícula e senha
- Exibição de erro via Redux
- Toggle de mostrar/ocultar senha
- Redirecionamento para `/select-platform` após login

**Referência visual de layout:** https://app.missao193.com.br/

Usar essa página como referência de estrutura e composição visual da tela de login, com as seguintes adaptações para o Sinapse:
- A **imagem de fundo** deve ser trocada por uma imagem temática do Sinapse (medicina, estudos, vestibular)
- A **logo** deve ser a logo do Sinapse no lugar da logo Missão 193
- O campo de **e-mail** deve ser substituído por **matrícula** (`enrollment`)
- Manter a estrutura geral: tela dividida com imagem de fundo ocupando parte da tela e card de login centralizado com logo, título, campos e botão de entrar
- Manter elementos como Esqueceu a senha, toggle de mostrar/ocultar senha e mensagem de ambiente seguro
- As cores do card e botão devem seguir a identidade visual do Sinapse (cor primária: `#0f8b8d`)

### Seleção de Plataforma (`/select-platform`)
- Dois cards: Sinaflix e Espaço Aluno
- Cada card navega para sua respectiva área

### Sinaflix (`/sinaflix`)
- Interface estilo Netflix com cards de vídeo por matéria
- Busca por título, matéria e professor
- Player embedado via YouTube
- Marcação de vídeo como assistido
- Continuação de onde parou (`progress_seconds`)

### Dashboard (`/home`)
- Total de questões respondidas
- Taxa de acerto geral e por matéria
- Posição no ranking
- Streak de dias de estudo
- Atalhos para os módulos

### Questões (`/questions`)
- Filtro por matéria, tópico e dificuldade
- Resolução uma a uma com feedback imediato
- Timer por questão
- Resultado ao final com gabarito comentado

### Simulados (`/simulations`)
- Listagem de simulados disponíveis
- Timer regressivo durante realização
- Correção automática ao final
- Histórico com evolução de desempenho

### Calendário de Revisões (`/review-calendar`)
- Visualização mensal e semanal
- Criação de eventos com data, horário, matéria e conteúdo
- Edição e exclusão de eventos

### Sala de Estudos (`/study-room`)
- Grade semanal com horários
- Cadastro de blocos de estudo
- Indicação de blocos concluídos vs pendentes

### Métricas (`/metrics`)
- Gráficos de desempenho por matéria
- Evolução ao longo do tempo
- Questões mais erradas

### Comunidade (`/community`)
- Feed de posts com texto e imagem
- Comentários e curtidas
- Ranking geral e por matéria
- Badges conquistados

### Mentoria (`/mentoring`)
- Listagem de mentores disponíveis
- Agendamento de sessões
- Histórico de sessões

### Configurações (`/settings`)
- Edição de perfil (nome, foto, email)
- Alteração de senha

---

## 📐 Padrões de Código

### Backend
- Sempre usar `async/await` com `try/catch` nos controllers
- Middlewares separados em arquivos próprios
- Rotas agrupadas por domínio (`auth`, `questions`, `simulations`, `videos`, `community`, etc)
- Variáveis de ambiente via `.env` com `dotenv`
- Respostas padronizadas: `{ message, data }` ou `{ message, error }`

### Frontend
- Sempre usar Redux para estado global (`auth`, `questions`, `simulations`, `videos`, `community`)
- Axios centralizado em `api.ts` com interceptor para injetar o token JWT automaticamente
- Componentes funcionais com hooks
- CSS por arquivo separado por página
- `camelCase` para variáveis, `PascalCase` para componentes

---

## ⚠️ Regras Importantes

- Nunca retornar `password_hash` nas respostas da API
- Toda rota protegida deve usar o middleware `authMiddleware`
- O frontend nunca deve fazer `fetch` direto — sempre usar `api.ts` com axios
- Roles devem ser verificados no **backend** antes de qualquer operação de professor ou admin
- Imagens e thumbnails vêm de URL externa (YouTube ou upload futuro)

---

---

## 📱 Responsividade

O sistema deve ser totalmente responsivo, adaptando o layout para os seguintes breakpoints:

| Breakpoint | Faixa |
|------------|-------|
| Mobile | abaixo de 768px |
| Tablet | 768px a 1024px |
| Desktop | acima de 1024px |

### Comportamento por página

**Navbar / Aside (menu lateral)**
- Desktop → sidebar fixa à esquerda sempre visível
- Tablet → sidebar recolhida, abre ao clicar no botão de menu
- Mobile → sidebar oculta, abre como drawer (sobreposição) ao clicar no menu

**Landing Page**
- Desktop → layout em múltiplas colunas, banners em tamanho completo
- Tablet → colunas reduzidas, grid de depoimentos com 2 colunas
- Mobile → layout em coluna única, banners com altura reduzida, grid de depoimentos com 1 coluna

**Dashboard**
- Desktop → cards de métricas em linha (4 colunas)
- Tablet → cards em 2 colunas
- Mobile → cards empilhados em coluna única

**Questões e Simulados**
- Desktop → enunciado e alternativas lado a lado com espaçamento generoso
- Tablet → layout em coluna única com padding reduzido
- Mobile → layout em coluna única, botões de alternativa em largura total

**Sinaflix**
- Desktop → grid de cards com 4 colunas por linha
- Tablet → grid com 2 colunas
- Mobile → grid com 1 coluna, cards em largura total

**Calendário e Sala de Estudos**
- Desktop → visualização semanal completa com todas as colunas visíveis
- Tablet → scroll horizontal na grade semanal
- Mobile → visualização diária com navegação entre dias

**Comunidade**
- Desktop → feed centralizado com sidebar de ranking à direita
- Tablet → feed centralizado sem sidebar, ranking abaixo do feed
- Mobile → feed em largura total, ranking colapsável

### Regras gerais de responsividade
- Nunca usar larguras fixas em px para containers principais — usar `%`, `vw` ou `max-width`
- Fontes devem escalar entre mobile e desktop usando `clamp()` ou tamanhos relativos
- Imagens sempre com `width: 100%` e `object-fit: cover`
- Botões e inputs com `width: 100%` no mobile
- Espaçamentos (`padding`, `margin`) reduzidos proporcionalmente no mobile
- Tabelas com scroll horizontal no mobile (`overflow-x: auto`)
- Todos os modais e overlays devem ocupar tela cheia no mobile

---

> Agora me diga qual parte quer que eu comece a desenvolver.
