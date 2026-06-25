// src/services/crowd.service.js
const db = require('../config/db');

// Returns 'low' | 'medium' | 'high'
const getCrowdLevel = async (locationId, category) => {
  const now      = new Date();
  const hour     = now.getHours();
  const isWeekend = [0, 6].includes(now.getDay());

  const rules = {
    library:  { high: [14, 15, 16, 17, 20, 21, 22], low: [6, 7, 8, 23, 0, 1, 2] },
    food:     { high: [7, 8, 12, 13, 19, 20],        low: [10, 11, 15, 16, 22, 23] },
    sports:   { high: [6, 7, 17, 18, 19],             low: [10, 11, 12, 13, 14] },
    hostel:   { high: [22, 23, 0, 6, 7, 8],           low: [10, 11, 12, 13, 14, 15] },
    academic: { high: [9, 10, 11, 14, 15, 16],        low: [6, 7, 18, 19, 20, 21, 22] },
    service:  { high: [9, 10, 11, 12, 16, 17],        low: [6, 7, 20, 21, 22, 23] },
    medical:  { high: [9, 10, 11, 12],                low: [19, 20, 21, 22, 23] },
  };

  const cat = category === 'library'  ? 'library'
            : category === 'food'     ? 'food'
            : category === 'sports'   ? 'sports'
            : category === 'hostel'   ? 'hostel'
            : category === 'academic' ? 'academic'
            : category === 'medical'  ? 'medical'
            : 'service';

  const rule    = rules[cat] || rules.service;
  let baseLevel = rule.high.includes(hour) ? 'high'
                : rule.low.includes(hour)  ? 'low'
                : 'medium';

  // Boost from recent check-ins (last 30 min)
  const { rows } = await db.query(
    `SELECT COUNT(*) FROM checkins
     WHERE location_id=$1 AND checked_in_at > NOW() - INTERVAL '30 minutes'`,
    [locationId]
  );
  const recentCount = parseInt(rows[0].count);
  if (recentCount >= 15) baseLevel = 'high';
  else if (recentCount >= 7 && baseLevel === 'low') baseLevel = 'medium';

  // Weekend boost for food/sports
  if (isWeekend && ['food', 'sports'].includes(cat) && hour >= 11 && hour <= 20)
    baseLevel = baseLevel === 'low' ? 'medium' : 'high';

  return baseLevel;
};

module.exports = { getCrowdLevel };
