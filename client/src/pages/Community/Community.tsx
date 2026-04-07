import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, MessageSquare, Flag, Trophy, Send, Award } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { fetchPosts, createPost, likePost, fetchComments, addComment, fetchRanking, Post } from '../../slices/communitySlice';
import { AppDispatch, RootState } from '../../store/store';
import './Community.css';

const Community = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { posts, comments, ranking, loading } = useSelector((s: RootState) => s.community);
  const { student } = useSelector((s: RootState) => s.auth);

  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState('');
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [commentInput, setCommentInput] = useState<Record<number, string>>({});

  useEffect(() => {
    dispatch(fetchPosts(1));
    dispatch(fetchRanking());
  }, [dispatch]);

  const handleExpandComments = (postId: number) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      dispatch(fetchComments(postId));
    }
  };

  const handleCreatePost = () => {
    if (!postContent.trim()) return;
    dispatch(createPost({ content: postContent, image_url: postImage || undefined }));
    setPostContent('');
    setPostImage('');
  };

  const handleLike = (postId: number) => {
    dispatch(likePost(postId));
  };

  const handleAddComment = (postId: number) => {
    const content = commentInput[postId];
    if (!content?.trim()) return;
    dispatch(addComment({ postId, content }));
    setCommentInput(prev => ({ ...prev, [postId]: '' }));
  };

  const getInitials = (name: string) => name ? name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : '?';

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const postComments = expandedPost !== null ? comments.filter(c => c.post_id === expandedPost) : [];

  return (
    <div className="community-page">
      <Sidebar />
      <main className="page-content">
        <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 800 }}>Comunidade</h1>

        <div className="community-layout">
          {/* Feed */}
          <div className="post-feed">
            {/* Create Post */}
            <div className="create-post">
              <div className="create-post-header">
                <div className="create-post-avatar">{student ? getInitials(student.name) : 'A'}</div>
                <textarea
                  placeholder="O que voce quer compartilhar hoje?"
                  value={postContent}
                  onChange={e => setPostContent(e.target.value)}
                />
              </div>
              <div className="create-post-actions">
                <div className="create-post-image">
                  <input
                    type="text"
                    placeholder="URL da imagem (opcional)"
                    value={postImage}
                    onChange={e => setPostImage(e.target.value)}
                  />
                </div>
                <button
                  className="btn-primary"
                  onClick={handleCreatePost}
                  disabled={!postContent.trim()}
                  style={{ padding: '8px 20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={15} />
                  Publicar
                </button>
              </div>
            </div>

            {loading && posts.length === 0 ? (
              <div className="spinner" />
            ) : posts.length === 0 ? (
              <div className="empty-state">
                <MessageSquare size={40} />
                <h3>Nenhuma publicacao ainda</h3>
                <p>Seja o primeiro a compartilhar algo com a comunidade!</p>
              </div>
            ) : (
              posts.map((post: Post) => (
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <div className="post-avatar">
                      {post.student?.avatar_url ? (
                        <img src={post.student.avatar_url} alt={post.student.name} />
                      ) : (
                        getInitials(post.student?.name || 'A')
                      )}
                    </div>
                    <div className="post-author-info">
                      <h4>{post.student?.name || 'Aluno'}</h4>
                      <span>{timeAgo(post.created_at)}</span>
                    </div>
                  </div>

                  <p className="post-content">{post.content}</p>
                  {post.image_url && (
                    <img src={post.image_url} alt="Post" className="post-image" onError={e => (e.currentTarget.style.display = 'none')} />
                  )}

                  <div className="post-actions">
                    <button
                      className={`post-action-btn${post.liked_by_me ? ' liked' : ''}`}
                      onClick={() => handleLike(post.id)}
                    >
                      <Heart size={16} fill={post.liked_by_me ? 'currentColor' : 'none'} />
                      {post.like_count || 0}
                    </button>
                    <button
                      className="post-action-btn"
                      onClick={() => handleExpandComments(post.id)}
                    >
                      <MessageSquare size={16} />
                      {post.comment_count || 0}
                    </button>
                    <button
                      className="post-action-btn"
                      onClick={() => {
                        const reason = prompt('Motivo do report:');
                        if (reason) {
                          import('../../api/api').then(({ default: api }) => {
                            api.post(`/community/posts/${post.id}/report`, { reason });
                          });
                        }
                      }}
                      style={{ marginLeft: 'auto' }}
                    >
                      <Flag size={15} />
                    </button>
                  </div>

                  {expandedPost === post.id && (
                    <div className="post-comments">
                      {postComments.map(comment => (
                        <div key={comment.id} className="comment-item">
                          <div className="comment-avatar">{getInitials(comment.student?.name || 'A')}</div>
                          <div className="comment-body">
                            <div className="comment-author">{comment.student?.name || 'Aluno'}</div>
                            <div className="comment-text">{comment.content}</div>
                          </div>
                        </div>
                      ))}

                      <div className="add-comment">
                        <input
                          type="text"
                          placeholder="Escreva um comentario..."
                          value={commentInput[post.id] || ''}
                          onChange={e => setCommentInput(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && handleAddComment(post.id)}
                        />
                        <button onClick={() => handleAddComment(post.id)}>
                          Enviar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="community-sidebar">
            <div className="ranking-card">
              <h3><Trophy size={18} color="#f59e0b" /> Ranking</h3>
              {ranking.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '16px' }}>
                  Nenhum dado ainda.
                </p>
              ) : (
                ranking.slice(0, 10).map((entry: any, i: number) => (
                  <div key={entry.student_id} className="ranking-item">
                    <div className={`ranking-position${i < 3 ? ` top-${i + 1}` : ''}`}>
                      {i < 3 ? <Award size={16} color={i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : '#b45309'} /> : `${i + 1}`}
                    </div>
                    <div className="ranking-avatar">
                      {getInitials(entry.student?.name || 'A')}
                    </div>
                    <div className="ranking-name">{entry.student?.name || 'Aluno'}</div>
                    <div className="ranking-points">{entry.total_points} pts</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Community;
