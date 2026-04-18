import { useState, useRef } from 'react';
import { FileText, Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
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

const NOTA_MAX = 1000;

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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf') {
      setError('Apenas arquivos PDF são aceitos.');
      return;
    }
    setFile(f);
    setError('');
    setCorrection(null);
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
      setError(err.response?.data?.message ?? 'Erro ao processar a redação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="essay-page">
      <Sidebar />
      <main className="page-content">
        <div className="essay-header">
          <h1>Correção de Redação</h1>
          <p className="essay-subtitle">Envie seu PDF e receba uma correção detalhada nos critérios do ENEM</p>
        </div>

        {/* Upload area */}
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
              accept="application/pdf"
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
                <p className="essay-dropzone-label">Arraste o PDF aqui ou clique para selecionar</p>
                <p className="essay-dropzone-hint">Máximo 10 MB · apenas PDF</p>
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
              <><Loader size={16} className="essay-spin" /> Corrigindo...</>
            ) : (
              <><CheckCircle size={16} /> Corrigir Redação</>
            )}
          </button>
        </div>

        {/* Results */}
        {correction && (
          <div className="essay-results">
            {/* Total score */}
            <div className="card essay-score-card">
              <div className="essay-score-ring" style={{ '--score-color': scoreColor(correction.nota_total) } as React.CSSProperties}>
                <span className="essay-score-value">{correction.nota_total}</span>
                <span className="essay-score-max">/ {NOTA_MAX}</span>
              </div>
              <div className="essay-score-info">
                <h2>Nota Total</h2>
                <p className="essay-comentario-geral">{correction.comentario_geral}</p>
              </div>
            </div>

            {/* Competências */}
            <div className="essay-competencias">
              {correction.competencias.map(c => (
                <div key={c.numero} className="card essay-comp-card">
                  <div className="essay-comp-header">
                    <span className="essay-comp-num">C{c.numero}</span>
                    <span className="essay-comp-nome">{c.nome}</span>
                    <span className="essay-comp-nota" style={{ color: competenciaColor(c.nota) }}>
                      {c.nota} <small>/ 200</small>
                    </span>
                  </div>
                  <div className="essay-comp-bar-bg">
                    <div
                      className="essay-comp-bar-fill"
                      style={{ width: `${(c.nota / 200) * 100}%`, background: competenciaColor(c.nota) }}
                    />
                  </div>
                  <p className="essay-comp-comentario">{c.comentario}</p>
                </div>
              ))}
            </div>

            {/* Pontos positivos / melhorar */}
            <div className="essay-feedback-grid">
              <div className="card">
                <h3 className="essay-feedback-title positivos">Pontos Positivos</h3>
                <ul className="essay-feedback-list">
                  {correction.pontos_positivos.map((p, i) => (
                    <li key={i}><CheckCircle size={14} className="icon-positive" />{p}</li>
                  ))}
                </ul>
              </div>
              <div className="card">
                <h3 className="essay-feedback-title melhorar">A Melhorar</h3>
                <ul className="essay-feedback-list">
                  {correction.pontos_melhorar.map((p, i) => (
                    <li key={i}><AlertCircle size={14} className="icon-improve" />{p}</li>
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
