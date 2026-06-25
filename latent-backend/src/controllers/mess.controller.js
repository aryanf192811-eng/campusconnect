// src/controllers/mess.controller.js
const crypto  = require('crypto');
const db      = require('../config/db');
const razorpay = require('../config/razorpay');
const { ok, err } = require('../utils/response.utils');
const { getMealPrice, getValidUntil } = require('../utils/pricing.utils');
const { generateTicketId } = require('../utils/ticket.utils');
const notif = require('../services/notif.service');

/* ── helper: full coupon shape ───────────────────────────── */
const fullCoupon = async (couponId) => {
  const { rows } = await db.query(
    `SELECT mc.*,
       json_build_object('id',m.id,'name',m.name,'hostel_block',m.hostel_block) as mess
     FROM mess_coupons mc
     JOIN messes m ON m.id=mc.mess_id
     WHERE mc.id=$1`,
    [couponId]
  );
  return rows[0];
};

/* ── GET /api/mess/messes ────────────────────────────────── */
const getMesses = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT m.*, l.name as location_name
       FROM messes m LEFT JOIN locations l ON l.id=m.location_id
       WHERE m.is_active=TRUE ORDER BY m.name`
    );
    return ok(res, { items: rows });
  } catch (e) { next(e); }
};

/* ── GET /api/mess/today ─────────────────────────────────── */
const getToday = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user's default mess
    const { rows: users } = await db.query(
      'SELECT default_mess_id FROM users WHERE id=$1', [userId]
    );
    const messId = users[0]?.default_mess_id;
    if (!messId) return err(res, 'No default mess set', 'NO_DEFAULT_MESS', 400);

    const { rows: messes } = await db.query(
      'SELECT id,name,hostel_block FROM messes WHERE id=$1', [messId]
    );
    if (!messes.length) return err(res, 'Mess not found', 'NOT_FOUND', 404);

    const today = new Date();
    const dayOfWeek = today.getDay();
    const dateStr = today.toISOString().split('T')[0];

    // Menu for today
    const { rows: menu } = await db.query(
      'SELECT * FROM mess_menu WHERE mess_id=$1 AND day_of_week=$2',
      [messId, dayOfWeek]
    );
    const menuByMeal = {};
    menu.forEach((m) => { menuByMeal[m.meal_type] = m; });

    // Booked today
    const { rows: booked } = await db.query(
      `SELECT meal_type, id as coupon_id FROM mess_coupons
       WHERE user_id=$1 AND mess_id=$2 AND meal_date=CURRENT_DATE AND status='active'`,
      [userId, messId]
    );
    const bookedMeals = {};
    booked.forEach((b) => { bookedMeals[b.meal_type] = b.coupon_id; });

    return ok(res, {
      mess: messes[0],
      today: {
        date: dateStr,
        breakfast: {
          items: menuByMeal.breakfast?.items || [],
          price: getMealPrice('breakfast', dateStr),
          start: '06:00', end: '07:30',
          is_booked: !!bookedMeals.breakfast,
          coupon_id: bookedMeals.breakfast || null,
        },
        lunch: {
          items: menuByMeal.lunch?.items || [],
          price: getMealPrice('lunch', dateStr),
          start: '08:00', end: '13:30',
          is_booked: !!bookedMeals.lunch,
          coupon_id: bookedMeals.lunch || null,
        },
        dinner: {
          items: menuByMeal.dinner?.items || [],
          price: getMealPrice('dinner', dateStr),
          start: '14:00', end: '20:00',
          is_booked: !!bookedMeals.dinner,
          coupon_id: bookedMeals.dinner || null,
        },
      },
    });
  } catch (e) { next(e); }
};

/* ── GET /api/mess/menu ──────────────────────────────────── */
const getMenu = async (req, res, next) => {
  try {
    const { mess_id, date } = req.query;
    if (!mess_id) return err(res, 'mess_id is required', 'VALIDATION_ERROR');

    const d = date ? new Date(date) : new Date();
    const dayOfWeek = d.getDay();

    const { rows } = await db.query(
      'SELECT * FROM mess_menu WHERE mess_id=$1 AND day_of_week=$2 ORDER BY meal_type',
      [mess_id, dayOfWeek]
    );
    return ok(res, { items: rows });
  } catch (e) { next(e); }
};

/* ── GET /api/mess/menu/week ─────────────────────────────── */
const getWeekMenu = async (req, res, next) => {
  try {
    const { mess_id } = req.query;
    if (!mess_id) return err(res, 'mess_id is required', 'VALIDATION_ERROR');
    const { rows } = await db.query(
      'SELECT * FROM mess_menu WHERE mess_id=$1 ORDER BY day_of_week, meal_type',
      [mess_id]
    );
    return ok(res, { items: rows });
  } catch (e) { next(e); }
};

/* ── GET /api/mess/wallet ────────────────────────────────── */
const getWallet = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM mess_wallet WHERE user_id=$1', [req.user.id]);
    if (!rows.length) return ok(res, { balance: 0, transactions: [] });

    const { rows: txns } = await db.query(
      'SELECT * FROM wallet_transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    return ok(res, { balance: parseFloat(rows[0].balance), transactions: txns });
  } catch (e) { next(e); }
};

/* ── GET /api/mess/tickets ───────────────────────────────── */
const getTickets = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const status = req.query.status || 'active';

    const whereClause = status === 'past'
      ? `mc.meal_date < CURRENT_DATE OR mc.status IN ('used','expired')`
      : `mc.status='active' AND mc.meal_date >= CURRENT_DATE`;

    const { rows } = await db.query(
      `SELECT mc.*,
         json_build_object('id',m.id,'name',m.name,'hostel_block',m.hostel_block) as mess
       FROM mess_coupons mc
       JOIN messes m ON m.id=mc.mess_id
       WHERE mc.user_id=$1 AND (${whereClause})
       ORDER BY mc.meal_date DESC, mc.booked_at DESC`,
      [userId]
    );
    return ok(res, { items: rows });
  } catch (e) { next(e); }
};

/* ── GET /api/mess/tickets/:ticket_id ────────────────────── */
const getTicket = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT mc.*,
         json_build_object('id',m.id,'name',m.name,'hostel_block',m.hostel_block) as mess
       FROM mess_coupons mc
       JOIN messes m ON m.id=mc.mess_id
       WHERE mc.ticket_id=$1 AND mc.user_id=$2`,
      [req.params.ticket_id, req.user.id]
    );
    if (!rows.length) return err(res, 'Ticket not found', 'NOT_FOUND', 404);
    return ok(res, { ticket: rows[0] });
  } catch (e) { next(e); }
};

