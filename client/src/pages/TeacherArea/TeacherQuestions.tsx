import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import TeacherSidebar from '../../components/TeacherSidebar';
import api from '../../api/api';
import './TeacherQuestions.css';

interface Alternative {
  id?: number;
  text: string;
  is_correct: boolean;
}

interface Question {
  id: number;
  statement: string;
  difficulty: 'easy' | 'medium' | 'hard';
  source: string | null;
  year: number | null;
  topic: { id: number; name: string; subject: { id: number; name: string } };
  alternatives: Alternative[];
}

interface Subject {
  id: number;
  name: string;
  topics: { id: number; name: string }[];
}

const DIFFICULTY_LABELS = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' };

const emptyForm = {
  statement: '',
  topic_id: '',
  difficulty: 'medium',
  source: '',
  year: '',
  alternatives: [
    { text: '', is_correct: true },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
  ] as Alternative[],
};

const TeacherQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = async () => {
    try {
      const [qRes, sRes] = await Promise.all([
        api.get('/teacher/questions'),
        api.get('/questions/subjects'),
      ]);
      setQuestions(qRes.data.data);
      setSubjects(sRes.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAltChange = (index: number, field: keyof Alternative, value: string | boolean) => {
    setForm(prev => {
      const alts = [...prev.alternatives];
      if (field === 'is_correct') {
        alts.forEach((a, i) => { a.is_correct = i === index; });
      } else {
        alts[index] = { ...alts[index], [field]: value };
      }
      return { ...prev, alternatives: alts };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/teacher/questions/${editingId}`, {
          statement: form.statement,
          topic_id: Number(form.topic_id),
          difficulty: form.difficulty,
          source: form.source || null,
          year: form.year ? Number(form.year) : null,
        });
      } else {
        await api.post('/teacher/questions', {
          ...form,
          topic_id: Number(form.topic_id),
          year: form.year ? Number(form.year) : null,
          source: form.source || null,
        });
      }
      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
      await load();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (q: Question) => {
    setForm({
      statement: q.statement,
      topic_id: String(q.topic.id),
      difficulty: q.difficulty,
      source: q.source ?? '',
      year: q.year ? String(q.year) : '',
      alternatives: q.alternatives.map(a => ({ text: a.text, is_correct: a.is_correct })),
    });
    setEditingId(q.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta questão?')) return;
    try {
      await api.delete(`/teacher/questions/${id}`);
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch {
      // ignore
    }
  };

  const allTopics = subjects.flatMap(s => s.topics.map(t => ({ ...t, subjectName: s.name })));

  return (
    <div className="teacher-layout">
      <TeacherSidebar />
      <main className="teacher-main">
        <div className="teacher-questions">
          <div className="teacher-page-header">
            <div>
              <h1>Minhas Questões</h1>
              <p>Crie e gerencie questões para o banco de questões.</p>
            </div>
            <button
              className="teacher-btn-primary"
              onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm); }}
            >
              <Plus size={16} /> Nova questão
            </button>
          </div>

          {showForm && (
            <form className="teacher-question-form" onSubmit={handleSubmit}>
              <h2>{editingId ? 'Editar questão' : 'Nova questão'}</h2>

              <div className="tqf-group">
                <label>Enunciado *</label>
                <textarea
                  value={form.statement}
                  onChange={e => setForm(p => ({ ...p, statement: e.target.value }))}
                  required
                  rows={4}
                  placeholder="Digite o enunciado da questão..."
                />
              </div>

              <div className="tqf-row">
                <div className="tqf-group">
                  <label>Tópico *</label>
                  <select
                    value={form.topic_id}
                    onChange={e => setForm(p => ({ ...p, topic_id: e.target.value }))}
                    required
                  >
                    <option value="">Selecione...</option>
                    {allTopics.map(t => (
                      <option key={t.id} value={t.id}>{t.subjectName} — {t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="tqf-group">
                  <label>Dificuldade *</label>
                  <select
                    value={form.difficulty}
                    onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}
                  >
                    <option value="easy">Fácil</option>
                    <option value="medium">Médio</option>
                    <option value="hard">Difícil</option>
                  </select>
                </div>

                <div className="tqf-group">
                  <label>Fonte</label>
                  <input
                    type="text"
                    value={form.source}
                    onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                    placeholder="Ex: FUVEST"
                  />
                </div>

                <div className="tqf-group">
                  <label>Ano</label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={e => setForm(p => ({ ...p, year: e.target.value }))}
                    placeholder="Ex: 2023"
                  />
                </div>
              </div>

              {!editingId && (
                <div className="tqf-group">
                  <label>Alternativas (marque a correta) *</label>
                  <div className="tqf-alternatives">
                    {form.alternatives.map((alt, i) => (
                      <div key={i} className="tqf-alt">
                        <input
                          type="radio"
                          name="correct"
                          checked={alt.is_correct}
                          onChange={() => handleAltChange(i, 'is_correct', true)}
                        />
                        <input
                          type="text"
                          value={alt.text}
                          onChange={e => handleAltChange(i, 'text', e.target.value)}
                          placeholder={`Alternativa ${String.fromCharCode(65 + i)}`}
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="tqf-actions">
                <button type="button" className="teacher-btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>
                  Cancelar
                </button>
                <button type="submit" className="teacher-btn-primary" disabled={saving}>
                  {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar questão'}
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <p className="teacher-loading">Carregando...</p>
          ) : questions.length === 0 ? (
            <div className="teacher-empty">
              <p>Você ainda não criou nenhuma questão.</p>
            </div>
          ) : (
            <div className="teacher-questions-list">
              {questions.map(q => (
                <div key={q.id} className="teacher-question-card">
                  <div className="tq-header" onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}>
                    <div className="tq-meta">
                      <span className={`tq-difficulty diff-${q.difficulty}`}>{DIFFICULTY_LABELS[q.difficulty]}</span>
                      <span className="tq-topic">{q.topic.subject.name} — {q.topic.name}</span>
                      {q.source && <span className="tq-source">{q.source}{q.year ? ` (${q.year})` : ''}</span>}
                    </div>
                    <div className="tq-actions">
                      <button className="tq-icon-btn" onClick={e => { e.stopPropagation(); handleEdit(q); }} title="Editar">
                        <Edit2 size={15} />
                      </button>
                      <button className="tq-icon-btn tq-icon-delete" onClick={e => { e.stopPropagation(); handleDelete(q.id); }} title="Excluir">
                        <Trash2 size={15} />
                      </button>
                      {expandedId === q.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  <p className="tq-statement">{q.statement}</p>

                  {expandedId === q.id && q.alternatives.length > 0 && (
                    <div className="tq-alternatives">
                      {q.alternatives.map((alt, i) => (
                        <div key={i} className={`tq-alt${alt.is_correct ? ' correct' : ''}`}>
                          <span className="tq-alt-letter">{String.fromCharCode(65 + i)}</span>
                          <span>{alt.text}</span>
                          {alt.is_correct && <span className="tq-correct-badge">Correta</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TeacherQuestions;
