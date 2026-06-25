require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });
const db = require('./src/config/db');

const MESS_NAMES = [
  'TAGORE - A MESS', 'TAGORE - B MESS', 'TAGORE - C MESS',
  'SHAKUNTALA BHAVAN - A MESS', 'SHAKUNTALA BHAVAN - B MESS',
  'TERESA BHAVAN - C MESS', 'TERESA BHAVAN - D MESS',
  'MEDICAL MESS', 'PIT MESS',
  'ATAL BHAVAN - A MESS', 'ATAL BHAVAN - B MESS',
  'AZAD MESS', 'SAROJINI C MESS 4', 'SHANTI SADAN MESS 2',
  'Rani Laxmi Bai B',
];

(async () => {
  try {
    for (let i = 0; i < MESS_NAMES.length; i++) {
      const id = i + 1;
      await db.query('UPDATE messes SET name = $1 WHERE id = $2', [MESS_NAMES[i], id]);
    }
    console.log('Messes updated successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error updating messes:', err);
    process.exit(1);
  }
})();
