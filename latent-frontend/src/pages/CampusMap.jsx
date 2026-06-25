import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  BookOpen, UtensilsCrossed, Trophy, Home, Landmark,
  Cross, BookMarked, Search, ZoomIn, ZoomOut, Compass,
  Users, Clock, CheckCircle2, X,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { useMapStore } from '../stores/mapStore';
import { CAMPUS_LAT, CAMPUS_LNG } from '../lib/constants';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';

/* ─── Category config ──────────────────────────────────────── */
const CATEGORIES = [
  { id: 'all',      label: 'All' },
  { id: 'academic', label: 'Academic' },
  { id: 'food',     label: 'Food' },
  { id: 'sports',   label: 'Sports' },
  { id: 'hostel',   label: 'Hostel' },
  { id: 'service',  label: 'Services' },
  { id: 'medical',  label: 'Medical' },
  { id: 'library',  label: 'Library' },
];

const CAT_ICONS = {
  academic: BookOpen,
  food:     UtensilsCrossed,
  sports:   Trophy,
  hostel:   Home,
  service:  Landmark,
  medical:  Cross,
  library:  BookMarked,
};

const CROWD_COLORS = {
  low:    '#10B981',
  medium: '#F59E0B',
  high:   '#EF4444',
};

/* ─── Custom marker factory ────────────────────────────────── */
function makeMarkerIcon(category, crowdLevel, selected) {
  const Icon = CAT_ICONS[category] || Landmark;
  const crowdColor = CROWD_COLORS[crowdLevel] || CROWD_COLORS.low;

  const svgStr = renderToStaticMarkup(
    <div
      className={`campus-marker${selected ? ' selected' : ''}`}
      data-crowd={crowdLevel}
      data-category={category}
      style={{ position: 'relative', width: 40, height: 40 }}
    >
      <div
        className="marker-inner"
        style={{
          width: 40, height: 40, borderRadius: '50%',
          background: selected ? '#2563EB' : 'white',
          border: `2.5px solid ${selected ? '#2563EB' : crowdColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke={selected ? 'white' : crowdColor}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Simplified icon paths per category */}
          {category === 'food' && <><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></>}
          {category === 'academic' && <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>}
          {category === 'sports' && <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></>}
          {category === 'hostel' && <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>}
          {category === 'medical' && <><path d="M8 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3"/><path d="M11 5h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3"/><path d="M12 9v6"/><path d="M9 12h6"/></>}
          {category === 'library' && <><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/></>}
          {(category === 'service' || !CAT_ICONS[category]) && <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>}
        </svg>
      </div>
      {crowdLevel === 'high' && (
        <div className="marker-crowd-ring" />
      )}
    </div>
  );

  return L.divIcon({
    html: svgStr,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -24],
  });
}

/* ─── Map controller ───────────────────────────────────────── */
function MapController({ onZoomChange }) {
  const map = useMap();
  useMapEvents({
    zoomend: () => onZoomChange(map.getZoom()),
  });

  const flyHome = () => map.flyTo([CAMPUS_LAT, CAMPUS_LNG], 16, { duration: 1.2 });

  return (
    <div style={{
      position: 'absolute', bottom: '80px', right: '16px',
      zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px',
    }}>
      {[
        { icon: ZoomIn, action: () => map.zoomIn() },
        { icon: ZoomOut, action: () => map.zoomOut() },
        { icon: Compass, action: flyHome },
      ].map(({ icon: Icon, action }, i) => (
        <button
          key={i}
          onClick={action}
          style={{
            width: 44, height: 44, borderRadius: 'var(--r-md)',
            background: 'white', border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-primary)',
          }}
        >
          <Icon size={18} />
        </button>
      ))}
    </div>
  );
}

/* ─── Location Panel ───────────────────────────────────────── */
function LocationPanel({ location, onClose, todayCheckins }) {
  const qc = useQueryClient();
  const alreadyCheckedIn = todayCheckins?.some(c => c.location_id === location?.id);

  const checkinMutation = useMutation({
    mutationFn: () => api.post('/api/map/checkin', { location_id: location.id }),
    onSuccess: () => {
      toast.success(`Checked in at ${location.name}!`);
      qc.invalidateQueries({ queryKey: ['checkins', 'today'] });
      qc.invalidateQueries({ queryKey: qk.mapLocs() });
    },
    onError: (e) => toast.error(e.message),
  });

  const crowdColor = CROWD_COLORS[location?.crowd_level] || CROWD_COLORS.low;

  return (
    <motion.div
      initial={{ x: 340 }}
      animate={{ x: 0 }}
      exit={{ x: 340 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: '340px',
        zIndex: 500, background: 'var(--bg-card)',
        borderLeftWidth: '1px', borderLeftStyle: 'solid', borderLeftColor: 'var(--border)',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.08)',
        overflowY: 'auto', display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Location image / placeholder */}
      <div style={{
        width: '100%', height: '160px',
        background: `linear-gradient(135deg, ${crowdColor}20, ${crowdColor}40)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', flexShrink: 0,
      }}>
        {location?.image_url ? (
          <img src={location.image_url} alt={location.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ textAlign: 'center', color: crowdColor }}>
            {React.createElement(CAT_ICONS[location?.category] || Landmark, { size: 48, opacity: 0.6 })}
          </div>
        )}
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '12px', right: '12px',
            width: 32, height: 32, borderRadius: 'var(--r-full)',
            background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '20px', flex: 1 }}>
        <h3 className="h3" style={{ marginBottom: '8px' }}>{location?.name}</h3>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <Badge variant="default">
            {location?.category}
          </Badge>
          <Badge
            dot
            variant={location?.crowd_level === 'low' ? 'success' : location?.crowd_level === 'medium' ? 'warning' : 'danger'}
          >
            {location?.crowd_level ? `${location.crowd_level.charAt(0).toUpperCase() + location.crowd_level.slice(1)} crowd` : 'Unknown'}
          </Badge>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
            <Users size={14} />
            {location?.recent_checkins || 0} people here in the last 30 min
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
            <Clock size={14} />
            <span className="mono-sm">Updated just now</span>
          </div>
        </div>

        <Button
          fullWidth
          variant={alreadyCheckedIn ? 'ghost' : 'primary'}
          loading={checkinMutation.isPending}
          disabled={alreadyCheckedIn}
          onClick={() => !alreadyCheckedIn && checkinMutation.mutate()}
          icon={alreadyCheckedIn ? <CheckCircle2 size={16} /> : null}
        >
          {alreadyCheckedIn ? 'Checked in today ✓' : 'Check in here'}
        </Button>

        {location?.description && (
          <p className="body" style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>
            {location.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Campus Map Page ──────────────────────────────────────── */
export default function CampusMap() {
  const { selectedLocation, filterCategory, searchQuery, setSelectedLocation, setFilterCategory, setSearchQuery, setShowLabels } = useMapStore();
  const [zoom, setZoom] = useState(16);
  const mapRef = useRef(null);
  const markersRef = useRef({});

  const { data } = useQuery({
    queryKey: qk.mapLocs(),
    queryFn: () => api.get('/api/map/locations'),
    refetchInterval: 60_000,
  });

  const { data: checkinsData } = useQuery({
    queryKey: qk.checkinsToday(),
    queryFn: () => api.get('/api/map/checkins/today'),
  });

  const locations = data?.data?.items || data?.items || [];
  const todayCheckins = checkinsData?.data || checkinsData || [];

  const filtered = locations.filter(loc => {
    const matchCat = filterCategory === 'all' || loc.category === filterCategory;
    const matchSearch = !searchQuery || loc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  useEffect(() => {
    setShowLabels(zoom >= 17);
  }, [zoom, setShowLabels]);

  // Add markers to map
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Remove old markers
    Object.values(markersRef.current).forEach(m => map.removeLayer(m));
    markersRef.current = {};

    filtered.forEach(loc => {
      const selected = selectedLocation?.id === loc.id;
      const icon = makeMarkerIcon(loc.category, loc.crowd_level, selected);
      const marker = L.marker([loc.lat, loc.lng], { icon });

      marker.on('click', () => setSelectedLocation(loc));

      // Label at high zoom
      if (zoom >= 17) {
        const label = L.divIcon({
          html: `<div class="marker-label">${loc.name}</div>`,
          className: '',
          iconSize: 'auto',
          iconAnchor: [-4, -50],
        });
        L.marker([loc.lat, loc.lng], { icon: label, interactive: false }).addTo(map);
      }

      marker.addTo(map);
      markersRef.current[loc.id] = marker;
    });
  }, [filtered, selectedLocation, zoom]);

  return (
    <div style={{ height: '100vh', position: 'relative', overflow: 'hidden' }}>

      {/* Search + filter bar */}
      <div style={{
        position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 1000, display: 'flex', gap: '8px', alignItems: 'center',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'white', borderRadius: 'var(--r-full)',
          border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)',
          padding: '0 14px',
        }}>
          <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search locations..."
            style={{
              border: 'none', outline: 'none', background: 'transparent',
              fontFamily: 'inherit', fontSize: '13px', width: '180px',
              color: 'var(--text-primary)', padding: '10px 0',
            }}
          />
        </div>

        <div className="tab-bar" style={{ padding: '3px' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`tab-item${filterCategory === cat.id ? ' active' : ''}`}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: '24px', left: '16px', zIndex: 1000,
        background: 'white', border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)', padding: '10px 14px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {[['low','Low crowd'],['medium','Medium crowd'],['high','High crowd']].map(([level, label]) => (
          <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '3px 0' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: CROWD_COLORS[level] }} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Leaflet map */}
      <MapContainer
        center={[CAMPUS_LAT, CAMPUS_LNG]}
        zoom={16}
        minZoom={14}
        maxZoom={19}
        maxBounds={[[22.275, 73.350], [22.298, 73.380]]}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <MapController onZoomChange={setZoom} />
      </MapContainer>

      {/* Location detail panel */}
      <AnimatePresence>
        {selectedLocation && (
          <LocationPanel
            location={selectedLocation}
            onClose={() => setSelectedLocation(null)}
            todayCheckins={todayCheckins}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
