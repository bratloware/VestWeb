import { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle,
  ClipboardList,
  ExternalLink,
  FileText,
  Loader,
  Upload,
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import PageHeader from '../../components/PageHeader/PageHeader';
import api from '../../api/api';
import './EssayCorrection.css';

interface Competencia {
  numero: number;
  nome: string;
  nota: number;
  comentario: string;
}

interface Correction {
  nota_total: number;
  competencias: Competencia[];
  comentario_geral: string;
  pontos_positivos: string[];
  pontos_melhorar: string[];
}

interface EssayProposal {
  year: number;
  theme: string;
  focus: string;
  sourceUrl: string;
}

interface EssayModel {
  id: string;
  title: string;
  whenToUse: string;
  intro: string;
  devOne: string;
  devTwo: string;
  conclusion: string;
}

type ModelStepId = 'intro' | 'dev-one' | 'dev-two' | 'conclusion';

const NOTA_MAX = 1000;

const ENEM_PROPOSALS: EssayProposal[] = [
  {
    year: 2024,
    theme: 'Desafios para a valorizacao da heranca africana no Brasil',
    focus: 'Debater memoria historica, educacao antirracista e politicas de valorizacao cultural.',
    sourceUrl:
      'https://www.gov.br/inep/pt-br/centrais-de-conteudo/noticias/enem/tema-da-redacao-desafios-para-a-valorizacao-da-heranca-africana-no-brasil',
  },
  {
    year: 2023,
    theme: 'Desafios para o enfrentamento da invisibilidade do trabalho de cuidado realizado pela mulher no Brasil',
    focus: 'Discutir desigualdade de genero, divisao do trabalho e redes de apoio social.',
    sourceUrl:
      'https://www.gov.br/inep/pt-br/centrais-de-conteudo/noticias/enem/tema-da-redacao-desafios-para-o-enfrentamento-da-invisibilidade-do-trabalho-de-cuidado-realizado-pela-mulher-no-brasil',
  },
  {
    year: 2022,
    theme: 'Desafios para a valorizacao de comunidades e povos tradicionais no Brasil',
    focus: 'Abordar direitos territoriais, diversidade cultural e preservacao de saberes tradicionais.',
    sourceUrl:
      'https://www.gov.br/inep/pt-br/centrais-de-conteudo/noticias/enem/redacao-tem-como-tema-desafios-para-a-valorizacao-de-comunidades-e-povos-tradicionais',
  },
  {
    year: 2021,
    theme: 'Invisibilidade e registro civil: garantia de acesso a cidadania no Brasil',
    focus: 'Relacionar documentacao basica, inclusao social e acesso a direitos fundamentais.',
    sourceUrl:
      'https://www.gov.br/inep/pt-br/centrais-de-conteudo/noticias/enem/redacao-do-enem-2021-aborda-registro-civil-e-cidadania',
  },
  {
    year: 2020,
    theme: 'O estigma associado as doencas mentais na sociedade brasileira',
    focus: 'Argumentar sobre saude mental, preconceito, acesso a tratamento e politicas publicas.',
    sourceUrl:
      'https://www.gov.br/inep/pt-br/centrais-de-conteudo/noticias/enem/estigma-da-doenca-mental-e-tema-da-redacao-do-enem-2020',
  },
  {
    year: 2019,
    theme: 'Democratizacao do acesso ao cinema no Brasil',
    focus: 'Explorar acesso a cultura, concentracao de mercado e formacao de publico.',
    sourceUrl:
      'https://www.gov.br/inep/pt-br/centrais-de-conteudo/noticias/enem/democratizacao-do-acesso-ao-cinema-no-brasil-e-o-tema-da-redacao-em-2019',
  },
  {
    year: 2018,
    theme: 'Manipulacao do comportamento do usuario pelo controle de dados na internet',
    focus: 'Debater privacidade, uso de algoritmos e responsabilidade das plataformas digitais.',
    sourceUrl:
      'https://www.gov.br/inep/pt-br/centrais-de-conteudo/noticias/enem/tema-da-redacao-do-enem-2018-e-manipulacao-do-comportamento-do-usuario-pelo-controle-de-dados-na-internet',
  },
  {
    year: 2017,
    theme: 'Desafios para a formacao educacional de surdos no Brasil',
    focus: 'Discutir inclusao escolar, acessibilidade linguistica e formacao docente.',
    sourceUrl:
      'https://www.gov.br/inep/pt-br/centrais-de-conteudo/noticias/enem/tema-da-redacao-do-enem-2017-e-desafios-para-a-formacao-educacional-de-surdos-no-brasil',
  },
  {
    year: 2016,
    theme: 'Caminhos para combater a intolerancia religiosa no Brasil',
    focus: 'Analisar liberdade religiosa, convivencia democratica e enfrentamento da discriminacao.',
    sourceUrl:
      'https://www.gov.br/inep/pt-br/centrais-de-conteudo/noticias/enem/caminhos-para-combater-a-intolerancia-religiosa-no-brasil-e-o-tema-da-redacao-do-enem-2016/',
  },
  {
    year: 2015,
    theme: 'A persistencia da violencia contra a mulher na sociedade brasileira',
    focus: 'Apontar causas estruturais, limites da rede de protecao e caminhos de prevencao.',
    sourceUrl:
      'https://www.gov.br/inep/pt-br/centrais-de-conteudo/noticias/enem/estudantes-tem-de-escrever-sobre-a--violencia-contra-a-mulher-na-sociedade-brasileira',
  },
  {
    year: 2014,
    theme: 'Publicidade infantil em questao no Brasil',
    focus: 'Discutir etica na comunicacao, protecao da infancia e regulacao da publicidade.',
    sourceUrl:
      'https://www.gov.br/inep/pt-br/centrais-de-conteudo/noticias/enem/redacao-tem-como-tema-publicidade-infantil-em-questao-no-brasil',
  },
  {
    year: 2013,
    theme: 'Efeitos da implantacao da Lei Seca no Brasil',
    focus: 'Relacionar seguranca no transito, fiscalizacao e responsabilidade coletiva.',
    sourceUrl:
      'https://www.gov.br/inep/pt-br/centrais-de-conteudo/noticias/enem/redacao-aborda-efeitos-da-implantacao-da-lei-seca-no-brasil',
  },
];

const ESSAY_MODELS: EssayModel[] = [
  {
    id: 'modelo-classico',
    title: 'Modelo Classico (tese + 2 argumentos + intervencao)',
    whenToUse: 'Ideal para qualquer tema social amplo e para quem precisa de previsibilidade na escrita.',
    intro:
      'Apresente o tema, delimite o problema e feche com uma tese clara sobre o que precisa mudar no Brasil.',
    devOne:
      'Desenvolva a primeira causa ou obstaculo com repertorio sociocultural e explicacao de impacto social.',
    devTwo:
      'Traga um segundo argumento complementar, comparando cenarios ou mostrando consequencias praticas.',
    conclusion:
      'Proponha intervencao completa: agente, acao, meio, detalhamento e finalidade, respeitando direitos humanos.',
  },
  {
    id: 'modelo-causa-efeito',
    title: 'Modelo Causa e Efeito',
    whenToUse: 'Funciona bem em temas com problema estrutural e impactos sociais facilmente observaveis.',
    intro:
      'Contextualize o tema e apresente uma tese conectando origem do problema e necessidade de solucao publica.',
    devOne:
      'Explique as causas historicas, economicas ou culturais que sustentam o problema atualmente.',
    devTwo:
      'Mostre os efeitos diretos na vida da populacao e os riscos de manter o cenario sem politicas efetivas.',
    conclusion:
      'Feche com proposta de intervencao focada em atacar causa raiz e reduzir os efeitos no curto e longo prazo.',
  },
  {
    id: 'modelo-direitos',
    title: 'Modelo Direitos e Cidadania',
    whenToUse: 'Muito util quando o tema envolve acesso a servicos, dignidade, inclusao ou garantia de direitos.',
    intro:
      'Apresente o tema pela perspectiva constitucional e indique qual direito esta sendo limitado na pratica.',
    devOne:
      'Argumente sobre falhas institucionais (Estado, escola, mercado, midia) que ampliam a violacao de direitos.',
    devTwo:
      'Demonstre como grupos sociais especificos sao mais afetados e por que isso reforca desigualdades.',
    conclusion:
      'Proponha intervencao articulada entre poder publico e sociedade civil com metas, meios e resultado esperado.',
  },
];

const scoreColor = (nota: number) => {
  if (nota >= 800) return '#16a34a';
  if (nota >= 600) return '#ca8a04';
  if (nota >= 400) return '#ea580c';
  return '#dc2626';
};

const competenciaColor = (nota: number) => {
  if (nota >= 160) return '#16a34a';
  if (nota >= 120) return '#ca8a04';
  if (nota >= 80) return '#ea580c';
  return '#dc2626';
};

const EssayCorrection = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [correction, setCorrection] = useState<Correction | null>(null);
  const [error, setError] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [activeModelId, setActiveModelId] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const availableYears = useMemo(
    () => ['all', ...ENEM_PROPOSALS.map((item) => String(item.year))],
    [],
  );

  const filteredProposals = useMemo(() => {
    if (yearFilter === 'all') return ENEM_PROPOSALS;
    return ENEM_PROPOSALS.filter((item) => String(item.year) === yearFilter);
  }, [yearFilter]);

  const activeModel = useMemo(
    () => ESSAY_MODELS.find((model) => model.id === activeModelId) ?? null,
    [activeModelId],
  );

  const modelSteps = useMemo(() => {
    if (!activeModel) return [] as { id: ModelStepId; label: string; text: string }[];

    return [
      { id: 'intro' as const, label: 'Introducao', text: activeModel.intro },
      { id: 'dev-one' as const, label: 'Desenvolvimento 1', text: activeModel.devOne },
      { id: 'dev-two' as const, label: 'Desenvolvimento 2', text: activeModel.devTwo },
      { id: 'conclusion' as const, label: 'Conclusao', text: activeModel.conclusion },
    ];
  }, [activeModel]);

  const handleFile = (uploadedFile: File) => {
    if (uploadedFile.type !== 'application/pdf') {
      setError('Apenas arquivos PDF sao aceitos.');
      return;
    }
    setFile(uploadedFile);
    setError('');
    setCorrection(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  };

  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);
    setError('');
    setCorrection(null);

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const res = await api.post('/essay/correct', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      setCorrection(res.data.correction);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erro ao processar a redacao. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="essay-page">
      <Sidebar />
      <main className="page-content">
        <PageHeader
          crumb="Correcao"
          title={<>Correcao de <span className="vw-page-header-accent">Redacao</span></>}
          subtitle="Escolha um tema, siga um modelo e envie seu PDF para correcao."
        />

        <div className="essay-library-grid">
          <section className="card essay-library-card">
            <div className="essay-library-header">
              <h2>
                <ClipboardList size={18} />
                Propostas oficiais do ENEM
              </h2>
              <div className="essay-year-filter">
                <label htmlFor="essay-year-filter">Ano</label>
                <select
                  id="essay-year-filter"
                  className="form-control"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year === 'all' ? 'Todos' : year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="essay-library-subtitle">
              Temas reais ja aplicados no exame, com foco para treinar repertorio e argumentacao.
            </p>

            <div className="essay-proposal-list">
              {filteredProposals.map((proposal) => (
                <article key={proposal.year} className="essay-proposal-item">
                  <div className="essay-proposal-top">
                    <span className="essay-proposal-year">ENEM {proposal.year}</span>
                    <a href={proposal.sourceUrl} target="_blank" rel="noreferrer">
                      Fonte oficial <ExternalLink size={13} />
                    </a>
                  </div>
                  <h3>{proposal.theme}</h3>
                  <p>{proposal.focus}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="card essay-model-card">
            <h2>
              <BookOpen size={18} />
              Modelos de estrutura
            </h2>
            <p className="essay-library-subtitle">
              Estruturas guiadas para voce ganhar velocidade sem perder qualidade argumentativa.
            </p>

            <div className="essay-model-tabs" role="group" aria-label="Modelos de redacao">
              {ESSAY_MODELS.map((model) => {
                const isActive = activeModelId === model.id;
                return (
                  <button
                    key={model.id}
                    type="button"
                    aria-pressed={isActive}
                    className={`essay-model-tab${isActive ? ' active' : ''}`}
                    onClick={() => setActiveModelId((prev) => (prev === model.id ? '' : model.id))}
                  >
                    {model.title}
                  </button>
                );
              })}
            </div>

            {activeModel ? (
              <div key={activeModel.id} className="essay-model-content essay-model-content-active">
                <h3>{activeModel.title}</h3>
                <p className="essay-model-use">{activeModel.whenToUse}</p>
                <ul className="essay-model-step-list">
                  {modelSteps.map((step) => (
                    <li key={step.id} className={`essay-model-step essay-model-step-${step.id}`}>
                      <span className="essay-model-step-dot" aria-hidden />
                      <div>
                        <strong>{step.label}:</strong> {step.text}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="essay-model-empty" role="status">
                <p>Selecione um modelo acima para visualizar a estrutura sugerida.</p>
              </div>
            )}
          </section>
        </div>

        <div className="card essay-upload-card">
          <div
            className={`essay-dropzone${file ? ' has-file' : ''}`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {file ? (
              <>
                <FileText size={40} className="essay-dropzone-icon file-selected" />
                <p className="essay-dropzone-filename">{file.name}</p>
                <p className="essay-dropzone-hint">Clique para trocar o arquivo</p>
              </>
            ) : (
              <>
                <Upload size={40} className="essay-dropzone-icon" />
                <p className="essay-dropzone-label">Arraste o PDF aqui ou clique para selecionar</p>
                <p className="essay-dropzone-hint">Maximo 10 MB - apenas PDF</p>
              </>
            )}
          </div>

          {error && (
            <div className="essay-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            className="btn-primary essay-submit-btn"
            onClick={handleSubmit}
            disabled={!file || loading}
          >
            {loading ? (
              <>
                <Loader size={16} className="essay-spin" /> Corrigindo...
              </>
            ) : (
              <>
                <CheckCircle size={16} /> Corrigir Redacao
              </>
            )}
          </button>
        </div>

        {correction && (
          <div className="essay-results">
            <div className="card essay-score-card">
              <div
                className="essay-score-ring"
                style={{ '--score-color': scoreColor(correction.nota_total) } as React.CSSProperties}
              >
                <span className="essay-score-value">{correction.nota_total}</span>
                <span className="essay-score-max">/ {NOTA_MAX}</span>
              </div>
              <div className="essay-score-info">
                <h2>Nota Total</h2>
                <p className="essay-comentario-geral">{correction.comentario_geral}</p>
              </div>
            </div>

            <div className="essay-competencias">
              {correction.competencias.map((comp) => (
                <div key={comp.numero} className="card essay-comp-card">
                  <div className="essay-comp-header">
                    <span className="essay-comp-num">C{comp.numero}</span>
                    <span className="essay-comp-nome">{comp.nome}</span>
                    <span className="essay-comp-nota" style={{ color: competenciaColor(comp.nota) }}>
                      {comp.nota} <small>/ 200</small>
                    </span>
                  </div>
                  <div className="essay-comp-bar-bg">
                    <div
                      className="essay-comp-bar-fill"
                      style={{
                        width: `${(comp.nota / 200) * 100}%`,
                        background: competenciaColor(comp.nota),
                      }}
                    />
                  </div>
                  <p className="essay-comp-comentario">{comp.comentario}</p>
                </div>
              ))}
            </div>

            <div className="essay-feedback-grid">
              <div className="card">
                <h3 className="essay-feedback-title positivos">Pontos Positivos</h3>
                <ul className="essay-feedback-list">
                  {correction.pontos_positivos.map((item, index) => (
                    <li key={index}>
                      <CheckCircle size={14} className="icon-positive" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card">
                <h3 className="essay-feedback-title melhorar">A Melhorar</h3>
                <ul className="essay-feedback-list">
                  {correction.pontos_melhorar.map((item, index) => (
                    <li key={index}>
                      <AlertCircle size={14} className="icon-improve" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default EssayCorrection;
