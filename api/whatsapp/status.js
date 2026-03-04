import { ensureConnectionForUser, getAuthenticatedUser, json, tryEvolutionEndpoints } from './_common.js';

function extractStatus(payload) {
  if (!payload) return 'unknown';
  if (typeof payload === 'string') return payload;
  return (
    payload.state ||
    payload.status ||
    payload.instance?.state ||
    payload.instance?.status ||
    payload.connectionStatus ||
    'unknown'
  );
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    json(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      json(res, 401, { error: 'Unauthorized' });
      return;
    }

    const connection = await ensureConnectionForUser(user);
    const instanceName = connection.instance_name;
    const payload = await tryEvolutionEndpoints(connection, [
      { method: 'GET', path: `/instance/connectionState/${encodeURIComponent(instanceName)}` },
      { method: 'GET', path: `/instance/state/${encodeURIComponent(instanceName)}` }
    ]);

    json(res, 200, {
      ok: true,
      instanceName,
      status: extractStatus(payload),
      payload
    });
  } catch (error) {
    json(res, 500, { error: error instanceof Error ? error.message : 'Unexpected error' });
  }
}
