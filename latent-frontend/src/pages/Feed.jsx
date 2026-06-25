import React, { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import {
  Flame, Heart, SmilePlus, HandMetal, Zap,
  MessageCircle, Bookmark, Link2, MoreHorizontal,
  ImagePlus, BarChart2, CalendarPlus, MapPin, EyeOff,
  ChevronDown, ChevronUp, ArrowUp,
  Rss, TrendingUp, Users, Star, BookMarked, Ghost,
} from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { useAuthStore } from '../stores/authStore';
import { Avatar, AvatarStack } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { PostCardSkeleton } from '../components/ui/Skeleton';
import { EmptyFeed } from '../components/empty/EmptyState';
import { Badge } from '../components/ui/Badge';

const FILTERS = [
  { id: 'for_you',    label: 'For You',       icon: Star },
  { id: 'following',  label: 'Following',     icon: Users },
  { id: 'department', label: 'My Department', icon: BookMarked },
  { id: 'trending',   label: 'Trending',      icon: TrendingUp },
  { id: 'clubs',      label: 'My Clubs',      icon: Rss },
  { id: 'confessions',label: 'Confessions',   icon: Ghost },
];

const REACTIONS = [
  { type: 'fire',    icon: Flame,     label: 'Fire' },
  { type: 'heart',   icon: Heart,     label: 'Heart' },
  { type: 'haha',    icon: SmilePlus, label: 'Haha' },
  { type: 'support', icon: HandMetal, label: 'Support' },
  { type: 'insightful', icon: Zap,   label: 'Insightful' },
];

/* ─── Reaction Bar ─────────────────────────────────────────── */
function ReactionBar({ post, onReact }) {
  const user = useAuthStore(s => s.user);
  const userReaction = post.user_reaction;

  return (
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
      {REACTIONS.map(({ type, icon: Icon, label }) => {
        const count = post.reactions?.[type] || 0;
        const isActive = userReaction === type;
        return (
          <motion.button
            key={type}
            whileTap={{ scale: 0.92 }}
            onClick={() => onReact(type)}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '6px 12px', borderRadius: 'var(--r-full)',
              border: `1px solid ${isActive ? 'var(--brand-border)' : 'var(--border)'}`,
              background: isActive ? 'var(--brand-light)' : 'transparent',
              color: isActive ? 'var(--brand)' : 'var(--text-secondary)',
              cursor: 'pointer', fontFamily: 'inherit',
              fontSize: '12px', fontWeight: 500,
              transition: 'all var(--t-fast)',
            }}
          >
            <Icon size={14} />
            <AnimatePresence mode="popLayout">
              <motion.span
                key={count}
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 8, opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{ display: 'inline-block' }}
              >
                {count}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ─── PostCard ─────────────────────────────────────────────── */
function PostCard({ post }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const user = useAuthStore(s => s.user);
  const author = post.author || post.user || {};
  const content = post.content || '';
  const isLong = content.length > 280;

  const reactMutation = useMutation({
    mutationFn: ({ type, remove }) =>
      remove
        ? api.delete(`/api/feed/posts/${post.id}/react`)
        : api.post(`/api/feed/posts/${post.id}/react`, { reaction_type: type }),
    onMutate: async ({ type, remove }) => {
      await qc.cancelQueries({ queryKey: ['feed'] });
      // Fuzzy-match and update all feed queries optimistically
      qc.setQueriesData({ queryKey: ['feed'] }, (old) => {
        if (!old) return old;
        const pageToUpdate = old.data || old; // handle axios wrapping
        if (!pageToUpdate.items) return old;

        return {
          ...old,
          ...(old.data ? { data: { ...pageToUpdate, items: pageToUpdate.items.map(p => {
            if (p.id !== post.id) return p;
            const updatedReactions = { ...p.reactions };
            const prevReaction = p.user_reaction;
            
            if (prevReaction) updatedReactions[prevReaction] = Math.max(0, (updatedReactions[prevReaction] || 1) - 1);
            if (!remove) updatedReactions[type] = (updatedReactions[type] || 0) + 1;
            
            return { ...p, user_reaction: remove ? null : type, reactions: updatedReactions };
          })}} : { items: pageToUpdate.items.map(p => {
            if (p.id !== post.id) return p;
            const updatedReactions = { ...p.reactions };
            const prevReaction = p.user_reaction;
            if (prevReaction) updatedReactions[prevReaction] = Math.max(0, (updatedReactions[prevReaction] || 1) - 1);
            if (!remove) updatedReactions[type] = (updatedReactions[type] || 0) + 1;
            return { ...p, user_reaction: remove ? null : type, reactions: updatedReactions };
          })})
        };
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: () => api.post(`/api/feed/posts/${post.id}/comments`, { content: comment }),
    onSuccess: () => {
      setComment('');
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['post_comments', post.id] });
    },
  });

  const { data: commentsData } = useQuery({
    queryKey: ['post_comments', post.id],
    queryFn: () => api.get(`/api/feed/posts/${post.id}/comments`),
    enabled: showComments,
  });
  const comments = commentsData?.data?.items || commentsData?.items || [];

  const handleReact = (type) => {
    const remove = post.user_reaction === type;
    reactMutation.mutate({ type, remove });
  };

  return (
    <motion.div
      className="card"
      whileHover={{ y: -2, boxShadow: 'var(--shadow-card-hover)' }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      style={{ padding: '20px', marginBottom: '12px' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <Avatar
          src={post.is_anonymous ? null : author.avatar_url}
          name={post.is_anonymous ? 'A' : (author.full_name || author.name)}
          userId={author.id}
          size={44}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {post.is_anonymous ? <em style={{ color: 'var(--text-secondary)' }}>Anonymous Student</em> : (author.full_name || author.name)}
            </span>
            {!post.is_anonymous && author.department && (
              <Badge variant="default" style={{ fontSize: '11px', padding: '2px 8px' }}>
                {author.department}
              </Badge>
            )}
          </div>
          <p className="mono-sm" style={{ color: 'var(--text-tertiary)', marginTop: '2px' }}>
            {post.created_at ? formatDistanceToNow(parseISO(post.created_at), { addSuffix: true }) : ''}
          </p>
        </div>
        <button style={{ color: 'var(--text-tertiary)', display: 'flex', padding: '4px' }}>
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Content */}
      <div style={{ marginBottom: '14px' }}>
        <p style={{
          fontSize: '15px', lineHeight: 1.65, color: 'var(--text-body)',
          ...(isLong && !expanded ? {
            display: '-webkit-box', WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          } : {}),
        }}>
          {content.split(/(\s+)/).map((word, i) =>
            word.startsWith('#') || word.startsWith('@')
              ? <span key={i} style={{ color: 'var(--brand)', fontWeight: 500 }}>{word}</span>
              : word
          )}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ color: 'var(--brand)', fontSize: '13px', fontWeight: 500, marginTop: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {expanded ? 'See less' : 'See more'}
          </button>
        )}
      </div>

      {/* Images */}
      {post.image_urls?.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: post.image_urls.length === 1 ? '1fr' : '1fr 1fr',
          gap: '4px', marginBottom: '14px', borderRadius: 'var(--r-md)', overflow: 'hidden',
        }}>
          {post.image_urls.slice(0, 2).map((img, i) => (
            <img key={i} src={img} alt="" style={{
              width: '100%', height: post.image_urls.length === 1 ? '300px' : '180px',
              objectFit: 'cover', cursor: 'zoom-in',
            }} />
          ))}
        </div>
      )}

      {/* Check-in */}
      {post.post_type === 'check_in' && post.location && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '6px 12px', borderRadius: 'var(--r-full)',
          background: 'var(--brand-light)', marginBottom: '14px',
          fontSize: '13px', color: 'var(--brand-text)', fontWeight: 500,
        }}>
          <MapPin size={14} />
          {post.location.name}
        </div>
      )}

      {/* Reactions */}
      <ReactionBar post={post} onReact={handleReact} />

      {/* Footer actions */}
      <div style={{
        display: 'flex', gap: '16px', marginTop: '12px',
        paddingTop: '12px', borderTop: '1px solid var(--border)',
      }}>
        <button
          onClick={() => setShowComments(s => !s)}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500,
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <MessageCircle size={15} />
          {post.comment_count || 0} comments
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          <Bookmark size={15} />Save
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          <Link2 size={15} />Share
        </button>
      </div>

      {/* Comment thread */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', marginTop: '12px' }}
          >
            {comments.slice(0, 5).map((c, i) => (
              <div key={c.id || i} style={{
                display: 'flex', gap: '8px', padding: '8px 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <Avatar src={c.user?.avatar_url} name={c.user?.name} userId={c.user?.id} size={32} />
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {c.user?.name || 'User'}
                  </span>
                  <span className="mono-sm" style={{ color: 'var(--text-tertiary)', marginLeft: '8px' }}>
                    {c.created_at ? formatDistanceToNow(parseISO(c.created_at), { addSuffix: true }) : ''}
                  </span>
                  <p style={{ fontSize: '14px', color: 'var(--text-body)', marginTop: '2px' }}>{c.content}</p>
                </div>
              </div>
            ))}
            {/* Comment input */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <Avatar src={useAuthStore.getState().user?.avatar_url} name={useAuthStore.getState().user?.full_name} userId={useAuthStore.getState().user?.id} size={32} />
              <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                <input
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && commentMutation.mutate()}
                  placeholder="Write a comment..."
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 'var(--r-full)',
                    border: '1px solid var(--border)', background: 'var(--bg-surface)',
                    fontFamily: 'inherit', fontSize: '13px', outline: 'none',
                  }}
                />
                <Button size="sm" onClick={() => commentMutation.mutate()} loading={commentMutation.isPending}>Post</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Post Composer ────────────────────────────────────────── */
function PostComposer({ onPost, activeFilter }) {
  const user = useAuthStore(s => s.user);
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const submit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      await api.post('/api/feed/posts', { content, is_anonymous: anonymous });
      setContent(''); setExpanded(false); setAnonymous(false);
      qc.invalidateQueries({ queryKey: ['feed'] });
    } catch {}
    setLoading(false);
  };

  return (
    <div className="card" style={{ padding: '20px', marginBottom: '16px', borderRadius: 'var(--r-xl)' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Avatar src={user?.avatar_url} name={user?.full_name} userId={user?.id} size={40} />
        <div
          onClick={() => setExpanded(true)}
          style={{
            flex: 1, background: 'var(--bg-surface)', borderRadius: 'var(--r-md)',
            padding: '12px 14px', cursor: 'text',
            color: 'var(--text-tertiary)', fontSize: '15px',
          }}
        >
          What's happening on campus?
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={500}
              autoFocus
              style={{
                width: '100%', marginTop: '12px', minHeight: '100px',
                background: 'transparent', border: 'none', outline: 'none',
                fontFamily: 'inherit', fontSize: '15px', color: 'var(--text-body)',
                resize: 'none', lineHeight: 1.65,
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[
                  [ImagePlus, 'Photo'], [BarChart2, 'Poll'], [CalendarPlus, 'Event'],
                  [MapPin, 'Check-in'], [EyeOff, 'Anon'],
                ].map(([Icon, label]) => (
                  <button
                    key={label}
                    title={label}
                    onClick={label === 'Anon' ? () => setAnonymous(a => !a) : undefined}
                    style={{
                      width: 36, height: 36, borderRadius: 'var(--r-sm)',
                      background: label === 'Anon' && anonymous ? 'var(--brand-light)' : 'transparent',
                      color: label === 'Anon' && anonymous ? 'var(--brand)' : 'var(--text-tertiary)',
                      border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Icon size={18} />
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="mono-sm" style={{ color: content.length > 450 ? 'var(--danger)' : 'var(--text-tertiary)' }}>
                  {content.length}/500
                </span>
                <Button size="sm" loading={loading} onClick={submit} disabled={!content.trim()}>
                  Post
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Feed Page ────────────────────────────────────────────── */
export default function Feed() {
  const [activeFilter, setActiveFilter] = useState('for_you');
  const { ref: bottomRef, inView } = useInView();
  const [page, setPage] = useState(1);
  const user = useAuthStore(s => s.user);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: qk.feed(activeFilter),
    queryFn: () => api.get(`/api/feed/posts?filter=${activeFilter}&page=${page}&limit=15`),
    keepPreviousData: true,
  });

  const posts = data?.data?.items || data?.items || [];
  const hasMore = data?.data?.hasMore || data?.hasMore;

  return (
    <div style={{ padding: '28px 40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 260px', gap: '24px' }}>

        {/* Left filter sidebar */}
        <div style={{ position: 'sticky', top: '24px', height: 'fit-content' }}>
          <p className="label" style={{ marginBottom: '10px' }}>FEEDS</p>
          {FILTERS.map(({ id, label, icon: Icon }) => {
            const isActive = activeFilter === id;
            return (
              <button
                key={id}
                onClick={() => { setActiveFilter(id); setPage(1); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 12px', width: '100%', marginBottom: '2px',
                  borderRadius: 'var(--r-sm)',
                  background: isActive ? 'var(--brand-light)' : 'transparent',
                  color: isActive ? 'var(--brand-text)' : 'var(--text-secondary)',
                  borderLeftWidth: '2px', borderLeftStyle: 'solid', borderLeftColor: isActive ? 'var(--brand)' : 'transparent',
                  cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: '13px', fontWeight: 500, textAlign: 'left',
                  transition: 'all var(--t-fast)',
                }}
              >
                <Icon size={14} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Main feed */}
        <div>
          <PostComposer activeFilter={activeFilter} />

          {isLoading ? (
            [1,2,3].map(i => <PostCardSkeleton key={i} />)
          ) : posts.length === 0 ? (
            <EmptyFeed />
          ) : (
            <>
              {posts.map(post => <PostCard key={post.id} post={post} />)}
              {hasMore && <div ref={bottomRef} style={{ height: '20px' }} />}
              {isFetching && !isLoading && (
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <span className="caption">Loading more...</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ position: 'sticky', top: '24px', height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '16px 18px' }}>
            <p className="label" style={{ marginBottom: '12px' }}>Trending</p>
            {['#ParulFest2025','#ExamSeason','#NewHostelBlock','#MessReview','#PlacementAlerts'].map((tag, i) => (
              <div key={tag} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '7px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--brand)', fontWeight: 500 }}>{tag}</span>
                <span className="mono-sm" style={{ color: 'var(--text-tertiary)' }}>{[128,94,67,43,31][i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
