import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit2, UserPlus, UserCheck, MessageCircle, MapPin, BookOpen, CalendarDays } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../stores/authStore';
import { userCoverGradient } from '../lib/constants';
import { PostCardSkeleton } from '../components/ui/Skeleton';

const TABS = ['Posts', 'Activity'];

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const currentUser = useAuthStore(s => s.user);
  const isSelf = String(currentUser?.id) === String(id);
  const [activeTab, setActiveTab] = useState(0);

  const { data: profileData, isLoading } = useQuery({
    queryKey: qk.profile(id),
    queryFn: () => api.get(`/api/users/${id}`),
    enabled: !!id,
  });

  const { data: postsData } = useQuery({
    queryKey: qk.profilePosts(id),
    queryFn: () => api.get(`/api/users/${id}/posts?limit=10`),
    enabled: !!id && activeTab === 0,
  });

  const { data: activityData } = useQuery({
    queryKey: qk.activity(id),
    queryFn: () => api.get(`/api/users/${id}/activity`),
    enabled: !!id && activeTab === 1,
  });

  const followMutation = useMutation({
    mutationFn: () => user?.is_following
      ? api.delete(`/api/users/${id}/unfollow`)
      : api.post(`/api/users/${id}/follow`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.profile(id) }),
  });

  const user = profileData?.data || profileData;
  const posts = postsData?.data?.items || postsData?.items || [];
  const activity = activityData?.data || activityData || [];

  if (isLoading) return <div style={{ padding: '40px' }}><PostCardSkeleton /><PostCardSkeleton /></div>;
  if (!user) return <div style={{ padding: '40px' }}>User not found</div>;

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Cover */}
      <div style={{ height: '200px', background: userCoverGradient(id), position: 'relative', overflow: 'hidden' }}>
        {user.cover_url && (
          <img src={user.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: '20px', left: '40px', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.85)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={18} />
        </button>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 40px' }}>
        {/* Avatar + actions row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '-44px', marginBottom: '20px' }}>
          <div style={{ border: '4px solid var(--bg-page)', borderRadius: '50%', boxShadow: 'var(--shadow-md)' }}>
            <Avatar src={user.avatar_url} name={user.name} userId={user.id} size={88} status={user.status} />
          </div>
          <div style={{ display: 'flex', gap: '10px', paddingBottom: '4px' }}>
            {isSelf ? (
              <Button variant="secondary" icon={<Edit2 size={15} />} onClick={() => navigate('/profile/edit')}>
                Edit Profile
              </Button>
            ) : (
              <>
                <Button
                  variant={user.is_following ? 'secondary' : 'primary'}
                  icon={user.is_following ? <UserCheck size={15} /> : <UserPlus size={15} />}
                  loading={followMutation.isPending}
                  onClick={() => followMutation.mutate()}
                >
                  {user.is_following ? 'Following' : 'Follow'}
                </Button>
                <Button variant="secondary" icon={<MessageCircle size={15} />}>Message</Button>
              </>
            )}
          </div>
        </div>

        {/* Info */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <h2 className="h2" style={{ fontSize: '26px' }}>{user.name}</h2>
            {user.year && <Badge>{user.year}</Badge>}
          </div>
          <p className="caption" style={{ marginBottom: '10px' }}>@{user.username || user.enrollment_number || `user${user.id}`}</p>
          {user.bio && <p className="body" style={{ color: 'var(--text-body)', marginBottom: '12px', maxWidth: '560px' }}>{user.bio}</p>}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {user.department && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <BookOpen size={13} style={{ color: 'var(--brand)' }} />{user.department}
              </span>
            )}
            {user.hostel && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <MapPin size={13} style={{ color: 'var(--brand)' }} />{user.hostel}
              </span>
            )}
            {user.joined_at && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <CalendarDays size={13} style={{ color: 'var(--brand)' }} />Joined {format(parseISO(user.joined_at), 'MMM yyyy')}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '32px', padding: '16px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
          {[
            { label: 'Posts', val: user.posts_count || 0 },
            { label: 'Followers', val: user.followers_count || 0 },
            { label: 'Following', val: user.following_count || 0 },
          ].map(s => (
            <div key={s.label}>
              <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '22px', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>{s.val.toLocaleString()}</p>
              <p className="caption">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Interests */}
        {user.interests?.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {user.interests.map(i => (
              <span key={i} style={{ padding: '4px 12px', borderRadius: 'var(--r-full)', background: 'var(--bg-surface)', border: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {i}
              </span>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
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

        {/* Posts */}
        {activeTab === 0 && (
          <div>
            {posts.length === 0
              ? <p className="caption" style={{ textAlign: 'center', padding: '40px 0' }}>No posts yet</p>
              : posts.map(p => (
                <div key={p.id} className="card" style={{ padding: '16px', marginBottom: '12px', borderRadius: 'var(--r-lg)' }}>
                  <p style={{ fontSize: '15px', color: 'var(--text-body)', lineHeight: 1.65 }}>{p.content}</p>
                  <p className="mono-sm" style={{ marginTop: '8px', color: 'var(--text-tertiary)' }}>
                    {p.created_at ? format(parseISO(p.created_at), 'MMM d · h:mm a') : ''}
                  </p>
                </div>
              ))
            }
          </div>
        )}

        {/* Activity */}
        {activeTab === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activity.length === 0
              ? <p className="caption" style={{ textAlign: 'center', padding: '40px 0' }}>No activity yet</p>
              : activity.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px', background: 'var(--bg-card)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)', flexShrink: 0, marginTop: '6px' }} />
                  <div>
                    <p style={{ fontSize: '13px', color: 'var(--text-body)' }}>{a.description}</p>
                    <p className="mono-sm" style={{ color: 'var(--text-tertiary)', marginTop: '2px' }}>
                      {a.created_at ? format(parseISO(a.created_at), 'MMM d · h:mm a') : ''}
                    </p>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}
