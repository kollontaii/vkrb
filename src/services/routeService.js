/**
 * Сервис для работы с сохраненными маршрутами пользователя
 */
export const routeService = {
    /**
     * Получает список сохраненных маршрутов пользователя
     * @param {string} userId ID пользователя
     * @returns {Array} Массив сохраненных маршрутов
     */
    getUserRoutes(userId) {
        if (!userId) {
            console.error('Не указан ID пользователя');
            return [];
        }
        
        const key = `pathfinding_user_routes_${userId}`;
        try {
            const routesJson = localStorage.getItem(key);
            console.log(`Загружаем маршруты для пользователя ${userId}:`, routesJson);
            const routes = JSON.parse(routesJson || '[]');
            return Array.isArray(routes) ? routes : [];
        } catch (error) {
            console.error('Ошибка при загрузке маршрутов', error);
            return [];
        }
    },
    
    /**
     * Сохраняет маршрут пользователя
     * @param {string} userId ID пользователя
     * @param {object} route Объект маршрута для сохранения
     * @returns {boolean} Успешно ли сохранен маршрут
     */
    saveRoute(userId, route) {
        if (!userId) {
            console.error('Не указан ID пользователя');
            return false;
        }
        
        if (!route) {
            console.error('Не указан маршрут для сохранения');
            return false;
        }
        
        console.log(`Сохраняем маршрут для пользователя ${userId}:`, route);
        
        const key = `pathfinding_user_routes_${userId}`;
        try {
            const routes = this.getUserRoutes(userId);
            
            // Добавляем новый маршрут с ID и датой
            const newRoute = {
                ...route,
                id: Date.now().toString(),
                createdAt: new Date().toISOString()
            };
            
            routes.push(newRoute);
            localStorage.setItem(key, JSON.stringify(routes));
            console.log(`Маршрут успешно сохранен. Теперь у пользователя ${routes.length} маршрутов.`);
            return true;
        } catch (error) {
            console.error('Ошибка при сохранении маршрута', error);
            return false;
        }
    },
    
    /**
     * Обновляет существующий маршрут пользователя
     * @param {string} userId ID пользователя
     * @param {string} routeId ID маршрута, который нужно обновить
     * @param {object} updatedData Объект с обновленными данными маршрута
     * @returns {boolean} Успешно ли обновлен маршрут
     */
    updateRoute(userId, routeId, updatedData) {
        if (!userId || !routeId) {
            console.error('Не указан ID пользователя или маршрута');
            return false;
        }
        
        if (!updatedData) {
            console.error('Не указаны данные для обновления маршрута');
            return false;
        }
        
        const key = `pathfinding_user_routes_${userId}`;
        try {
            const routes = this.getUserRoutes(userId);
            const routeIndex = routes.findIndex(route => route.id === routeId);
            
            if (routeIndex === -1) {
                console.warn(`Маршрут с ID ${routeId} не найден для пользователя ${userId}`);
                return false;
            }
            
            // Обновляем маршрут, сохраняя исходный ID и дату создания
            routes[routeIndex] = {
                ...routes[routeIndex],
                ...updatedData,
                id: routeId,
                createdAt: routes[routeIndex].createdAt,
                updatedAt: new Date().toISOString()
            };
            
            localStorage.setItem(key, JSON.stringify(routes));
            console.log(`Маршрут ${routeId} успешно обновлен.`);
            return true;
        } catch (error) {
            console.error('Ошибка при обновлении маршрута', error);
            return false;
        }
    },
    
    /**
     * Удаляет маршрут пользователя
     * @param {string} userId ID пользователя
     * @param {string} routeId ID маршрута
     * @returns {boolean} Успешно ли удален маршрут
     */
    deleteRoute(userId, routeId) {
        if (!userId || !routeId) {
            console.error('Не указан ID пользователя или маршрута');
            return false;
        }
        
        const key = `pathfinding_user_routes_${userId}`;
        try {
            let routes = this.getUserRoutes(userId);
            const initialCount = routes.length;
            routes = routes.filter(route => route.id !== routeId);
            
            if (routes.length === initialCount) {
                console.warn(`Маршрут с ID ${routeId} не найден для пользователя ${userId}`);
            }
            
            localStorage.setItem(key, JSON.stringify(routes));
            console.log(`Маршрут ${routeId} удален. Осталось ${routes.length} маршрутов.`);
            return true;
        } catch (error) {
            console.error('Ошибка при удалении маршрута', error);
            return false;
        }
    },
    
    /**
     * Создает новый маршрут из сохраненных точек
     * @param {string} userId ID пользователя
     * @param {object} routeData Данные маршрута (имя, настройки)
     * @param {object} startPoint Начальная точка
     * @param {object} endPoint Конечная точка
     * @param {Array} intermediatePoints Массив промежуточных точек (опционально)
     * @param {Array} intermediateStopTimes Массив времен остановки для промежуточных точек в минутах (опционально)
     * @returns {boolean} Успешно ли создан маршрут
     */
    createRouteFromPoints(userId, routeData, startPoint, endPoint, intermediatePoints = [], intermediateStopTimes = []) {
        if (!userId || !startPoint || !endPoint) {
            console.error('Не указаны обязательные параметры для создания маршрута');
            return false;
        }
        
        const route = {
            name: routeData.name || `Маршрут от ${new Date().toLocaleDateString()}`,
            startNode: {
                lat: startPoint.lat,
                lon: startPoint.lon
            },
            endNode: {
                lat: endPoint.lat,
                lon: endPoint.lon
            },
            intermediatePoints: intermediatePoints.map((point, index) => ({
                lat: point.lat,
                lon: point.lon,
                stopTime: intermediateStopTimes[index] || 0
            })),
            settings: routeData.settings || {},
            algorithm: routeData.algorithm || routeData.settings?.algorithm || 'dijkstra'
        };
        
        return this.saveRoute(userId, route);
    }
}; 