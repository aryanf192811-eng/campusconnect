// src/utils/ticket.utils.js
// Generates a unique mess coupon ticket ID
const generateTicketId = () =>
  `TKT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

module.exports = { generateTicketId };