/* ── POST /api/mess/create-order ─────────────────────────── */
const createOrder = async (req, res, next) => {
  try {
    const { mess_id, meal_type, date, persons = 1 } = req.body;
    const userId = req.user.id;

    if (!mess_id || !meal_type || !date) return err(res, 'mess_id, meal_type, date are required', 'VALIDATION_ERROR');
    if (!['breakfast', 'lunch', 'dinner'].includes(meal_type)) return err(res, 'Invalid meal_type', 'VALIDATION_ERROR');
    if (new Date(date) < new Date(new Date().toDateString())) return err(res, 'Date cannot be in the past', 'VALIDATION_ERROR');
    if (persons < 1 || persons > 5) return err(res, 'Persons must be 1-5', 'VALIDATION_ERROR');

    const { rows: messes } = await db.query('SELECT id, name FROM messes WHERE id=$1 AND is_active=TRUE', [mess_id]);
    if (!messes.length) return err(res, 'Mess not found', 'NOT_FOUND', 404);

    const amount = getMealPrice(meal_type, date) * persons;

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount:   Math.round(amount * 100),
      currency: 'INR',
      receipt:  `latent_${Date.now()}`,
      notes:    { mess_id, meal_type, date, user_id: userId },
    });

    // Save pending order
    await db.query(
      `INSERT INTO mess_orders (user_id, mess_id, meal_type, meal_date, persons, amount, razorpay_order_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [userId, mess_id, meal_type, date, persons, amount, order.id]
    );

    return ok(res, {
      order_id: order.id,
      amount,
      currency: 'INR',
      mess_name: messes[0].name,
      meal_type,
      date,
      persons,
    });
  } catch (e) { next(e); }
};

/* ── POST /api/mess/verify-payment ───────────────────────── */
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, mess_id, meal_type, date, persons = 1 } = req.body;
    const userId = req.user.id;

    // Verify signature
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature)
      return err(res, 'Payment verification failed', 'SIG_MISMATCH', 400);

    // Server-side amount calculation
    const amount = getMealPrice(meal_type, date) * persons;

    // Update order
    await db.query(
      `UPDATE mess_orders SET status='paid', razorpay_payment_id=$1
       WHERE razorpay_order_id=$2 AND user_id=$3`,
      [razorpay_payment_id, razorpay_order_id, userId]
    );

    const { rows: ordRows } = await db.query(
      'SELECT id FROM mess_orders WHERE razorpay_order_id=$1', [razorpay_order_id]
    );
    const orderId = ordRows[0]?.id;

    const ticket_id = generateTicketId();
    const qr_data = JSON.stringify({ ticket_id, mess_id, meal_type, date, persons, user_id: userId });

    const { rows: messes } = await db.query('SELECT name FROM messes WHERE id=$1', [mess_id]);
    const mess_name = messes[0]?.name || '';

    const { rows: coup } = await db.query(
      `INSERT INTO mess_coupons
         (ticket_id, user_id, mess_id, order_id, meal_type, persons, amount, meal_date, valid_until, qr_data, payment_method, razorpay_payment_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'razorpay',$11)
       RETURNING id`,
      [ticket_id, userId, mess_id, orderId, meal_type, persons, amount, date, getValidUntil(meal_type), qr_data, razorpay_payment_id]
    );

    // Log wallet debit (informational only — actual payment was via Razorpay)
    await db.query(
      `INSERT INTO wallet_transactions (user_id, type, amount, description, ref_id, ref_type, balance_after)
       VALUES ($1,'debit',$2,$3,$4,'coupon',(SELECT balance FROM mess_wallet WHERE user_id=$1))`,
      [userId, amount, `${meal_type} at ${mess_name}`, coup[0].id]
    );

    // Notify user
    notif.createAndSend({
      userId, actorId: null, type: 'mess_booked',
      content: `Your ${meal_type} coupon at ${mess_name} is confirmed.`,
      refId: coup[0].id, refType: 'coupon',
    }).catch(() => {});

    const ticket = await fullCoupon(coup[0].id);
    return ok(res, { ticket });
  } catch (e) { next(e); }
};

/* ── POST /api/mess/book-wallet ──────────────────────────── */
const bookWallet = async (req, res, next) => {
  const client = await db.connect();
  try {
    const { mess_id, meal_type, date, persons = 1 } = req.body;
    const userId = req.user.id;

    if (!mess_id || !meal_type || !date) return err(res, 'mess_id, meal_type, date required', 'VALIDATION_ERROR');
    if (!['breakfast', 'lunch', 'dinner'].includes(meal_type)) return err(res, 'Invalid meal_type', 'VALIDATION_ERROR');
    if (persons < 1 || persons > 5) return err(res, 'Persons must be 1-5', 'VALIDATION_ERROR');

    const amount = getMealPrice(meal_type, date) * persons;

    const { rows: messes } = await db.query('SELECT name FROM messes WHERE id=$1 AND is_active=TRUE', [mess_id]);
    if (!messes.length) return err(res, 'Mess not found', 'NOT_FOUND', 404);
    const mess_name = messes[0].name;

    await client.query('BEGIN');

    // Atomic debit
    const debitRes = await client.query(
      `UPDATE mess_wallet SET balance=balance-$1, updated_at=NOW()
       WHERE user_id=$2 AND balance>=$1 RETURNING balance`,
      [amount, userId]
    );
    if (!debitRes.rows.length) {
      await client.query('ROLLBACK');
      return err(res, 'Insufficient wallet balance', 'INSUFFICIENT_BALANCE', 400);
    }
    const balanceAfter = parseFloat(debitRes.rows[0].balance);

    // Create order (paid)
    const { rows: ordRows } = await client.query(
      `INSERT INTO mess_orders (user_id, mess_id, meal_type, meal_date, persons, amount, status)
       VALUES ($1,$2,$3,$4,$5,$6,'paid') RETURNING id`,
      [userId, mess_id, meal_type, date, persons, amount]
    );
    const orderId = ordRows[0].id;

    const ticket_id = generateTicketId();
    const qr_data = JSON.stringify({ ticket_id, mess_id, meal_type, date, persons, user_id: userId });

    const { rows: coup } = await client.query(
      `INSERT INTO mess_coupons
         (ticket_id, user_id, mess_id, order_id, meal_type, persons, amount, meal_date, valid_until, qr_data, payment_method)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'wallet')
       RETURNING id`,
      [ticket_id, userId, mess_id, orderId, meal_type, persons, amount, date, getValidUntil(meal_type), qr_data]
    );
    const couponId = coup[0].id;

    await client.query(
      `INSERT INTO wallet_transactions (user_id,type,amount,description,ref_id,ref_type,balance_after)
       VALUES ($1,'debit',$2,$3,$4,'coupon',$5)`,
      [userId, amount, `${meal_type} at ${mess_name}`, couponId, balanceAfter]
    );

    await client.query('COMMIT');

    notif.createAndSend({
      userId, actorId: null, type: 'mess_booked',
      content: `Wallet payment for ${meal_type} at ${mess_name} confirmed.`,
      refId: couponId, refType: 'coupon',
    }).catch(() => {});

    const ticket = await fullCoupon(couponId);
    return ok(res, { ticket });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    next(e);
  } finally {
    client.release();
  }
};

module.exports = { getMesses, getToday, getMenu, getWeekMenu, getWallet, getTickets, getTicket, createOrder, verifyPayment, bookWallet };
