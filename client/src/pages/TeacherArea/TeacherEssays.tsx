import { useState, useEffect } from 'react';
import {
  FileText, Clock, CheckCircle, AlertCircle, Eye,
  ChevronDown, ChevronUp, Send, Loader, Image, FileType,
} from 'lucide-react';
import TeacherSidebar from '../../components/TeacherSidebar';
import api from '../../api/api';
import './TeacherEssays.css';

interface Student {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
}

interface EssayItem {
  id: number;
  student: Student;
  original_name: string;
  file_type: string;
  file_path: string;
  status: 'pending' | 'corrected';
  created_at: string;
  nota_total: number | null;
}

interface CompetenciaForm {
  nota: number;
  comentario: string;
}

const COMPETENCIA_NOMES = [
  'Domínio da norma padrão da língua escrita',
  'Compreensão da proposta e desenvolvimento do tema',
  'Seleção e organização das informações e argumentos',
  'Conhecimento dos mecanismos linguísticos de argumentação',
  'Proposta de intervenção',
];

const NOTAS_VALIDAS = [0, 40, 80, 120, 160, 200];

const emptyComp = (): CompetenciaForm => ({ nota: 0, comentario: '' });

const emptyForm = () => ({
  competencias: COMPETENCIA_NOMES.map(() => emptyComp()),
  comentario_geral: '',
  pontos_positivos: ['', '', ''],
  pontos_melhorar: ['', '', ''],
});

