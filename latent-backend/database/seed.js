// database/seed.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db   = require('../src/config/db');
const bcrypt = require('bcryptjs');

// Seed script placeholders as provided in prompt

const locations = [
  {name:'A Block — Engineering', category:'academic', lat:22.28775, lng:73.36570, description:'Main engineering and technology block'},
  {name:'DS Building', category:'academic', lat:22.28725, lng:73.36670, description:'Design and computer science block'},
  {name:'MBA Block', category:'academic', lat:22.28475, lng:73.36320, description:'Faculty of Management Studies'},
  {name:'Pharmacy Block', category:'academic', lat:22.28575, lng:73.36470, description:'Faculty of Pharmacy and Research'},
  {name:'Law Faculty', category:'academic', lat:22.28825, lng:73.36395, description:'Faculty of Law'},
  {name:'Architecture Block', category:'academic', lat:22.28650, lng:73.36770, description:'Faculty of Architecture and Planning'},
  {name:'Central Library', category:'library', lat:22.28550, lng:73.36420, description:'235,000+ books, digital resources, reading rooms'},
  {name:'Main Food Court', category:'food', lat:22.28375, lng:73.36345, description:'Primary multi-cuisine food court'},
  {name:'Capitol Food Court', category:'food', lat:22.28925, lng:73.36595, description:'North campus food court'},
  {name:'Utopian Food Court', category:'food', lat:22.28725, lng:73.36195, description:'West side food court, multiple options'},
  {name:'Campus Supermarket', category:'service', lat:22.28450, lng:73.36495, description:'Groceries, daily essentials, stationery'},
  {name:'Cricket Ground', category:'sports', lat:22.29025, lng:73.36320, description:'Full-size cricket ground with floodlights'},
  {name:'Football Ground', category:'sports', lat:22.29300, lng:73.36400, description:'FIFA-standard football pitch'},
  {name:'Sports Complex', category:'sports', lat:22.28900, lng:73.36395, description:'Basketball, volleyball, tennis, badminton courts'},
  {name:'Swimming Pool', category:'sports', lat:22.28850, lng:73.36545, description:'Olympic-size swimming pool'},
  {name:'PU Gym', category:'sports', lat:22.28750, lng:73.36620, description:'Modern gym with certified trainers'},
  {name:'Tagore Hostel', category:'hostel', lat:22.28150, lng:73.36320, description:'Messes: Tagore A, B, C'},
  {name:'Shakuntala Hostel', category:'hostel', lat:22.28100, lng:73.36400, description:'Messes: Shakuntala A, B'},
  {name:'Teresa Hostel', category:'hostel', lat:22.28000, lng:73.36500, description:'Messes: Teresa C, D'},
  {name:'Atal Hostel', category:'hostel', lat:22.28075, lng:73.36395, description:'Messes: Atal A, B'},
  {name:'North Hostels Block', category:'hostel', lat:22.29650, lng:73.36150, description:'Azad, Sarojini, Shanti Sadan blocks'},
  {name:'PU Main Gate', category:'service', lat:22.28600, lng:73.35900, description:'Main entrance — 173 ft Greek architecture gate'},
  {name:'PU Circle', category:'service', lat:22.28575, lng:73.36395, description:'Central roundabout, heart of campus'},
  {name:'Admin Block', category:'service', lat:22.28600, lng:73.36320, description:'Administrative offices, registrar'},
  {name:'Amphitheatre', category:'service', lat:22.28775, lng:73.36720, description:'Open-air performance and event space'},
  {name:"Watcher's Park",        category:'service',  lat:22.2855, lng:73.3652, description:'Student recreation area and movie screening'},
  {name:'ATM & Bank', category:'service', lat:22.28475, lng:73.36270, description:'Multiple ATMs and banking facilities'},
  {name:'PU Hospital', category:'medical', lat:22.28900, lng:73.37100, description:'750-bed multi-specialty hospital, 24/7'},
  {name:'Student Medical Center', category:'medical', lat:22.28625, lng:73.36445, description:'Student health center, first aid, clinic'},
];

const messes = [
  {name:'TAGORE - A MESS',    hostel_block:'Tagore Hostel'},
  {name:'TAGORE - B MESS',    hostel_block:'Tagore Hostel'},
  {name:'TAGORE - C MESS',    hostel_block:'Tagore Hostel'},
  {name:'SHAKUNTALA BHAVAN - A MESS',hostel_block:'Shakuntala Hostel'},
  {name:'SHAKUNTALA BHAVAN - B MESS',hostel_block:'Shakuntala Hostel'},
  {name:'TERESA BHAVAN - C MESS',    hostel_block:'Teresa Hostel'},
  {name:'TERESA BHAVAN - D MESS',    hostel_block:'Teresa Hostel'},
  {name:'MEDICAL MESS',     hostel_block:'Medical Block'},
  {name:'PIT MESS',         hostel_block:'PIT Block'},
  {name:'ATAL BHAVAN - A MESS',      hostel_block:'Atal Hostel'},
  {name:'ATAL BHAVAN - B MESS',      hostel_block:'Atal Hostel'},
  {name:'AZAD MESS',        hostel_block:'North Hostel'},
  {name:'SAROJINI C MESS 4',  hostel_block:'North Hostel'},
  {name:'SHANTI SADAN MESS 2',hostel_block:'Shanti Sadan'},
  {name:'Rani Laxmi Bai B', hostel_block:'Girls Hostel'},
];

(async () => {
  console.log('🌱 Seeding Latent database...\n');
  
  try {
    const HASH = await bcrypt.hash('password123', 12);

    // 1. Locations
    for (const l of locations) {
      await db.query(
        `INSERT INTO locations (name, category, lat, lng, description) VALUES ($1,$2,$3,$4,$5)`,
        [l.name, l.category, l.lat, l.lng, l.description]
      );
    }
    console.log('✅ Inserted locations');

    // 2. Messes
    for (const m of messes) {
      await db.query(
        `INSERT INTO messes (name, hostel_block) VALUES ($1,$2)`,
        [m.name, m.hostel_block]
      );
    }
    console.log('✅ Inserted messes');

    // Dummy user for testing
    const { rows: u } = await db.query(
      `INSERT INTO users (name, email, password_hash, department, year, campus_status, default_mess_id, onboarding_complete)
       VALUES ('Demo User', 'demo@latent.com', $1, 'CSE', 3, 'free', 1, TRUE) RETURNING id`,
      [HASH]
    );
    await db.query('INSERT INTO mess_wallet (user_id, balance) VALUES ($1, 2500.00)', [u[0].id]);
    console.log('✅ Created demo user (demo@latent.com / password123)');

    console.log('✅ Seed complete. (Note: Only partial seed implemented as per prompt snippet)');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  } finally {
    process.exit(0);
  }
})();
