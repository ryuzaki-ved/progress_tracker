import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
    id: number;
    username: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (username: string, password: string) => Promise<{ data: any; error: Error | null }>;
    signUp: (username: string, password: string) => Promise<{ data: any; error: Error | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check localStorage for persisted session
        const storedUser = localStorage.getItem('lifestock_user');
        const token = localStorage.getItem('lifestock_token');
        if (storedUser && token) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) { }
        } else {
            localStorage.removeItem('lifestock_user');
            localStorage.removeItem('lifestock_token');
        }
        setLoading(false);
    }, []);

    const signIn = async (username: string, password: string) => {
        try {
            const response = await fetch('/api/auth/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const result = await response.json();
            
            if (response.ok && result.data?.user) {
                const loggedInUser: User = result.data.user;
                setUser(loggedInUser);
                localStorage.setItem('lifestock_user', JSON.stringify(loggedInUser));
                localStorage.setItem('lifestock_token', result.data.token);
                return { data: loggedInUser, error: null };
            } else {
                return { data: null, error: new Error(result.error || 'Invalid username or password') };
            }
        } catch (err: any) {
            return { data: null, error: err };
        }
    };

    const signUp = async (username: string, password: string) => {
        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const result = await response.json();

            if (response.ok && result.data?.user) {
                const loggedInUser: User = result.data.user;
                setUser(loggedInUser);
                localStorage.setItem('lifestock_user', JSON.stringify(loggedInUser));
                localStorage.setItem('lifestock_token', result.data.token);
                return { data: loggedInUser, error: null };
            } else {
                return { data: null, error: new Error(result.error || 'Registration failed') };
            }
        } catch (err: any) {
            return { data: null, error: err };
        }
    };

    const signOut = async () => {
        setUser(null);
        localStorage.removeItem('lifestock_user');
        localStorage.removeItem('lifestock_token');
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

