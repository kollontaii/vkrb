/**
 * Сервис для решения задачи коммивояжера (TSP) и оптимизации маршрутов
 */
export const tspService = {
    /**
     * Решает задачу коммивояжера (TSP) методом ближайшего соседа
     * Находит приближенно оптимальный порядок посещения точек
     * 
     * @param {Array} points - Массив точек (объекты с id, lat, lon)
     * @param {Object} startPoint - Начальная точка (объект с id, lat, lon)
     * @param {Object} endPoint - Конечная точка (объект с id, lat, lon) - может совпадать со startPoint
     * @returns {Array} Оптимизированный массив точек
     */
    nearestNeighborSolution(points, startPoint, endPoint) {
        if (!points || points.length === 0) {
            console.warn('Нет точек для оптимизации');
            return [];
        }
        
        // Создаем копию массива точек
        const unvisitedPoints = [...points];
        
        // Результирующий массив с оптимальным порядком
        const optimizedRoute = [];
        
        // Начинаем с начальной точки
        let currentPoint = startPoint;
        
        // Пока есть непосещенные точки
        while (unvisitedPoints.length > 0) {
            // Найти ближайшую точку к текущей
            const { nearestPoint, index } = this.findNearestPoint(currentPoint, unvisitedPoints);
            
            // Добавляем ближайшую точку в маршрут
            optimizedRoute.push(nearestPoint);
            
            // Удаляем эту точку из непосещенных
            unvisitedPoints.splice(index, 1);
            
            // Делаем найденную точку текущей
            currentPoint = nearestPoint;
        }
        
        // Если конечная точка отличается от начальной, добавляем ее в конец
        if (endPoint && endPoint.id !== startPoint.id) {
            optimizedRoute.push(endPoint);
        }
        
        return optimizedRoute;
    },
    
    /**
     * Решает задачу коммивояжера методом 2-opt
     * Этот метод дает более оптимальное решение, но требует больше вычислений
     * 
     * @param {Array} points - Массив точек (объекты с id, lat, lon)
     * @param {Object} startPoint - Начальная точка (объект с id, lat, lon)
     * @param {Object} endPoint - Конечная точка (объект с id, lat, lon)
     * @param {Number} maxIterations - Максимальное число итераций (по умолчанию 100)
     * @returns {Array} Оптимизированный массив точек
     */
    twoOptSolution(points, startPoint, endPoint, maxIterations = 100) {
        // Если точек мало, используем простой алгоритм
        if (!points || points.length < 3) {
            return this.nearestNeighborSolution(points, startPoint, endPoint);
        }
        
        // Получаем начальное решение с помощью метода ближайшего соседа
        let route = this.nearestNeighborSolution(points, startPoint, endPoint);
        
        // Фиксируем начальную и конечную точки
        const fixedStart = route[0];
        const fixedEnd = route[route.length - 1];
        
        // Вычисляем начальную длину маршрута
        let bestDistance = this.calculateRouteDistance(route);
        let improved = true;
        let iterations = 0;
        
        // Продолжаем улучшать маршрут, пока есть улучшения
        while (improved && iterations < maxIterations) {
            improved = false;
            iterations++;
            
            // Перебираем все возможные пары точек для обмена
            for (let i = 1; i < route.length - 2; i++) {
                for (let j = i + 1; j < route.length - 1; j++) {
                    // Создаем новый маршрут, меняя местами участки
                    const newRoute = [...route];
                    
                    // Реверсируем участок от i до j
                    const section = newRoute.slice(i, j + 1).reverse();
                    newRoute.splice(i, j - i + 1, ...section);
                    
                    // Рассчитываем длину нового маршрута
                    const newDistance = this.calculateRouteDistance(newRoute);
                    
                    // Если новый маршрут короче, сохраняем его
                    if (newDistance < bestDistance) {
                        route = newRoute;
                        bestDistance = newDistance;
                        improved = true;
                        // Прерываем внутренний цикл, чтобы начать заново
                        break;
                    }
                }
                
                // Если найдено улучшение, прерываем и внешний цикл
                if (improved) break;
            }
        }
        
        console.log(`2-opt завершен за ${iterations} итераций, окончательная длина: ${bestDistance.toFixed(3)}`);
        return route;
    },
    
    /**
     * Находит ближайшую точку к заданной из массива точек
     * 
     * @param {Object} point - Исходная точка
     * @param {Array} points - Массив точек для поиска
     * @returns {Object} Объект с ближайшей точкой и ее индексом в массиве
     */
    findNearestPoint(point, points) {
        if (!points || points.length === 0) {
            return { nearestPoint: null, index: -1 };
        }
        
        let minDistance = Infinity;
        let nearestPoint = null;
        let nearestIndex = -1;
        
        points.forEach((p, index) => {
            const distance = this.calculateDistance(point, p);
            if (distance < minDistance) {
                minDistance = distance;
                nearestPoint = p;
                nearestIndex = index;
            }
        });
        
        return { nearestPoint, index: nearestIndex };
    },
    
    /**
     * Вычисляет расстояние между двумя точками (евклидово)
     * 
     * @param {Object} point1 - Первая точка (объект с lat, lon)
     * @param {Object} point2 - Вторая точка (объект с lat, lon)
     * @returns {Number} Расстояние между точками
     */
    calculateDistance(point1, point2) {
        // Используем свойства lat/lon для географических координат
        const lat1 = point1.lat !== undefined ? point1.lat : point1.latitude;
        const lon1 = point1.lon !== undefined ? point1.lon : point1.longitude;
        const lat2 = point2.lat !== undefined ? point2.lat : point2.latitude;
        const lon2 = point2.lon !== undefined ? point2.lon : point2.longitude;
        
        // Константы для расчета расстояния по широте и долготе
        const R = 6371e3; // радиус Земли в метрах
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        
        // Формула гаверсинусов для вычисления расстояния между точками на сфере
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        return R * c; // расстояние в метрах
    },
    
    /**
     * Вычисляет общую длину маршрута
     * 
     * @param {Array} route - Массив точек маршрута
     * @returns {Number} Общая длина маршрута
     */
    calculateRouteDistance(route) {
        if (!route || route.length < 2) {
            return 0;
        }
        
        let totalDistance = 0;
        
        for (let i = 0; i < route.length - 1; i++) {
            totalDistance += this.calculateDistance(route[i], route[i + 1]);
        }
        
        return totalDistance;
    }
}; 