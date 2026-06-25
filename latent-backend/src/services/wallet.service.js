// src/services/wallet.service.js
const db = require('../config/db');

/**
 * Debit the mess wallet within an existing client/transaction.
 * Returns the new balance or throws on insufficient funds.
 */
const debit = async (client, userId, amount, description, refId, refType) => {
  // Atomic debit: fails silently if balance insufficient (returns 0 rows)
  const res = await client.query(
    `UPDATE mess_wallet
     SET balance = balance - $1, updated_at = NOW()
     WHERE user_id = $2 AND balance >= $1
     RETURNING balance`,
    [amount, userId]
  );
  if (!res.rows.length) throw new Error('INSUFFICIENT_BALANCE');

  const balanceAfter = parseFloat(res.rows[0].balance);

  await client.query(
    `INSERT INTO wallet_transactions
       (user_id, type, amount, description, ref_id, ref_type, balance_after)
     VALUES ($1,'debit',$2,$3,$4,$5,$6)`,
    [userId, amount, description, refId || null, refType || null, balanceAfter]
  );

  return balanceAfter;
};

/**
 * Credit the mess wallet.
 */
const credit = async (client, userId, amount, description, refId, refType) => {
  const res = await client.query(
    `UPDATE mess_wallet
     SET balance = balance + $1, updated_at = NOW()
     WHERE user_id = $2
     RETURNING balance`,
    [amount, userId]
  );

  const balanceAfter = parseFloat(res.rows[0].balance);

  await client.query(
    `INSERT INTO wallet_transactions
       (user_id, type, amount, description, ref_id, ref_type, balance_after)
     VALUES ($1,'credit',$2,$3,$4,$5,$6)`,
    [userId, amount, description, refId || null, refType || null, balanceAfter]
  );

  return balanceAfter;
};

module.exports = { debit, credit };
