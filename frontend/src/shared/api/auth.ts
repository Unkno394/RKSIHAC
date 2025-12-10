const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

const fetchJson = async (url: string, options: RequestInit, timeoutMs = 12000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
};

const parseErrorMessage = async (res: Response) => {
  try {
    const data = await res.json();
    if (typeof data?.detail === 'string') return data.detail;
    if (Array.isArray(data?.detail)) {
      const first = data.detail[0];
      if (typeof first === 'string') return first;
      if (first?.msg) return first.msg;
    }
    return 'Ошибка запроса';
  } catch {
    return 'Ошибка запроса';
  }
};

export const login = async (credentials: any) => {
  const res = await fetchJson(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }

  return res.json();
};

export const register = async (userData: any) => {
  const res = await fetchJson(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }

  return res.json();
};

export const forgotPassword = async (email: string) => {
  const res = await fetchJson(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
};

export const verifyResetCode = async (email: string, token: string) => {
  const res = await fetchJson(`${API_URL}/auth/verify-reset-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token }),
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
};

export const resetPassword = async (data: any) => {
  const res = await fetchJson(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
};
