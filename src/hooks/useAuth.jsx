import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

// Создаем контекст для аутентификации
const AuthContext = createContext(null);

// Провайдер контекста
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Проверяем статус авторизации при загрузке
    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        setLoading(false);
    }, []);

    // Регистрация пользователя
    const register = async (email, username, password) => {
        setLoading(true);
        setError(null);
        try {
            const user = await authService.register(email, username, password);
            setUser(user);
            return user;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Авторизация пользователя
    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const user = await authService.login(email, password);
            setUser(user);
            return user;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Выход из системы
    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const value = {
        user,
        loading,
        error,
        register,
        login,
        logout,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Хук для использования контекста аутентификации
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth должен использоваться внутри AuthProvider');
    }
    return context;
} 