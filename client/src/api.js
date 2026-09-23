let onUnauthorizedCallback = null;

export function setUnauthorizedHandler(fn) {
    onUnauthorizedCallback = fn;
}

async function request(url, options = {}) {
    const isAuthLogin = url.includes('/api/auth/login');
    const isAuthMe = url.includes('/api/auth/me');

    const config = {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    };

    if (options.body && typeof options.body !== 'string') {
        config.body = JSON.stringify(options.body);
    }

    let res;
    try {
        res = await fetch(url, config);
    } catch (err) {
        throw new Error(err.message || 'Network error');
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        // On 401 from any protected endpoint (excluding login attempt and initial me check)
        if (res.status === 401 && !isAuthLogin && !isAuthMe && onUnauthorizedCallback) {
            onUnauthorizedCallback();
        }
        throw new Error(data.error || `Request failed (${res.status})`);
    }

    return data;
}

export const api = {
    get: (url, options) => request(url, { ...options, method: 'GET' }),
    post: (url, body, options) => request(url, { ...options, method: 'POST', body }),
    put: (url, body, options) => request(url, { ...options, method: 'PUT', body }),
    delete: (url, options) => request(url, { ...options, method: 'DELETE' }),
};

export default api;
