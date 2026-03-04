import { ensureConnectionForUser, getAuthenticatedUser, json, tryEvolutionEndpoints } from './_common.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    await tryEvolutionEndpoints(connection, [
      { method: 'POST', path: `/instance/logout/${encodeURIComponent(instanceName)}` },
      { method: 'DELETE', path: `/instance/logout/${encodeURIComponent(instanceName)}` }
    ]);

    json(res, 200, { ok: true, instanceName });
  } catch (error) {
    json(res, 500, { error: error instanceof Error ? error.message : 'Unexpected error' });
  }
}
