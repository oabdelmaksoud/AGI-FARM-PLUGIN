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

export async function apiPut(path, body = null) {
  const token = await getCsrfToken();
  const opts = {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-agi-farm-csrf': token },
  };
  if (body !== null) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  let payload = {};
  try { payload = await res.json(); } catch { payload = {}; }
  if (!res.ok) throw new Error(payload?.error || `request_failed_${res.status}`);
  return payload;
}

export async function apiDelete(path) {
  const token = await getCsrfToken();
  const res = await fetch(path, {
    method: 'DELETE',
    headers: { 'x-agi-farm-csrf': token },
  });
  let payload = {};
  try { payload = await res.json(); } catch { payload = {}; }
  if (!res.ok) throw new Error(payload?.error || `request_failed_${res.status}`);
  return payload;
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

export async function apiGet(path) {
  const res = await fetch(path);
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

export async function createJob(payload) {
  return apiPost('/api/jobs', payload);
}

export async function listJobs() {
  return apiGet('/api/jobs');
}

export async function cancelJob(jobId) {
  return apiPost(`/api/jobs/${jobId}/cancel`);
}

export async function retryJob(jobId) {
  return apiPost(`/api/jobs/${jobId}/retry`);
}

export async function listApprovals() {
  return apiGet('/api/approvals');
}

export async function approveApproval(id, note = '') {
  return apiPost(`/api/approvals/${id}/approve`, { note });
}

export async function rejectApproval(id, note = '') {
  return apiPost(`/api/approvals/${id}/reject`, { note });
}

export async function getUsage() {
  return apiGet('/api/usage');
}
