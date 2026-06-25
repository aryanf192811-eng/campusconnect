require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'latent',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const locations = [
  {name:'A Block — Engineering', lat:22.28775, lng:73.36570},
  {name:'DS Building', lat:22.28725, lng:73.36670},
  {name:'MBA Block', lat:22.28475, lng:73.36320},
  {name:'Pharmacy Block', lat:22.28575, lng:73.36470},
  {name:'Law Faculty', lat:22.28825, lng:73.36395},
  {name:'Architecture Block', lat:22.28650, lng:73.36770},
  {name:'Central Library', lat:22.28550, lng:73.36420},
  {name:'Main Food Court', lat:22.28375, lng:73.36345},
  {name:'Capitol Food Court', lat:22.28925, lng:73.36595},
  {name:'Utopian Food Court', lat:22.28725, lng:73.36195},
  {name:'Campus Supermarket', lat:22.28450, lng:73.36495},
  {name:'Cricket Ground', lat:22.29025, lng:73.36320},
  {name:'Football Ground', lat:22.29300, lng:73.36400},
  {name:'Sports Complex', lat:22.28900, lng:73.36395},
  {name:'Swimming Pool', lat:22.28850, lng:73.36545},
  {name:'PU Gym', lat:22.28750, lng:73.36620},
  {name:'Tagore Hostel', lat:22.28150, lng:73.36320},
  {name:'Shakuntala Hostel', lat:22.28100, lng:73.36400},
  {name:'Teresa Hostel', lat:22.28000, lng:73.36500},
  {name:'Atal Hostel', lat:22.28075, lng:73.36395},
  {name:'North Hostels Block', lat:22.29650, lng:73.36150},
  {name:'PU Main Gate', lat:22.28600, lng:73.35900},
  {name:'PU Circle', lat:22.28575, lng:73.36395},
  {name:'Admin Block', lat:22.28600, lng:73.36320},
  {name:'Amphitheatre', lat:22.28775, lng:73.36720},
  {name:"Watcher's Park", lat:22.2855, lng:73.3652},
  {name:'ATM & Bank', lat:22.28475, lng:73.36270},
  {name:'PU Hospital', lat:22.28900, lng:73.37100},
  {name:'Student Medical Center', lat:22.28625, lng:73.36445},
];

(async () => {
  try {
    for (const l of locations) {
      await pool.query('UPDATE locations SET lat=$1, lng=$2 WHERE name=$3', [l.lat, l.lng, l.name]);
    }
    console.log('Database locations updated successfully!');
  } catch (err) {
    console.error('Error', err);
  } finally {
    process.exit(0);
  }
})();
