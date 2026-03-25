import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Play, X, Heart, Check, Search } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { fetchVideos, toggleFavorite, updateProgress, Video } from '../../slices/videosSlice';
import { AppDispatch, RootState } from '../../store/store';
import './Sinaflix.css';

const Sinaflix = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { videos, loading } = useSelector((state: RootState) => state.videos);
  const [search, setSearch] = useState('');
  const [activeSubject, setActiveSubject] = useState<string>('all');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    dispatch(fetchVideos({}));
  }, [dispatch]);

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return '';
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&\n?#]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : url;
  };

  const getYoutubeThumbnail = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&\n?#]+)/);
    return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : '';
  };

  // Group by subject
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
    <div className="sinaflix">
      <Sidebar />
      <div className="sinaflix-content">
        <div className="sinaflix-header">
          <h1>SINAFLIX</h1>
          <div className="sinaflix-search">
            <input
              type="text"
              placeholder="Buscar videoaulas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
          </div>
        </div>

        <div className="sinaflix-tabs">
          <button
            className={`sinaflix-tab${activeSubject === 'all' ? ' active' : ''}`}
            onClick={() => setActiveSubject('all')}
          >
            Todas
          </button>
          {subjects.map(s => (
            <button
              key={s}
              className={`sinaflix-tab${activeSubject === s ? ' active' : ''}`}
              onClick={() => setActiveSubject(s!)}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="sinaflix-body">
          {loading ? (
            <div className="sinaflix-loading">
              <div className="spinner" />
              <p>Carregando videoaulas...</p>
            </div>
          ) : Object.keys(groupedBySubject).length === 0 ? (
            <div className="sinaflix-loading">
              <Play size={48} style={{ color: 'rgba(255,255,255,0.2)', marginBottom: '16px' }} />
              <p>Nenhuma videoaula encontrada</p>
            </div>
          ) : (
            Object.entries(groupedBySubject).map(([subject, vids]) => (
              <div key={subject} className="sinaflix-row">
                <div className="sinaflix-row-title">{subject}</div>
                <div className="sinaflix-videos-scroll">
                  {vids.map(video => {
                    const thumb = video.thumbnail_url || getYoutubeThumbnail(video.youtube_url);
                    return (
                      <div key={video.id} className="sinaflix-video-card" onClick={() => setSelectedVideo(video)}>
                        <div className="sinaflix-video-thumb">
                          {thumb && <img src={thumb} alt={video.title} />}
                          <div className="sinaflix-video-thumb-icon">
                            <Play size={20} style={{ marginLeft: '2px' }} />
                          </div>
                        </div>
                        <div className="sinaflix-video-info">
                          <div className="sinaflix-video-title">{video.title}</div>
                          <div className="sinaflix-video-topic">{video.topic?.name || subject}</div>
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
        <div className="sinaflix-modal-overlay" onClick={() => setSelectedVideo(null)}>
          <div className="sinaflix-modal" onClick={e => e.stopPropagation()}>
            <div style={{ position: 'relative' }}>
              <div className="sinaflix-modal-video">
                <iframe
                  src={getYoutubeEmbedUrl(selectedVideo.youtube_url)}
                  title={selectedVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <button className="sinaflix-modal-close" onClick={() => setSelectedVideo(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="sinaflix-modal-body">
              <div className="sinaflix-modal-actions">
                <button className="sinaflix-modal-btn sinaflix-modal-btn-primary" onClick={handleMarkWatched}>
                  <Check size={16} />
                  Marcar como assistido
                </button>
                <button
                  className="sinaflix-modal-btn sinaflix-modal-btn-fav"
                  onClick={e => handleToggleFavorite(e, selectedVideo.id)}
                >
                  <Heart size={16} />
                  {selectedVideo.isFavorite ? 'Remover favorito' : 'Favoritar'}
                </button>
                <button className="sinaflix-modal-btn sinaflix-modal-btn-secondary" onClick={() => setSelectedVideo(null)}>
                  <X size={16} />
                  Fechar
                </button>
              </div>
              <h2 className="sinaflix-modal-title">{selectedVideo.title}</h2>
              <div className="sinaflix-modal-meta">
                {selectedVideo.topic?.subject?.name && <span>{selectedVideo.topic.subject.name} · </span>}
                {selectedVideo.topic?.name && <span>{selectedVideo.topic.name}</span>}
              </div>
              {selectedVideo.description && (
                <p className="sinaflix-modal-desc">{selectedVideo.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sinaflix;
