import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Users, CalendarDays, Instagram, ExternalLink, Sparkles } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { Avatar, AvatarStack } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PostCardSkeleton } from '../components/ui/Skeleton';

const TABS = ['Posts', 'Events', 'Members'];

export default function ClubDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);

  const { data: clubData, isLoading } = useQuery({
    queryKey: qk.club(id),
    queryFn: () => api.get(`/api/clubs/${id}`),
    enabled: !!id,
  });

  const { data: postsData } = useQuery({
    queryKey: qk.clubPosts(id),
    queryFn: () => api.get(`/api/clubs/${id}/posts?limit=10`),
    enabled: !!id && activeTab === 0,
  });

  const { data: eventsData } = useQuery({
    queryKey: qk.clubEvents(id),
    queryFn: () => api.get(`/api/clubs/${id}/events?limit=10`),
    enabled: !!id && activeTab === 1,
  });

  const { data: membersData } = useQuery({
    queryKey: qk.clubMembers(id),
    queryFn: () => api.get(`/api/clubs/${id}/members?limit=30`),
    enabled: !!id && activeTab === 2,
  });

  const joinMutation = useMutation({
    mutationFn: () => club?.is_member
      ? api.delete(`/api/clubs/${id}/leave`)
      : api.post(`/api/clubs/${id}/join`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.club(id) }),
  });

  const club = clubData?.data || clubData;
  const posts = postsData?.data?.items || postsData?.items || [];
  const events = eventsData?.data?.items || eventsData?.items || [];
  const members = membersData?.data?.items || membersData?.items || [];

  if (isLoading) return <div style={{ padding: '40px' }}>Loading...</div>;
  if (!club) return <div style={{ padding: '40px' }}>Club not found</div>;

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Cover */}
      <div style={{
        width: '100%', height: '220px', position: 'relative',
        background: club.cover_gradient || 'linear-gradient(135deg, var(--brand-light), var(--accent-light))',
        overflow: 'hidden',
      }}>
        {club.banner_url && (
          <img src={club.banner_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: '20px', left: '40px', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={18} />
        </button>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 40px' }}>
        {/* Club info row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '-32px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 'var(--r-lg)',
              border: '4px solid var(--bg-page)', background: 'var(--bg-card)',
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-md)',
            }}>
              {club.logo_url
                ? <img src={club.logo_url} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontWeight: 800, fontSize: '28px', color: 'var(--brand)' }}>{club.name?.[0]}</span>
              }
            </div>
            <div style={{ paddingBottom: '4px' }}>
              <h1 className="h2" style={{ marginBottom: '4px' }}>{club.name}</h1>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Badge>{club.category}</Badge>
                {club.is_recruiting && <Badge variant="success" dot>Recruiting</Badge>}
              </div>
            </div>
          </div>
          <Button
            variant={club.is_member ? 'secondary' : 'primary'}
            loading={joinMutation.isPending}
            onClick={() => joinMutation.mutate()}
          >
            {club.is_member ? 'Leave club' : '+ Join club'}
          </Button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0', marginBottom: '24px', padding: '16px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          {[
            { label: 'Members', val: club.member_count || 0 },
            { label: 'Events', val: club.events_count || 0 },
            { label: 'Posts', val: club.posts_count || 0 },
          ].map((s, i) => (
            <div key={s.label} style={{ textAlign: 'center', borderRight: i < 2 ? '1px solid var(--border)' : 'none', padding: '8px 0' }}>
              <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '28px', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>{s.val}</p>
              <p className="caption">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Description */}
        <p className="body" style={{ color: 'var(--text-body)', marginBottom: '28px' }}>{club.description}</p>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '24px', gap: '0' }}>
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)} style={{
              padding: '10px 24px', fontFamily: 'inherit', fontSize: '14px', fontWeight: 500,
              color: activeTab === i ? 'var(--brand)' : 'var(--text-secondary)',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: `2px solid ${activeTab === i ? 'var(--brand)' : 'transparent'}`,
              marginBottom: '-1px', transition: 'all var(--t-fast)',
            }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Posts tab */}
        {activeTab === 0 && (
          <div>
            {posts.length === 0 ? (
              <p className="caption" style={{ textAlign: 'center', padding: '40px 0' }}>No posts yet.</p>
            ) : posts.map(p => (
              <div key={p.id} className="card" style={{ padding: '16px', marginBottom: '12px' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-body)', lineHeight: 1.6 }}>{p.content}</p>
                <p className="mono-sm" style={{ marginTop: '8px', color: 'var(--text-tertiary)' }}>
                  {p.created_at ? format(parseISO(p.created_at), 'MMM d · h:mm a') : ''}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Events tab */}
        {activeTab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {events.length === 0 ? (
              <p className="caption" style={{ padding: '40px 0' }}>No upcoming events.</p>
            ) : events.map(ev => (
              <div key={ev.id} className="card card-interactive" onClick={() => navigate(`/events/${ev.id}`)} style={{ padding: '16px' }}>
                <h4 className="h4" style={{ marginBottom: '8px' }}>{ev.title}</h4>
                <p className="caption">{ev.start_date ? format(parseISO(ev.start_date), 'MMM d · h:mm a') : ''}</p>
              </div>
            ))}
          </div>
        )}

        {/* Members tab */}
        {activeTab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {members.map(m => (
              <div key={m.id} className="card" style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate(`/profile/${m.id}`)}>
                <Avatar src={m.avatar_url} name={m.full_name} userId={m.id} size={40} />
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{m.full_name}</p>
                  <p className="caption">{m.role || m.department}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
