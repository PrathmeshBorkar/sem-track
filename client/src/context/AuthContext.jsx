import { createContext, useContext, useState, useEffect } from 'react';
import api, { setUnauthorizedHandler } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Register session eviction callback
        setUnauthorizedHandler(() => {
            setUser(null);
        });

        // Initial check if user is already logged in via cookie
        api.get('/api/auth/me')
            .then((res) => {
                setUser(res.user);
            })
            .catch(() => {
                setUser(null);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/api/auth/login', { email, password });
        setUser(res.user);
        return res.user;
    };

    const register = async (name, email, password) => {
        const res = await api.post('/api/auth/register', { name, email, password });
        setUser(res.user);
        return res.user;
    };

    const logout = async () => {
        try {
            await api.post('/api/auth/logout');
        } finally {
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
}
