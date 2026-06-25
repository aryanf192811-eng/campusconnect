import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ChevronRight } from 'lucide-react';
import { format, addDays } from 'date-fns';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { toast } from 'sonner';
import { MESS_NAMES } from '../lib/constants';

const MEALS = ['Breakfast', 'Lunch', 'Dinner'];
const DAYS = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

function DatePill({ date, selected, onClick }) {
  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
      padding: '10px 16px', borderRadius: 'var(--r-lg)',
      border: `1px solid ${selected ? 'var(--brand)' : 'var(--border)'}`,
      background: selected ? 'var(--brand)' : 'var(--bg-card)',
      cursor: 'pointer', fontFamily: 'inherit', transition: 'all var(--t-fast)',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: '10px', fontWeight: 500, color: selected ? 'rgba(255,255,255,0.7)' : 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {isToday ? 'Today' : format(date, 'EEE')}
      </span>
      <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '22px', color: selected ? 'white' : 'var(--text-primary)', lineHeight: 1 }}>
        {format(date, 'd')}
      </span>
      <span style={{ fontSize: '10px', color: selected ? 'rgba(255,255,255,0.6)' : 'var(--text-tertiary)' }}>
        {format(date, 'MMM')}
      </span>
    </button>
  );
}

export default function MessBook() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(DAYS[0]);
  const [selectedMess, setSelectedMess] = useState('');
  const [selectedMeals, setSelectedMeals] = useState([]);
  const [persons, setPersons] = useState(1);

  const toggleMeal = (meal) =>
    setSelectedMeals(prev => prev.includes(meal) ? prev.filter(m => m !== meal) : [...prev, meal]);

  const { data: menuData, isLoading: menuLoading } = useQuery({
    queryKey: qk.messMenu(selectedMess, format(selectedDate, 'yyyy-MM-dd')),
    queryFn: () => api.get(`/api/mess/${selectedMess}/menu?date=${format(selectedDate, 'yyyy-MM-dd')}`),
    enabled: !!selectedMess,
  });

  const bookMutation = useMutation({
    mutationFn: () => api.post('/api/mess/book', {
      mess_id: selectedMess,
      date: format(selectedDate, 'yyyy-MM-dd'),
      meal_types: selectedMeals,
      persons,
    }),
    onSuccess: () => {
      toast.success('Meals booked successfully!');
      qc.invalidateQueries({ queryKey: qk.mess() });
      qc.invalidateQueries({ queryKey: qk.wallet() });
      navigate('/mess');
    },
    onError: (e) => toast.error(e.message),
  });

  const menu = menuData?.data || menuData;
  const mealPrices = { Breakfast: 50, Lunch: 80, Dinner: 70 };
  const total = selectedMeals.reduce((sum, m) => sum + (menu?.meals?.find(ml => ml.meal_type === m)?.price || mealPrices[m] || 0), 0) * persons;

  return (
    <div style={{ padding: '32px 40px', maxWidth: '720px', margin: '0 auto' }}>
      {/* Back */}
      <button onClick={() => navigate('/mess')} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', marginBottom: '24px' }}>
        <ArrowLeft size={16} /> Back to Mess
      </button>

      <h2 className="h2" style={{ marginBottom: '6px' }}>Book Meals</h2>
      <p className="caption" style={{ marginBottom: '32px' }}>Choose date, mess, and meals to pre-book</p>

      {/* Date selector */}
      <div className="card" style={{ padding: '20px', marginBottom: '20px', borderRadius: 'var(--r-xl)' }}>
        <p className="label" style={{ marginBottom: '14px' }}>Select date</p>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {DAYS.map(day => (
            <DatePill
              key={format(day, 'yyyy-MM-dd')}
              date={day}
              selected={format(selectedDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')}
              onClick={() => setSelectedDate(day)}
            />
          ))}
        </div>
      </div>

      {/* Mess selector */}
      <div className="card" style={{ padding: '20px', marginBottom: '20px', borderRadius: 'var(--r-xl)' }}>
        <p className="label" style={{ marginBottom: '14px' }}>Select mess</p>
        <select
          value={selectedMess}
          onChange={e => setSelectedMess(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--bg-surface)', fontFamily: 'inherit', fontSize: '14px', color: 'var(--text-primary)', outline: 'none' }}
        >
          <option value="">Choose a mess...</option>
          {MESS_NAMES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Meal selector */}
      <div className="card" style={{ padding: '20px', marginBottom: '20px', borderRadius: 'var(--r-xl)' }}>
        <p className="label" style={{ marginBottom: '14px' }}>Select meals</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {MEALS.map(meal => {
            const menuMeal = menu?.meals?.find(m => m.meal_type === meal);
            const price = menuMeal?.price || mealPrices[meal];
            const selected = selectedMeals.includes(meal);
            return (
              <button
                key={meal}
                onClick={() => toggleMeal(meal)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', borderRadius: 'var(--r-lg)',
                  border: `1.5px solid ${selected ? 'var(--brand)' : 'var(--border)'}`,
                  background: selected ? 'var(--brand-light)' : 'transparent',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all var(--t-fast)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>
                    {meal === 'Breakfast' ? '🌅' : meal === 'Lunch' ? '☀️' : '🌙'}
                  </span>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontWeight: 600, fontSize: '14px', color: selected ? 'var(--brand-text)' : 'var(--text-primary)' }}>{meal}</p>
                    {menuMeal?.start_time && (
                      <p className="mono-sm" style={{ color: 'var(--text-tertiary)' }}>{menuMeal.start_time} – {menuMeal.end_time}</p>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '16px', color: selected ? 'var(--brand)' : 'var(--text-primary)' }}>₹{price}</span>
                  {selected && <CheckCircle2 size={20} style={{ color: 'var(--brand)' }} />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Persons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>Number of persons</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setPersons(p => Math.max(1, p - 1))} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-surface)', cursor: 'pointer', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>−</button>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '20px', minWidth: '24px', textAlign: 'center' }}>{persons}</span>
            <button onClick={() => setPersons(p => Math.min(10, p + 1))} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-surface)', cursor: 'pointer', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>+</button>
          </div>
        </div>
      </div>

      {/* Summary + Book */}
      <div className="card" style={{ padding: '20px', borderRadius: 'var(--r-xl)', borderLeftWidth: '4px', borderLeftStyle: 'solid', borderLeftColor: 'var(--brand)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <p className="label">Order Summary</p>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '24px', color: 'var(--brand)', letterSpacing: '-0.03em' }}>₹{total}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
          {selectedMeals.length === 0
            ? <p className="caption">No meals selected</p>
            : selectedMeals.map(m => (
              <div key={m} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-body)' }}>
                <span>{m} × {persons}</span>
                <span className="mono-sm">₹{(menu?.meals?.find(ml => ml.meal_type === m)?.price || mealPrices[m] || 0) * persons}</span>
              </div>
            ))
          }
        </div>
        <Button
          fullWidth
          size="lg"
          disabled={selectedMeals.length === 0 || !selectedMess || total === 0}
          loading={bookMutation.isPending}
          onClick={() => bookMutation.mutate()}
          iconRight={<ChevronRight size={18} />}
        >
          Confirm Booking · ₹{total}
        </Button>
      </div>
    </div>
  );
}
