/**
 * Сервис для работы с сохраненными точками пользователя
 */
export const pointService = {
    /**
     * Получает список сохраненных точек пользователя
     * @param {string} userId ID пользователя
     * @returns {Array} Массив сохраненных точек
     */
    getUserPoints(userId) {
        if (!userId) {
            console.error('Не указан ID пользователя');
            return [];
        }
        
        const key = `pathfinding_user_points_${userId}`;
        try {
            const pointsJson = localStorage.getItem(key);
            console.log(`Загружаем точки для пользователя ${userId}:`, pointsJson);
            const points = JSON.parse(pointsJson || '[]');
            return Array.isArray(points) ? points : [];
        } catch (error) {
            console.error('Ошибка при загрузке точек', error);
            return [];
        }
    },
    
    /**
     * Сохраняет точку пользователя
     * @param {string} userId ID пользователя
     * @param {object} point Объект точки для сохранения
     * @returns {boolean} Успешно ли сохранена точка
     */
    savePoint(userId, point) {
        if (!userId) {
            console.error('Не указан ID пользователя');
            return false;
        }
        
        if (!point) {
            console.error('Не указана точка для сохранения');
            return false;
        }
        
        console.log(`Сохраняем точку для пользователя ${userId}:`, point);
        
        const key = `pathfinding_user_points_${userId}`;
        try {
            const points = this.getUserPoints(userId);
            
            // Добавляем новую точку с ID и датой
            const newPoint = {
                ...point,
                id: Date.now().toString(),
                createdAt: new Date().toISOString()
            };
            
            points.push(newPoint);
            localStorage.setItem(key, JSON.stringify(points));
            console.log(`Точка успешно сохранена. Теперь у пользователя ${points.length} точек.`);
            return true;
        } catch (error) {
            console.error('Ошибка при сохранении точки', error);
            return false;
        }
    },
    
    /**
     * Удаляет точку пользователя
     * @param {string} userId ID пользователя
     * @param {string} pointId ID точки
     * @returns {boolean} Успешно ли удалена точка
     */
    deletePoint(userId, pointId) {
        if (!userId || !pointId) {
            console.error('Не указан ID пользователя или точки');
            return false;
        }
        
        const key = `pathfinding_user_points_${userId}`;
        try {
            let points = this.getUserPoints(userId);
            const initialCount = points.length;
            points = points.filter(point => point.id !== pointId);
            
            if (points.length === initialCount) {
                console.warn(`Точка с ID ${pointId} не найдена для пользователя ${userId}`);
            }
            
            localStorage.setItem(key, JSON.stringify(points));
            console.log(`Точка ${pointId} удалена. Осталось ${points.length} точек.`);
            return true;
        } catch (error) {
            console.error('Ошибка при удалении точки', error);
            return false;
        }
    },

    /**
     * Обновляет имя точки
     * @param {string} userId ID пользователя
     * @param {string} pointId ID точки
     * @param {string} newName Новое имя точки
     * @returns {boolean} Успешно ли обновлена точка
     */
    updatePointName(userId, pointId, newName) {
        if (!userId || !pointId) {
            console.error('Не указан ID пользователя или точки');
            return false;
        }
        
        const key = `pathfinding_user_points_${userId}`;
        try {
            let points = this.getUserPoints(userId);
            const pointIndex = points.findIndex(point => point.id === pointId);
            
            if (pointIndex === -1) {
                console.warn(`Точка с ID ${pointId} не найдена для пользователя ${userId}`);
                return false;
            }
            
            points[pointIndex].name = newName;
            localStorage.setItem(key, JSON.stringify(points));
            console.log(`Имя точки ${pointId} обновлено на "${newName}".`);
            return true;
        } catch (error) {
            console.error('Ошибка при обновлении точки', error);
            return false;
        }
    }
}; 