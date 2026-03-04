let csrfTokenPromise = null;

async function loadCsrfToken() {
  const res = await fetch('/api/session');
  if (!res.ok) {
    throw new Error('failed_to_fetch_session');
  }
  const body = await res.json();
  if (!body?.csrfToken) {
    throw new Error('missing_csrf_token');
  }
  return body.csrfToken;
}

export async function getCsrfToken() {
  if (!csrfTokenPromise) {
    csrfTokenPromise = loadCsrfToken().catch((err) => {
      csrfTokenPromise = null;
      throw err;
    });
  }
  return csrfTokenPromise;
}

export async function apiPost(path, body = null) {
  const token = await getCsrfToken();
  const headers = {
    'Content-Type': 'application/json',
    'x-agi-farm-csrf': token,
  };

  const opts = {
    method: 'POST',
    headers,
  };
  if (body !== null) opts.body = JSON.stringify(body);

  const res = await fetch(path, opts);
  let payload = {};
  try {
    payload = await res.json();
  } catch {
    payload = {};
  }
  if (!res.ok) {
    throw new Error(payload?.error || `request_failed_${res.status}`);
  }
  return payload;
}
