// src/services/sse.service.js
// Map of userId → Set of Express response objects
const clients = new Map();

const addClient = (userId, res) => {
  if (!clients.has(userId)) clients.set(userId, new Set());
  const userClients = clients.get(userId);
  userClients.add(res);

  // Heartbeat every 30s to keep connection alive
  const hb = setInterval(() => {
    try { res.write(':heartbeat\n\n'); }
    catch (_) { clearInterval(hb); userClients.delete(res); }
  }, 30000);

  res.on('close', () => {
    clearInterval(hb);
    userClients.delete(res);
    if (userClients.size === 0) clients.delete(userId);
  });
};

const send = (userId, event, data) => {
  const userClients = clients.get(userId);
  if (!userClients) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of userClients) {
    try { client.write(payload); }
    catch (_) { userClients.delete(client); }
  }
};

const broadcast = (userIds, event, data) => {
  userIds.forEach((id) => send(id, event, data));
};

const onlineCount = () => {
  let count = 0;
  for (const set of clients.values()) count += set.size;
  return count;
};

module.exports = { addClient, send, broadcast, onlineCount };
