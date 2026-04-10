import { useState, useRef, useEffect } from 'react';
import {
  FileText, Upload, CheckCircle, AlertCircle, Loader,
  Clock, Eye, ChevronDown, ChevronUp, Image, FileType,
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/api';
import './EssayCorrection.css';

interface Competencia {
  numero: number;
  nome: string;
  nota: number;
  comentario: string;
}

interface EssayItem {
  id: number;
  original_name: string;
  file_type: string;
  status: 'pending' | 'corrected';
  created_at: string;
  nota_total: number | null;
  c1_nota: number | null; c1_comentario: string | null;
  c2_nota: number | null; c2_comentario: string | null;
  c3_nota: number | null; c3_comentario: string | null;
  c4_nota: number | null; c4_comentario: string | null;
  c5_nota: number | null; c5_comentario: string | null;
  comentario_geral: string | null;
  pontos_positivos: string[] | null;
  pontos_melhorar: string[] | null;
}

const COMPETENCIA_NOMES = [
  'Domínio da norma padrão da língua escrita',
  'Compreensão da proposta e desenvolvimento do tema',
  'Seleção e organização das informações e argumentos',
  'Conhecimento dos mecanismos linguísticos de argumentação',
  'Proposta de intervenção',
];

const ACCEPTED_FORMATS = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.txt';
const ACCEPTED_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const scoreColor = (nota: number) => {
  if (nota >= 800) return '#16a34a';
  if (nota >= 600) return '#ca8a04';
  if (nota >= 400) return '#ea580c';
  return '#dc2626';
};

const compColor = (nota: number) => {
  if (nota >= 160) return '#16a34a';
  if (nota >= 120) return '#ca8a04';
  if (nota >= 80) return '#ea580c';
  return '#dc2626';
};

const fileIcon = (type: string) => {
  if (['jpg', 'jpeg', 'png'].includes(type)) return <Image size={16} />;
  if (['doc', 'docx'].includes(type)) return <FileType size={16} />;
  return <FileText size={16} />;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const EssayCorrection = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [essays, setEssays] = useState<EssayItem[]>([]);
  const [loadingEssays, setLoadingEssays] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadEssays = async () => {
    try {
      const res = await api.get('/essay/my');
      setEssays(res.data.essays);
    } catch {
      // silencioso
    } finally {
      setLoadingEssays(false);
    }
  };

  useEffect(() => { loadEssays(); }, []);

  const handleFile = (f: File) => {
    if (!ACCEPTED_MIMES.includes(f.type)) {
      setError('Formato não suportado. Use PDF, JPG, PNG, DOC, DOCX ou TXT.');
      return;
    }
    if (f.size > 15 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 15 MB.');
      return;
    }
    setFile(f);
    setError('');
    setSuccess('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/essay/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Redação enviada com sucesso! Aguarde a correção do professor.');
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      await loadEssays();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erro ao enviar a redação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const buildCompetencias = (essay: EssayItem): Competencia[] =>
    [1, 2, 3, 4, 5].map(n => ({
      numero: n,
      nome: COMPETENCIA_NOMES[n - 1],
      nota: (essay as any)[`c${n}_nota`] ?? 0,
      comentario: (essay as any)[`c${n}_comentario`] ?? '',
    }));

  return (
    <div className="essay-page">
      <Sidebar />
      <main className="page-content">
        <div className="essay-header">
          <h1>Correção de Redação</h1>
          <p className="essay-subtitle">
            Envie sua redação e aguarde a correção detalhada do professor nas 5 competências do ENEM
          </p>
        </div>

        {/* Upload */}
        <div className="card essay-upload-card">
          <div
            className={`essay-dropzone${file ? ' has-file' : ''}`}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_FORMATS}
              style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
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
                <p className="essay-dropzone-label">Arraste o arquivo aqui ou clique para selecionar</p>
                <p className="essay-dropzone-hint">PDF · JPG · PNG · DOC · DOCX · TXT &mdash; máx. 15 MB</p>
              </>
            )}
          </div>

          {error && (
            <div className="essay-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="essay-success">
              <CheckCircle size={16} />
              <span>{success}</span>
            </div>
          )}

          <button
            className="btn-primary essay-submit-btn"
            onClick={handleSubmit}
            disabled={!file || loading}
          >
            {loading
              ? <><Loader size={16} className="essay-spin" /> Enviando...</>
              : <><Upload size={16} /> Enviar para Correção</>}
          </button>
        </div>

        {/* Lista de redações */}
        <div className="essay-list-section">
          <h2 className="essay-list-title">Minhas Redações</h2>

          {loadingEssays ? (
            <div className="essay-loading"><Loader size={20} className="essay-spin" /> Carregando...</div>
          ) : essays.length === 0 ? (
            <div className="card essay-empty">
              <FileText size={36} className="essay-empty-icon" />
              <p>Nenhuma redação enviada ainda.</p>
            </div>
          ) : (
            <div className="essay-list">
              {essays.map(essay => (
                <div key={essay.id} className="card essay-item">
                  <div className="essay-item-header" onClick={() => essay.status === 'corrected' && toggleExpand(essay.id)}>
                    <span className="essay-item-icon">{fileIcon(essay.file_type)}</span>
                    <span className="essay-item-name">{essay.original_name}</span>
                    <span className="essay-item-date">{formatDate(essay.created_at)}</span>
                    <span className={`essay-badge essay-badge--${essay.status}`}>
                      {essay.status === 'corrected'
                        ? <><CheckCircle size={12} /> Corrigida</>
                        : <><Clock size={12} /> Aguardando</>}
                    </span>
                    {essay.status === 'corrected' && (
                      <span className="essay-item-score" style={{ color: scoreColor(essay.nota_total ?? 0) }}>
                        {essay.nota_total}/1000
                      </span>
                    )}
                    {essay.status === 'corrected' && (
                      <button className="essay-expand-btn">
                        {expandedId === essay.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        <Eye size={14} /> Ver correção
                      </button>
                    )}
                  </div>

                  {expandedId === essay.id && essay.status === 'corrected' && (
                    <div className="essay-correction-detail">
                      {/* Nota total */}
                      <div className="essay-score-card">
                        <div className="essay-score-ring" style={{ '--score-color': scoreColor(essay.nota_total ?? 0) } as React.CSSProperties}>
                          <span className="essay-score-value">{essay.nota_total}</span>
                          <span className="essay-score-max">/ 1000</span>
                        </div>
                        <div className="essay-score-info">
                          <h3>Nota Total</h3>
                          <p className="essay-comentario-geral">{essay.comentario_geral}</p>
                        </div>
                      </div>

                      {/* Competências */}
                      <div className="essay-competencias">
                        {buildCompetencias(essay).map(c => (
                          <div key={c.numero} className="card essay-comp-card">
                            <div className="essay-comp-header">
                              <span className="essay-comp-num">C{c.numero}</span>
                              <span className="essay-comp-nome">{c.nome}</span>
                              <span className="essay-comp-nota" style={{ color: compColor(c.nota) }}>
                                {c.nota} <small>/ 200</small>
                              </span>
                            </div>
                            <div className="essay-comp-bar-bg">
                              <div className="essay-comp-bar-fill" style={{ width: `${(c.nota / 200) * 100}%`, background: compColor(c.nota) }} />
                            </div>
                            <p className="essay-comp-comentario">{c.comentario}</p>
                          </div>
                        ))}
                      </div>

                      {/* Feedback */}
                      <div className="essay-feedback-grid">
                        <div className="card">
                          <h3 className="essay-feedback-title positivos">Pontos Positivos</h3>
                          <ul className="essay-feedback-list">
                            {(essay.pontos_positivos ?? []).map((p, i) => (
                              <li key={i}><CheckCircle size={14} className="icon-positive" />{p}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="card">
                          <h3 className="essay-feedback-title melhorar">A Melhorar</h3>
                          <ul className="essay-feedback-list">
                            {(essay.pontos_melhorar ?? []).map((p, i) => (
                              <li key={i}><AlertCircle size={14} className="icon-improve" />{p}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
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

export default EssayCorrection;
