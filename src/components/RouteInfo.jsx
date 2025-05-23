import React, { useMemo } from 'react';
import { Box, Typography, Paper, Chip, Grid, Divider } from '@mui/material';
import { AccessTime, DirectionsCar, LocalShipping, Timeline, Schedule, FlightLand, FlagCircle, OutlinedFlag, Flag, NearMe, DirectionsWalk, DirectionsBike } from '@mui/icons-material';
import { tspService } from '../services/tspService';
import { pointService } from '../services/pointService';
import { useAuth } from '../hooks/useAuth';

/**
 * Компонент для отображения информации о маршруте
 */
const RouteInfo = ({ 
    startNode, 
    endNode, 
    intermediatePoints, 
    pathInProgress,
    animationEnded
}) => {
    const { user, isAuthenticated } = useAuth();
    
    // Загрузка сохраненных точек
    const savedPoints = useMemo(() => {
        if (!isAuthenticated || !user) return [];
        return pointService.getUserPoints(user.id);
    }, [isAuthenticated, user]);
    
    // Функция для поиска сохраненной точки по координатам
    const findSavedPointByCoordinates = (lat, lon) => {
        return savedPoints.find(p => 
            Math.abs(p.lat - lat) < 0.00001 && 
            Math.abs(p.lon - lon) < 0.00001
        );
    };
    
    // Расчет информации о маршруте
    const routeInfo = useMemo(() => {
        if (!startNode || !endNode) {
            return null;
        }

        // Составляем полный маршрут в правильном порядке
        const fullRoute = [startNode];
        if (intermediatePoints && intermediatePoints.length > 0) {
            fullRoute.push(...intermediatePoints);
        }
        fullRoute.push(endNode);

        // Расчет общего расстояния (в метрах)
        const distanceInMeters = tspService.calculateRouteDistance(fullRoute);
        
        // Преобразуем в километры
        const distanceInKm = distanceInMeters / 1000;
        
        // Расчет примерного времени в пути для разных транспортных средств
        const averageSpeedKmh = 50; // Автомобиль
        const truckSpeedKmh = 40; // Грузовик
        const bikeSpeedKmh = 15; // Велосипед
        const walkSpeedKmh = 5; // Пешеход
        
        const estimatedTimeHours = distanceInKm / averageSpeedKmh;
        const truckTimeHours = distanceInKm / truckSpeedKmh;
        const bikeTimeHours = distanceInKm / bikeSpeedKmh;
        const walkTimeHours = distanceInKm / walkSpeedKmh;
        
        // Расчёт времени отправления и прибытия
        const now = new Date();
        const departureTime = now;
        
        // Расчёт времени прибытия в промежуточные точки и учет времени остановок
        const intermediateArrivalTimes = [];
        let totalStopTimeMinutes = 0;
        
        if (intermediatePoints && intermediatePoints.length > 0) {
            let currentTime = now.getTime();
            let currentPoint = startNode;
            
            for (let i = 0; i < intermediatePoints.length; i++) {
                const point = intermediatePoints[i];
                const distance = tspService.calculateDistance(currentPoint, point) / 1000;
                const timeToPoint = distance / averageSpeedKmh;
                
                currentTime += timeToPoint * 60 * 60 * 1000;
                intermediateArrivalTimes.push(new Date(currentTime));
                
                // Добавляем время остановки, если оно указано
                const stopTimeMinutes = point.stopTime || 0;
                if (stopTimeMinutes > 0) {
                    totalStopTimeMinutes += stopTimeMinutes;
                    currentTime += stopTimeMinutes * 60 * 1000;
                }
                
                currentPoint = point;
            }
        }
        
        // Добавляем время остановок к общему времени и рассчитываем время прибытия
        const totalStopTimeHours = totalStopTimeMinutes / 60;
        const totalTimeHours = estimatedTimeHours + totalStopTimeHours;
        const totalTruckTimeHours = truckTimeHours + totalStopTimeHours;
        const totalBikeTimeHours = bikeTimeHours + totalStopTimeHours;
        const totalWalkTimeHours = walkTimeHours + totalStopTimeHours;
        
        const arrivalTime = new Date(now.getTime() + totalTimeHours * 60 * 60 * 1000);
        
        return {
            distanceInMeters,
            distanceInKm,
            estimatedTimeHours: totalTimeHours,
            truckTimeHours: totalTruckTimeHours,
            bikeTimeHours: totalBikeTimeHours,
            walkTimeHours: totalWalkTimeHours,
            points: fullRoute.length,
            departureTime,
            arrivalTime,
            intermediateArrivalTimes,
            totalStopTimeMinutes
        };
    }, [startNode, endNode, intermediatePoints]);

    // Форматирование времени в часах и минутах
    const formatTime = (timeInHours) => {
        const hours = Math.floor(timeInHours);
        const minutes = Math.round((timeInHours - hours) * 60);
        
        if (hours === 0) {
            return `${minutes} мин`;
        } else if (minutes === 0) {
            return `${hours} ч`;
        } else {
            return `${hours} ч ${minutes} мин`;
        }
    };
    
    // Форматирование даты и времени
    const formatDateTime = (date) => {
        return date.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit'
        });
    };

    if (!routeInfo) {
        return null;
    }

    return (
        <Paper 
            sx={{ 
                p: 2, 
                backgroundColor: 'rgba(33, 33, 38, 0.85)', 
                color: 'white',
                position: 'absolute',
                bottom: 20,
                left: 20,
                zIndex: 5,
                maxWidth: 350,
                borderRadius: 2
            }}
        >
            <Typography variant="h6" sx={{ mb: 1 }}>
                Информация о маршруте
                {pathInProgress ? 
                    <Chip 
                        label="Поиск пути..."
                        size="small"
                        color="warning"
                        sx={{ ml: 1 }}
                    /> :
                    animationEnded && 
                    <Chip 
                        label="Маршрут найден"
                        size="small"
                        color="success"
                        sx={{ ml: 1 }}
                    />
                }
            </Typography>
            
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <DirectionsCar sx={{ mr: 1, color: '#46B780' }} />
                        <Typography variant="body2">
                            Авто: {formatTime(routeInfo.estimatedTimeHours)}
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LocalShipping sx={{ mr: 1, color: '#E57373' }} />
                        <Typography variant="body2">
                            Грузовик: {formatTime(routeInfo.truckTimeHours)}
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <DirectionsBike sx={{ mr: 1, color: '#64B5F6' }} />
                        <Typography variant="body2">
                            Велосипед: {formatTime(routeInfo.bikeTimeHours)}
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <DirectionsWalk sx={{ mr: 1, color: '#FFD54F' }} />
                        <Typography variant="body2">
                            Пешком: {formatTime(routeInfo.walkTimeHours)}
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
            
            <Divider sx={{ my: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Timeline sx={{ mr: 1, color: '#64B5F6' }} />
                <Typography variant="body2">
                    Расстояние: {routeInfo.distanceInKm.toFixed(1)} км
                </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <FlagCircle sx={{ mr: 1, color: '#FFD54F' }} />
                <Typography variant="body2">
                    {routeInfo.points} точек в маршруте
                </Typography>
            </Box>
            
            {routeInfo.totalStopTimeMinutes > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Schedule sx={{ mr: 1, color: '#BA68C8' }} />
                    <Typography variant="body2">
                        Время остановок: {formatTime(routeInfo.totalStopTimeMinutes / 60)}
                    </Typography>
                </Box>
            )}
            
            <Divider sx={{ my: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <OutlinedFlag sx={{ mr: 1, color: '#81C784' }} />
                <Typography variant="body2">
                    Отправление: {formatDateTime(routeInfo.departureTime)}
                    {startNode && findSavedPointByCoordinates(startNode.lat, startNode.lon)?.name && 
                        ` (${findSavedPointByCoordinates(startNode.lat, startNode.lon).name})`
                    }
                </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Flag sx={{ mr: 1, color: '#E57373' }} />
                <Typography variant="body2">
                    Прибытие: {formatDateTime(routeInfo.arrivalTime)}
                    {endNode && findSavedPointByCoordinates(endNode.lat, endNode.lon)?.name && 
                        ` (${findSavedPointByCoordinates(endNode.lat, endNode.lon).name})`
                    }
                </Typography>
            </Box>
            
            {routeInfo.intermediateArrivalTimes.length > 0 && (
                <>
                    <Divider sx={{ my: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Промежуточные прибытия:
                    </Typography>
                    {routeInfo.intermediateArrivalTimes.map((time, index) => {
                        const point = intermediatePoints[index];
                        const savedPoint = point ? findSavedPointByCoordinates(point.lat, point.lon) : null;
                        const pointName = savedPoint?.name ? savedPoint.name : `Точка ${index + 1}`;
                        const stopTime = point.stopTime || 0;
                        
                        return (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5, pl: 1 }}>
                                <NearMe sx={{ mr: 1, color: '#FFCA28', fontSize: '0.9rem' }} />
                                <Typography variant="body2">
                                    {pointName}: {formatDateTime(time)}
                                    {stopTime > 0 && ` (остановка: ${formatTime(stopTime / 60)})`}
                                </Typography>
                            </Box>
                        );
                    })}
                </>
            )}
            
            <Chip 
                label={`Оптимальный маршрут`}
                size="small"
                color="primary"
                sx={{ mt: 1 }}
            />
        </Paper>
    );
};

export default RouteInfo; 