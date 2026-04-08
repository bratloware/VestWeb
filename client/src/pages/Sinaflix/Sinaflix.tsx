import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Play, X, Heart, Check, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { fetchVideos, toggleFavorite, updateProgress, Video } from '../../slices/videosSlice';
import { AppDispatch, RootState } from '../../store/store';
import './Sinaflix.css';

const VestWebFlix = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { videos, loading } = useSelector((state: RootState) => state.videos);
  const [search, setSearch] = useState('');
  const [activeSubject, setActiveSubject] = useState<string>('all');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    dispatch(fetchVideos({}));
  }, [dispatch]);

  const scrollRow = (subject: string, dir: 'left' | 'right') => {
    const el = scrollRefs.current[subject];
    if (el) el.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' });
  };

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return '';
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&\n?#]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : url;
  };

  const getYoutubeThumbnail = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&\n?#]+)/);
    return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : '';
  };

  const subjects = Array.from(new Set(videos.map(v => v.topic?.subject?.name).filter(Boolean)));

  const filtered = videos.filter(v => {
    const matchSearch = !search || v.title.toLowerCase().includes(search.toLowerCase());
    const matchSubject = activeSubject === 'all' || v.topic?.subject?.name === activeSubject;
    return matchSearch && matchSubject;
  });

  const groupedBySubject: Record<string, Video[]> = {};
  filtered.forEach(v => {
    const key = v.topic?.subject?.name || 'Outros';
    if (!groupedBySubject[key]) groupedBySubject[key] = [];
    groupedBySubject[key].push(v);
  });

  const handleToggleFavorite = (e: React.MouseEvent, videoId: number) => {
    e.stopPropagation();
    dispatch(toggleFavorite(videoId));
  };

  const handleMarkWatched = () => {
    if (!selectedVideo) return;
    dispatch(updateProgress({ id: selectedVideo.id, watched: true }));
  };

  return (
    <div className="VestWebFlix">
      <Sidebar />
      <div className="VestWebFlix-content">
        <div className="VestWebFlix-header">
          <h1>VestWebFlix</h1>
          <div className="VestWebFlix-search">
            <Search size={16} className="VestWebFlix-search-icon" />
            <input
              type="text"
              placeholder="Buscar videoaulas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="VestWebFlix-tabs">
          <button
            className={`VestWebFlix-tab${activeSubject === 'all' ? ' active' : ''}`}
            onClick={() => setActiveSubject('all')}
          >
            Todas
          </button>
          {subjects.map(s => (
            <button
              key={s}
              className={`VestWebFlix-tab${activeSubject === s ? ' active' : ''}`}
              onClick={() => setActiveSubject(s!)}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="VestWebFlix-body">
          {loading ? (
            <div className="VestWebFlix-loading">
              <div className="spinner" />
              <p>Carregando videoaulas...</p>
            </div>
          ) : Object.keys(groupedBySubject).length === 0 ? (
            <div className="VestWebFlix-loading">
              <Play size={48} style={{ color: 'rgba(255,255,255,0.2)', marginBottom: '16px' }} />
              <p>Nenhuma videoaula encontrada</p>
            </div>
          ) : (
            Object.entries(groupedBySubject).map(([subject, vids]) => (
              <div key={subject} className="VestWebFlix-row">
                <div className="VestWebFlix-row-header">
                  <div className="VestWebFlix-row-title">{subject}</div>
                  <div className="VestWebFlix-row-nav">
                    <button
                      className="VestWebFlix-row-nav-btn"
                      onClick={() => scrollRow(subject, 'left')}
                      aria-label="Rolar para esquerda"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      className="VestWebFlix-row-nav-btn"
                      onClick={() => scrollRow(subject, 'right')}
                      aria-label="Rolar para direita"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
                <div
                  className="VestWebFlix-videos-scroll"
                  ref={el => { scrollRefs.current[subject] = el; }}
                >
                  {vids.map(video => {
                    const thumb = video.thumbnail_url || getYoutubeThumbnail(video.youtube_url);
                    const isWatched = video.progress?.watched;
                    const hasProgress = (video.progress?.progress_seconds ?? 0) > 0;
                    return (
                      <div key={video.id} className="VestWebFlix-video-card" onClick={() => setSelectedVideo(video)}>
                        <div className="VestWebFlix-video-thumb">
                          {thumb && <img src={thumb} alt={video.title} />}
                          <div className="VestWebFlix-video-thumb-overlay" />
                          <div className="VestWebFlix-video-thumb-icon">
                            <Play size={20} style={{ marginLeft: '2px' }} />
                          </div>
                          {isWatched && (
                            <div className="VestWebFlix-watched-badge">
                              <Check size={10} />
                            </div>
                          )}
                          <button
                            className={`VestWebFlix-card-fav${video.isFavorite ? ' is-fav' : ''}`}
                            onClick={e => handleToggleFavorite(e, video.id)}
                            aria-label={video.isFavorite ? 'Remover favorito' : 'Favoritar'}
                          >
                            <Heart size={13} />
                          </button>
                          {(isWatched || hasProgress) && (
                            <div className="VestWebFlix-progress-bar">
                              <div
                                className={`VestWebFlix-progress-fill${isWatched ? ' watched' : ''}`}
                                style={{ width: isWatched ? '100%' : '35%' }}
                              />
                            </div>
                          )}
                        </div>
                        <div className="VestWebFlix-video-info">
                          <div className="VestWebFlix-video-title">{video.title}</div>
                          <div className="VestWebFlix-video-topic">{video.topic?.name || subject}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedVideo && (
        <div className="VestWebFlix-modal-overlay" onClick={() => setSelectedVideo(null)}>
          <div className="VestWebFlix-modal" onClick={e => e.stopPropagation()}>
            <div style={{ position: 'relative' }}>
              <div className="VestWebFlix-modal-video">
                <iframe
                  src={getYoutubeEmbedUrl(selectedVideo.youtube_url)}
                  title={selectedVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <button className="VestWebFlix-modal-close" onClick={() => setSelectedVideo(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="VestWebFlix-modal-body">
              <div className="VestWebFlix-modal-actions">
                <button className="VestWebFlix-modal-btn VestWebFlix-modal-btn-primary" onClick={handleMarkWatched}>
                  <Check size={16} />
                  Marcar como assistido
                </button>
                <button
                  className="VestWebFlix-modal-btn VestWebFlix-modal-btn-fav"
                  onClick={e => handleToggleFavorite(e, selectedVideo.id)}
                >
                  <Heart size={16} />
                  {selectedVideo.isFavorite ? 'Remover favorito' : 'Favoritar'}
                </button>
                <button className="VestWebFlix-modal-btn VestWebFlix-modal-btn-secondary" onClick={() => setSelectedVideo(null)}>
                  <X size={16} />
                  Fechar
                </button>
              </div>
              <h2 className="VestWebFlix-modal-title">{selectedVideo.title}</h2>
              <div className="VestWebFlix-modal-meta">
                {selectedVideo.topic?.subject?.name && <span>{selectedVideo.topic.subject.name} · </span>}
                {selectedVideo.topic?.name && <span>{selectedVideo.topic.name}</span>}
              </div>
              {selectedVideo.description && (
                <p className="VestWebFlix-modal-desc">{selectedVideo.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VestWebFlix;