const scoreColor = (nota: number) => {
  if (nota >= 800) return '#16a34a';
  if (nota >= 600) return '#ca8a04';
  if (nota >= 400) return '#ea580c';
  return '#dc2626';
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const fileIcon = (type: string) => {
  if (['jpg', 'jpeg', 'png'].includes(type)) return <Image size={16} />;
  if (['doc', 'docx'].includes(type)) return <FileType size={16} />;
  return <FileText size={16} />;
};

const TeacherEssays = () => {
  const [essays, setEssays] = useState<EssayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'corrected'>('all');
  const [activeId, setActiveId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const loadEssays = async () => {
    try {
      const res = await api.get('/teacher/essays');
      setEssays(res.data.essays);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEssays(); }, []);

  const filtered = essays.filter(e => filter === 'all' || e.status === filter);

  const openEssay = (id: number) => {
    if (activeId === id) {
      setActiveId(null);
      return;
    }
    setActiveId(id);
    setForm(emptyForm());
    setSaveError('');
    setSaveSuccess('');
  };

  const setComp = (idx: number, field: keyof CompetenciaForm, value: string | number) => {
    setForm(prev => {
      const comps = [...prev.competencias];
      comps[idx] = { ...comps[idx], [field]: value };
      return { ...prev, competencias: comps };
    });
  };

  const setListItem = (key: 'pontos_positivos' | 'pontos_melhorar', idx: number, value: string) => {
    setForm(prev => {
      const arr = [...prev[key]];
      arr[idx] = value;
      return { ...prev, [key]: arr };
    });
  };

  const totalNota = form.competencias.reduce((acc, c) => acc + c.nota, 0);

  const handleSave = async (essayId: number) => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');

    const payload = {
      nota_total: totalNota,
      competencias: form.competencias.map((c, i) => ({
        numero: i + 1,
        nome: COMPETENCIA_NOMES[i],
        nota: c.nota,
        comentario: c.comentario,
      })),
      comentario_geral: form.comentario_geral,
      pontos_positivos: form.pontos_positivos.filter(p => p.trim()),
      pontos_melhorar: form.pontos_melhorar.filter(p => p.trim()),
    };

    try {
      await api.put(`/teacher/essays/${essayId}/correct`, payload);
      setSaveSuccess('Correção salva com sucesso!');
      await loadEssays();
    } catch (err: any) {
      setSaveError(err.response?.data?.message ?? 'Erro ao salvar correção.');
    } finally {
      setSaving(false);
    }
  };

  const fileUrl = (essayId: number) =>
    `http://localhost:3001/api/teacher/essays/file/${essayId}`;

  return (
    <div className="teacher-essays-page">
      <TeacherSidebar />
      <main className="page-content">
        <div className="te-header">
          <h1>Redações para Correção</h1>
          <p className="te-subtitle">Visualize os arquivos dos alunos e preencha a correção nas 5 competências do ENEM</p>
        </div>

        {/* Filtros */}
        <div className="te-filters">
          {(['all', 'pending', 'corrected'] as const).map(f => (
            <button
              key={f}
              className={`te-filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Todas' : f === 'pending' ? 'Aguardando' : 'Corrigidas'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="te-loading"><Loader size={20} className="essay-spin" /> Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="card te-empty">
            <FileText size={36} className="te-empty-icon" />
            <p>Nenhuma redação encontrada.</p>
          </div>
        ) : (
          <div className="te-list">
            {filtered.map(essay => (
              <div key={essay.id} className="card te-item">
                {/* Cabeçalho */}
                <div className="te-item-header" onClick={() => openEssay(essay.id)}>
                  <div className="te-item-avatar">
                    {essay.student.avatar_url
                      ? <img src={essay.student.avatar_url} alt="" />
                      : <span>{essay.student.name.charAt(0).toUpperCase()}</span>}
                  </div>
                  <div className="te-item-info">
                    <span className="te-item-student">{essay.student.name}</span>
                    <span className="te-item-file">
                      {fileIcon(essay.file_type)} {essay.original_name}
                    </span>
                  </div>
                  <span className="te-item-date">{formatDate(essay.created_at)}</span>
                  <span className={`essay-badge essay-badge--${essay.status}`}>
                    {essay.status === 'corrected'
                      ? <><CheckCircle size={12} /> Corrigida</>
                      : <><Clock size={12} /> Aguardando</>}
                  </span>
                  {essay.status === 'corrected' && essay.nota_total != null && (
                    <span className="te-item-score" style={{ color: scoreColor(essay.nota_total) }}>
                      {essay.nota_total}/1000
                    </span>
                  )}
                  <button className="te-expand-btn">
                    {activeId === essay.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {essay.status === 'pending' ? <><Eye size={14} /> Corrigir</> : <><Eye size={14} /> Ver</>}
                  </button>
                </div>

                {/* Painel de correção */}
                {activeId === essay.id && (
                  <div className="te-correction-panel">
                    {/* Link para o arquivo */}
                    <div className="te-file-link-row">
                      <a
                        href={fileUrl(essay.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="te-file-link"
                      >
                        <Eye size={14} /> Abrir arquivo da redação
                      </a>
                    </div>

                    {essay.status === 'corrected' ? (
                      <p className="te-already-corrected">
                        <CheckCircle size={16} /> Esta redação já foi corrigida com nota {essay.nota_total}/1000.
                      </p>
                    ) : (
                      <div className="te-form">
                        <div className="te-nota-preview">
                          Nota calculada: <strong style={{ color: scoreColor(totalNota) }}>{totalNota} / 1000</strong>
                        </div>

                        {/* Competências */}
                        {COMPETENCIA_NOMES.map((nome, i) => (
                          <div key={i} className="te-comp-block">
                            <div className="te-comp-label">
                              <span className="essay-comp-num">C{i + 1}</span>
                              <span>{nome}</span>
                            </div>
                            <div className="te-comp-controls">
                              <select
                                className="te-select"
                                value={form.competencias[i].nota}
                                onChange={e => setComp(i, 'nota', Number(e.target.value))}
                              >
                                {NOTAS_VALIDAS.map(n => (
                                  <option key={n} value={n}>{n}</option>
                                ))}
                              </select>
                              <textarea
                                className="te-textarea"
                                placeholder={`Comentário sobre C${i + 1}...`}
                                value={form.competencias[i].comentario}
                                onChange={e => setComp(i, 'comentario', e.target.value)}
                                rows={2}
                              />
                            </div>
                          </div>
                        ))}

                        {/* Comentário geral */}
                        <div className="te-field">
                          <label className="te-label">Comentário Geral</label>
                          <textarea
                            className="te-textarea"
                            placeholder="Avaliação geral da redação..."
                            value={form.comentario_geral}
                            onChange={e => setForm(prev => ({ ...prev, comentario_geral: e.target.value }))}
                            rows={3}
                          />
                        </div>

                        {/* Pontos positivos */}
                        <div className="te-feedback-row">
                          <div className="te-field">
                            <label className="te-label te-label--positivos">Pontos Positivos</label>
                            {form.pontos_positivos.map((p, i) => (
                              <input
                                key={i}
                                className="te-input"
                                placeholder={`Ponto positivo ${i + 1}`}
                                value={p}
                                onChange={e => setListItem('pontos_positivos', i, e.target.value)}
                              />
                            ))}
                          </div>
                          <div className="te-field">
                            <label className="te-label te-label--melhorar">A Melhorar</label>
                            {form.pontos_melhorar.map((p, i) => (
                              <input
                                key={i}
                                className="te-input"
                                placeholder={`Ponto a melhorar ${i + 1}`}
                                value={p}
                                onChange={e => setListItem('pontos_melhorar', i, e.target.value)}
                              />
                            ))}
                          </div>
                        </div>

                        {saveError && (
                          <div className="essay-error">
                            <AlertCircle size={16} /><span>{saveError}</span>
                          </div>
                        )}
                        {saveSuccess && (
                          <div className="essay-success">
                            <CheckCircle size={16} /><span>{saveSuccess}</span>
                          </div>
                        )}

                        <button
                          className="btn-primary te-save-btn"
                          onClick={() => handleSave(essay.id)}
                          disabled={saving}
                        >
                          {saving
                            ? <><Loader size={16} className="essay-spin" /> Salvando...</>
                            : <><Send size={16} /> Salvar Correção</>}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherEssays;
