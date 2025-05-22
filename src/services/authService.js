import { User } from '../models/User';

// Имитация API для аутентификации (в реальном проекте здесь должен быть реальный API)
const STORAGE_KEY = 'pathfinding_auth_user';
const USERS_STORAGE_KEY = 'pathfinding_users';

/**
 * Сервис для управления аутентификацией пользователя
 */
export const authService = {
    /**
     * Регистрация нового пользователя
     * @param {string} email 
     * @param {string} username 
     * @param {string} password 
     * @returns {Promise<User>}
     */
    async register(email, username, password) {
        console.log('Попытка регистрации:', { email, username });
        
        // Имитация API запроса
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    // Проверяем, нет ли уже такого пользователя
                    const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
                    console.log('Текущие пользователи:', usersJson);
                    
                    const users = JSON.parse(usersJson || '[]');
                    const existingUser = users.find(u => u.email === email);
                    
                    if (existingUser) {
                        console.error('Пользователь с таким email уже существует:', email);
                        return reject(new Error('Пользователь с таким email уже существует'));
                    }
                    
                    // Создаем нового пользователя
                    const newUser = {
                        id: Date.now().toString(),
                        email,
                        username,
                        // В реальном приложении пароль должен быть захеширован
                        password
                    };
                    
                    // Сохраняем пользователя
                    users.push(newUser);
                    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
                    console.log('Пользователь зарегистрирован:', newUser);
                    
                    // Создаем объект User без пароля для возврата
                    const user = new User(newUser.id, newUser.email, newUser.username, true);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
                    
                    resolve(user);
                } catch (error) {
                    console.error('Ошибка при регистрации:', error);
                    reject(new Error('Произошла ошибка при регистрации. Пожалуйста, попробуйте снова.'));
                }
            }, 500);
        });
    },
    
    /**
     * Авторизация пользователя
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<User>}
     */
    async login(email, password) {
        console.log('Попытка входа:', email);
        
        // Имитация API запроса
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
                    console.log('Пользователи в системе:', usersJson);
                    
                    const users = JSON.parse(usersJson || '[]');
                    const user = users.find(u => u.email === email && u.password === password);
                    
                    if (!user) {
                        console.error('Неверные учетные данные:', email);
                        return reject(new Error('Неправильный email или пароль'));
                    }
                    
                    console.log('Успешный вход:', user);
                    
                    // Создаем объект User без пароля для возврата
                    const authenticatedUser = new User(user.id, user.email, user.username, true);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(authenticatedUser));
                    
                    resolve(authenticatedUser);
                } catch (error) {
                    console.error('Ошибка при входе:', error);
                    reject(new Error('Произошла ошибка при входе. Пожалуйста, попробуйте снова.'));
                }
            }, 500);
        });
    },
    
    /**
     * Выход из системы
     */
    logout() {
        console.log('Выход из системы');
        localStorage.removeItem(STORAGE_KEY);
    },
    
    /**
     * Проверка текущего состояния аутентификации
     * @returns {User|null}
     */
    getCurrentUser() {
        try {
            const userJson = localStorage.getItem(STORAGE_KEY);
            if (!userJson) {
                console.log('Пользователь не авторизован');
                return null;
            }
            
            const userData = JSON.parse(userJson);
            console.log('Текущий пользователь:', userData);
            
            return User.fromJSON(userData);
        } catch (error) {
            console.error('Ошибка при чтении данных пользователя', error);
            return null;
        }
    }
}; 