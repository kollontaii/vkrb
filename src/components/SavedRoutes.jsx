import React, { useEffect, useState } from 'react';
import { 
    Box, 
    Typography, 
    List, 
    ListItem, 
    ListItemText, 
    IconButton, 
    Drawer,
    Divider,
    Button,
    Alert,
    Paper,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Stack,
    Slider,
    Grid,
    RadioGroup,
    Radio,
    FormControlLabel,
    FormLabel
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RouteIcon from '@mui/icons-material/Route';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { routeService } from '../services/routeService';
import { pointService } from '../services/pointService';
import { useAuth } from '../hooks/useAuth.jsx';

export default function SavedRoutes({ open, onClose, onSelectRoute }) {
    const [routes, setRoutes] = useState([]);
    const [savedPoints, setSavedPoints] = useState([]);
    const [editingRoute, setEditingRoute] = useState(null);
    const [editRouteName, setEditRouteName] = useState('');
    const [editRouteSpeed, setEditRouteSpeed] = useState(5);
    const [editRouteRadius, setEditRouteRadius] = useState(4);
    const [editRouteAlgorithm, setEditRouteAlgorithm] = useState('astar');
    const [editRouteTag, setEditRouteTag] = useState('none');
    const [editRouteCustomTag, setEditRouteCustomTag] = useState('');
    const [editRouteStartPoint, setEditRouteStartPoint] = useState(null);
    const [editRouteEndPoint, setEditRouteEndPoint] = useState(null);
    const [editRouteIntermediatePoints, setEditRouteIntermediatePoints] = useState([]);
    const [editRouteIntermediateStopTimes, setEditRouteIntermediateStopTimes] = useState([]);
    const [createRouteDialogOpen, setCreateRouteDialogOpen] = useState(false);
    const [newRouteName, setNewRouteName] = useState('');
    const [newRouteSpeed, setNewRouteSpeed] = useState(5);
    const [newRouteRadius, setNewRouteRadius] = useState(4);
    const [newRouteAlgorithm, setNewRouteAlgorithm] = useState('dijkstra');
    const [newRouteTag, setNewRouteTag] = useState('none');
    const [newRouteCustomTag, setNewRouteCustomTag] = useState('');
    const [selectedStartPoint, setSelectedStartPoint] = useState(null);
    const [selectedEndPoint, setSelectedEndPoint] = useState(null);
    const [selectedIntermediatePoints, setSelectedIntermediatePoints] = useState([]);
    const [selectedIntermediateStopTimes, setSelectedIntermediateStopTimes] = useState([]);
    
    const { user, isAuthenticated } = useAuth();
    
    useEffect(() => {
        if (isAuthenticated && user && open) {
            loadRoutes();
            loadPoints();
        }
    }, [isAuthenticated, user, open]);
    
    const loadRoutes = () => {
        if (!user || !user.id) {
            console.warn('Не удалось загрузить маршруты: пользователь не авторизован');
            return;
        }
        
        console.log('Загружаем маршруты для пользователя:', user.id);
        const userRoutes = routeService.getUserRoutes(user.id);
        console.log('Загруженные маршруты:', userRoutes);
        setRoutes(userRoutes);
    };
    
    const loadPoints = () => {
        if (!user || !user.id) {
            console.warn('Не удалось загрузить точки: пользователь не авторизован');
            return;
        }
        
        console.log('Загружаем точки для пользователя:', user.id);
        const userPoints = pointService.getUserPoints(user.id);
        console.log('Загруженные точки:', userPoints);
        setSavedPoints(userPoints);
    };
    
    const handleDeleteRoute = (routeId) => {
        if (!user || !user.id) {
            console.warn('Не удалось удалить маршрут: пользователь не авторизован');
            return;
        }
        
        console.log('Удаляем маршрут:', routeId);
        if (routeService.deleteRoute(user.id, routeId)) {
            loadRoutes();
        }
    };
    
    const handleSelectRoute = (route) => {
        console.log('Выбран маршрут:', route);
        if (onSelectRoute) {
            onSelectRoute(route);
            onClose();
        }
    };
    
    const handleOpenEditDialog = (route) => {
        setEditingRoute(route);
        setEditRouteName(route.name || '');
        setEditRouteSpeed(route.settings?.speed || 5);
        setEditRouteRadius(route.settings?.radius || 4);
        setEditRouteAlgorithm(route.settings?.algorithm || 'astar');
        setEditRouteTag(route.tag || 'none');
        setEditRouteCustomTag(route.customTag || '');
        
        // Находим соответствующие точки для редактирования
        const findPointByCoordinates = (lat, lon) => {
            return savedPoints.find(p => 
                Math.abs(p.lat - lat) < 0.00001 && 
                Math.abs(p.lon - lon) < 0.00001
            );
        };
        
        // Установка начальной точки
        const startPoint = route.startNode && findPointByCoordinates(route.startNode.lat, route.startNode.lon);
        setEditRouteStartPoint(startPoint || null);
        
        // Установка конечной точки
        const endPoint = route.endNode && findPointByCoordinates(route.endNode.lat, route.endNode.lon);
        setEditRouteEndPoint(endPoint || null);
        
        // Установка промежуточных точек
        const intermediatePoints = [];
        const stopTimes = [];
        if (route.intermediatePoints && route.intermediatePoints.length > 0) {
            route.intermediatePoints.forEach(ip => {
                const point = findPointByCoordinates(ip.lat, ip.lon);
                if (point) {
                    intermediatePoints.push(point);
                    // Устанавливаем время остановки, если оно есть в данных, иначе 0
                    stopTimes.push(ip.stopTime || 0);
                }
            });
        }
        setEditRouteIntermediatePoints(intermediatePoints);
        setEditRouteIntermediateStopTimes(stopTimes);
    };
    
    const handleCloseEditDialog = () => {
        setEditingRoute(null);
        setEditRouteName('');
        setEditRouteSpeed(5);
        setEditRouteRadius(4);
        setEditRouteAlgorithm('astar');
        setEditRouteTag('none');
        setEditRouteCustomTag('');
        setEditRouteStartPoint(null);
        setEditRouteEndPoint(null);
        setEditRouteIntermediatePoints([]);
        setEditRouteIntermediateStopTimes([]);
    };
    
    const handleSaveRouteName = () => {
        if (!editingRoute || !user || !user.id) return;
        
        // Проверка обязательных точек
        if (!editRouteStartPoint || !editRouteEndPoint) {
            console.warn('Невозможно обновить маршрут: не выбраны обязательные точки');
            return;
        }
        
        const updatedData = {
            name: editRouteName,
            startNode: {
                id: editRouteStartPoint.id,
                lat: editRouteStartPoint.lat,
                lon: editRouteStartPoint.lon
            },
            endNode: {
                id: editRouteEndPoint.id,
                lat: editRouteEndPoint.lat,
                lon: editRouteEndPoint.lon
            },
            intermediatePoints: editRouteIntermediatePoints.map((point, index) => ({
                id: point.id,
                lat: point.lat,
                lon: point.lon,
                stopTime: editRouteIntermediateStopTimes[index] || 0
            })),
            settings: {
                ...editingRoute.settings,
                speed: editRouteSpeed,
                radius: editRouteRadius,
                algorithm: editRouteAlgorithm
            },
            tag: editRouteTag,
            customTag: editRouteTag === 'custom' ? editRouteCustomTag : ''
        };
        
        if (routeService.updateRoute(user.id, editingRoute.id, updatedData)) {
            loadRoutes();
            handleCloseEditDialog();
        }
    };
    
    const handleAddEditIntermediatePoint = (point) => {
        if (editRouteStartPoint?.id === point.id || editRouteEndPoint?.id === point.id) {
            return;
        }
        
        if (editRouteIntermediatePoints.some(p => p.id === point.id)) {
            return;
        }
        
        setEditRouteIntermediatePoints([...editRouteIntermediatePoints, point]);
        setEditRouteIntermediateStopTimes([...editRouteIntermediateStopTimes, 0]);
    };
    
    const handleRemoveEditIntermediatePoint = (pointId) => {
        const index = editRouteIntermediatePoints.findIndex(p => p.id === pointId);
        if (index !== -1) {
            const newPoints = [...editRouteIntermediatePoints];
            const newStopTimes = [...editRouteIntermediateStopTimes];
            newPoints.splice(index, 1);
            newStopTimes.splice(index, 1);
            setEditRouteIntermediatePoints(newPoints);
            setEditRouteIntermediateStopTimes(newStopTimes);
        }
    };
    
    const handleOpenCreateRouteDialog = () => {
        setNewRouteName('');
        setNewRouteSpeed(5);
        setNewRouteRadius(4);
        setNewRouteAlgorithm('dijkstra');
        setNewRouteTag('none');
        setNewRouteCustomTag('');
        setSelectedStartPoint(null);
        setSelectedEndPoint(null);
        setSelectedIntermediatePoints([]);
        setCreateRouteDialogOpen(true);
    };
    
    const handleCloseCreateRouteDialog = () => {
        setCreateRouteDialogOpen(false);
    };
    
    const handleCreateNewRoute = () => {
        if (!user || !user.id || !selectedStartPoint || !selectedEndPoint) {
            console.warn('Невозможно создать маршрут: не выбраны обязательные точки');
            return;
        }
        
        const routeData = {
            name: newRouteName || `Маршрут от ${new Date().toLocaleDateString()}`,
            settings: {
                algorithm: newRouteAlgorithm,
                speed: newRouteSpeed,
                radius: newRouteRadius
            },
            tag: newRouteTag,
            customTag: newRouteTag === 'custom' ? newRouteCustomTag : ''
        };
        
        if (routeService.createRouteFromPoints(
            user.id, 
            routeData, 
            selectedStartPoint, 
            selectedEndPoint, 
            selectedIntermediatePoints,
            selectedIntermediateStopTimes
        )) {
            loadRoutes();
            handleCloseCreateRouteDialog();
        }
    };
    
    const handleAddIntermediatePoint = (point) => {
        if (selectedStartPoint?.id === point.id || selectedEndPoint?.id === point.id) {
            return;
        }
        
        if (selectedIntermediatePoints.some(p => p.id === point.id)) {
            return;
        }
        
        setSelectedIntermediatePoints([...selectedIntermediatePoints, point]);
        setSelectedIntermediateStopTimes([...selectedIntermediateStopTimes, 0]);
    };
    
    const handleRemoveIntermediatePoint = (pointId) => {
        const index = selectedIntermediatePoints.findIndex(p => p.id === pointId);
        if (index !== -1) {
            const newPoints = [...selectedIntermediatePoints];
            const newStopTimes = [...selectedIntermediateStopTimes];
            newPoints.splice(index, 1);
            newStopTimes.splice(index, 1);
            setSelectedIntermediatePoints(newPoints);
            setSelectedIntermediateStopTimes(newStopTimes);
        }
    };
    
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } catch (error) {
            console.error('Ошибка при форматировании даты', error);
            return 'Неизвестная дата';
        }
    };
    
    // Функция для получения удобочитаемого названия алгоритма
    const getAlgorithmName = (algorithm) => {
        switch (algorithm) {
            case 'astar': return 'A*';
            case 'dijkstra': return 'Дейкстра';
            case 'greedy': return 'Жадный';
            case 'bidirectional': return 'Двунаправленный';
            default: return algorithm;
        }
    };
    
    // Функция получения цвета для тега
    const getTagColor = (tag) => {
        switch (tag) {
            case 'regular': return 'success';
            case 'single': return 'warning';
            case 'custom': return 'info';
            default: return 'default';
        }
    };
    
    // Функция для получения текста тега
    const getTagText = (route) => {
        switch (route.tag) {
            case 'regular': return 'Регулярный';
            case 'single': return 'Разовый';
            case 'custom': return route.customTag || 'Кастомный';
            default: return '';
        }
    };
    
    return (
        <>
            <Drawer
                anchor="right"
                open={open}
                onClose={onClose}
                PaperProps={{
                    sx: { width: { xs: '100%', sm: 350 } }
                }}
            >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                        Сохраненные маршруты
                    </Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                
                <Divider />
                
                {!isAuthenticated && (
                    <Box sx={{ p: 2 }}>
                        <Alert severity="info">
                            Авторизуйтесь, чтобы сохранять и просматривать маршруты
                        </Alert>
                    </Box>
                )}
                
                {isAuthenticated && (
                    <Box sx={{ p: 2 }}>
                        <Button 
                            fullWidth 
                            variant="outlined" 
                            startIcon={<AddIcon />}
                            onClick={handleOpenCreateRouteDialog}
                        >
                            Создать маршрут из точек
                        </Button>
                    </Box>
                )}
                
                {isAuthenticated && routes.length === 0 && (
                    <Box sx={{ p: 2 }}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper', textAlign: 'center' }}>
                            <RouteIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                            <Typography variant="body1" color="text.secondary">
                                У вас пока нет сохраненных маршрутов
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Создайте маршрут и нажмите кнопку "Сохранить"
                            </Typography>
                        </Paper>
                    </Box>
                )}
                
                {isAuthenticated && routes.length > 0 && (
                    <List sx={{ overflow: 'auto', flexGrow: 1 }}>
                        {routes.map((route) => (
                            <ListItem
                                key={route.id}
                                divider
                                secondaryAction={
                                    <Box sx={{ display: 'flex' }}>
                                        <IconButton 
                                            edge="end" 
                                            aria-label="edit"
                                            onClick={() => handleOpenEditDialog(route)}
                                            sx={{ mr: 1 }}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton 
                                            edge="end" 
                                            aria-label="delete"
                                            onClick={() => handleDeleteRoute(route.id)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                }
                            >
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {route.name || `Маршрут от ${formatDate(route.createdAt)}`}
                                            {route.tag && route.tag !== 'none' && (
                                                <Chip 
                                                    label={getTagText(route)} 
                                                    size="small" 
                                                    color={getTagColor(route.tag)}
                                                />
                                            )}
                                        </Box>
                                    }
                                    secondary={
                                        <>
                                            <Typography variant="body2" component="span">
                                                {route.startNode && route.endNode ? 
                                                    `${route.startNode.lat.toFixed(5)}, ${route.startNode.lon.toFixed(5)} → 
                                                    ${route.endNode.lat.toFixed(5)}, ${route.endNode.lon.toFixed(5)}` 
                                                    : 'Координаты не указаны'}
                                            </Typography>
                                            {route.intermediatePoints && route.intermediatePoints.length > 0 && (
                                                <Typography variant="body2" component="span" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
                                                    Промежуточных точек: {route.intermediatePoints.length}
                                                </Typography>
                                            )}
                                            {route.settings && (
                                                <Box component="div" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
                                                    <Typography variant="body2" sx={{ display: 'block', mb: 0.5 }}>
                                                        Алгоритм: {getAlgorithmName(route.settings.algorithm || 'astar')}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ display: 'block', mb: 0.5 }}>
                                                        Радиус: {route.settings.radius || 4} км
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ display: 'block' }}>
                                                        Скорость: {route.settings.speed || 5}
                                                    </Typography>
                                                </Box>
                                            )}
                                            <Box sx={{ mt: 1 }}>
                                                <Button 
                                                    size="small" 
                                                    variant="outlined" 
                                                    onClick={() => handleSelectRoute(route)}
                                                >
                                                    Загрузить
                                                </Button>
                                            </Box>
                                        </>
                                    }
                                    primaryTypographyProps={{ fontWeight: 'medium' }}
                                    secondaryTypographyProps={{ component: 'div' }}
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </Drawer>
            
            {/* Диалог редактирования маршрута */}
            <Dialog open={Boolean(editingRoute)} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Редактирование маршрута</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Название"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={editRouteName}
                        onChange={(e) => setEditRouteName(e.target.value)}
                        sx={{ mb: 3 }}
                    />
                    
                    {savedPoints.length === 0 ? (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            У вас нет сохраненных точек. Сначала сохраните точки на карте.
                        </Alert>
                    ) : (
                        <>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Начальная точка</InputLabel>
                                <Select
                                    value={editRouteStartPoint?.id || ''}
                                    label="Начальная точка"
                                    onChange={(e) => {
                                        const point = savedPoints.find(p => p.id === e.target.value);
                                        setEditRouteStartPoint(point);
                                    }}
                                >
                                    {savedPoints.map((point) => (
                                        <MenuItem key={point.id} value={point.id}>
                                            {point.name || `Точка ${formatDate(point.createdAt)}`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Конечная точка</InputLabel>
                                <Select
                                    value={editRouteEndPoint?.id || ''}
                                    label="Конечная точка"
                                    onChange={(e) => {
                                        const point = savedPoints.find(p => p.id === e.target.value);
                                        setEditRouteEndPoint(point);
                                    }}
                                >
                                    {savedPoints.map((point) => (
                                        <MenuItem key={point.id} value={point.id}>
                                            {point.name || `Точка ${formatDate(point.createdAt)}`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            
                            <Typography variant="subtitle1" gutterBottom>
                                Промежуточные точки
                            </Typography>
                            
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Добавить промежуточную точку</InputLabel>
                                <Select
                                    value=""
                                    label="Добавить промежуточную точку"
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            const point = savedPoints.find(p => p.id === e.target.value);
                                            if (point) handleAddEditIntermediatePoint(point);
                                        }
                                    }}
                                >
                                    {savedPoints
                                        .filter(point => 
                                            point.id !== editRouteStartPoint?.id && 
                                            point.id !== editRouteEndPoint?.id &&
                                            !editRouteIntermediatePoints.some(p => p.id === point.id)
                                        )
                                        .map((point) => (
                                            <MenuItem key={point.id} value={point.id}>
                                                {point.name || `Точка ${formatDate(point.createdAt)}`}
                                            </MenuItem>
                                        ))}
                                </Select>
                            </FormControl>
                            
                            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
                                {editRouteIntermediatePoints.map((point) => (
                                    <Chip
                                        key={point.id}
                                        label={point.name || `Точка ${formatDate(point.createdAt)}`}
                                        onDelete={() => handleRemoveEditIntermediatePoint(point.id)}
                                    />
                                ))}
                            </Stack>

                            {editRouteIntermediatePoints.length > 0 && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Время остановки в промежуточных точках (минуты):
                                    </Typography>
                                    {editRouteIntermediatePoints.map((point, index) => (
                                        <Box key={point.id} sx={{ mb: 2, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
                                                {point.name || `Точка ${formatDate(point.createdAt)}`}:
                                            </Typography>
                                            <Grid container spacing={2} alignItems="center">
                                                <Grid item xs={7}>
                                                    <Slider
                                                        size="small"
                                                        value={editRouteIntermediateStopTimes[index] || 0}
                                                        onChange={(_, newValue) => {
                                                            const newTimes = [...editRouteIntermediateStopTimes];
                                                            newTimes[index] = newValue;
                                                            setEditRouteIntermediateStopTimes(newTimes);
                                                        }}
                                                        min={0}
                                                        max={120}
                                                        valueLabelDisplay="auto"
                                                        valueLabelFormat={(value) => `${value} мин`}
                                                    />
                                                </Grid>
                                                <Grid item xs={5}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <IconButton 
                                                            size="small"
                                                            onClick={() => {
                                                                const newValue = Math.max(0, (editRouteIntermediateStopTimes[index] || 0) - 5);
                                                                const newTimes = [...editRouteIntermediateStopTimes];
                                                                newTimes[index] = newValue;
                                                                setEditRouteIntermediateStopTimes(newTimes);
                                                            }}
                                                        >
                                                            <RemoveIcon fontSize="small" />
                                                        </IconButton>
                                                        <TextField
                                                            type="number"
                                                            size="small"
                                                            fullWidth
                                                            value={editRouteIntermediateStopTimes[index] || 0}
                                                            onChange={(e) => {
                                                                const newValue = parseInt(e.target.value, 10) || 0;
                                                                const newTimes = [...editRouteIntermediateStopTimes];
                                                                newTimes[index] = newValue;
                                                                setEditRouteIntermediateStopTimes(newTimes);
                                                            }}
                                                            sx={{
                                                                '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                                                                    '-webkit-appearance': 'none',
                                                                    margin: 0,
                                                                },
                                                                '& input[type=number]': {
                                                                    '-moz-appearance': 'textfield',
                                                                    fontSize: '1.2rem',
                                                                    fontWeight: '500',
                                                                },
                                                            }}
                                                            InputProps={{
                                                                inputProps: { min: 0, max: 1440 },
                                                                endAdornment: <Typography sx={{ fontSize: '1.2rem', fontWeight: '500' }}>мин</Typography>
                                                            }}
                                                        />
                                                        <IconButton 
                                                            size="small"
                                                            onClick={() => {
                                                                const newValue = Math.min(1440, (editRouteIntermediateStopTimes[index] || 0) + 5);
                                                                const newTimes = [...editRouteIntermediateStopTimes];
                                                                newTimes[index] = newValue;
                                                                setEditRouteIntermediateStopTimes(newTimes);
                                                            }}
                                                        >
                                                            <AddIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Stack direction="row" spacing={1} useFlexGap>
                                                        {[5, 15, 30, 60].map((time) => (
                                                            <Chip 
                                                                key={time}
                                                                size="small"
                                                                label={`${time} мин`}
                                                                variant={editRouteIntermediateStopTimes[index] === time ? "filled" : "outlined"}
                                                                color={editRouteIntermediateStopTimes[index] === time ? "primary" : "default"}
                                                                clickable
                                                                onClick={() => {
                                                                    const newTimes = [...editRouteIntermediateStopTimes];
                                                                    newTimes[index] = time;
                                                                    setEditRouteIntermediateStopTimes(newTimes);
                                                                }}
                                                            />
                                                        ))}
                                                    </Stack>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    ))}
                                </Box>
                            )}

                            <Divider sx={{ my: 2 }} />
                        </>
                    )}
                    
                    <Typography variant="subtitle1" gutterBottom>
                        Скорость анимации
                    </Typography>
                    <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
                        <Grid item xs>
                            <Slider
                                value={editRouteSpeed}
                                onChange={(_, newValue) => setEditRouteSpeed(newValue)}
                                min={1}
                                max={20}
                                marks={[
                                    { value: 1, label: '1' },
                                    { value: 5, label: '5' },
                                    { value: 10, label: '10' },
                                    { value: 20, label: '20' },
                                ]}
                                valueLabelDisplay="auto"
                            />
                        </Grid>
                    </Grid>
                    
                    <Typography variant="subtitle1" gutterBottom>
                        Радиус поиска (км)
                    </Typography>
                    <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
                        <Grid item xs>
                            <Slider
                                value={editRouteRadius}
                                onChange={(_, newValue) => setEditRouteRadius(newValue)}
                                min={1}
                                max={10}
                                marks={[
                                    { value: 1, label: '1' },
                                    { value: 4, label: '4' },
                                    { value: 7, label: '7' },
                                    { value: 10, label: '10' },
                                ]}
                                valueLabelDisplay="auto"
                            />
                        </Grid>
                    </Grid>
                    
                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel>Алгоритм поиска пути</InputLabel>
                        <Select
                            value={editRouteAlgorithm}
                            label="Алгоритм поиска пути"
                            onChange={(e) => setEditRouteAlgorithm(e.target.value)}
                        >
                            <MenuItem value="astar">A* (A-звезда)</MenuItem>
                            <MenuItem value="dijkstra">Дейкстра</MenuItem>
                            <MenuItem value="greedy">Жадный алгоритм</MenuItem>
                            <MenuItem value="bidirectional">Двунаправленный поиск</MenuItem>
                        </Select>
                    </FormControl>
                    
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <FormLabel>Тег маршрута</FormLabel>
                        <RadioGroup
                            value={editRouteTag}
                            onChange={(e) => setEditRouteTag(e.target.value)}
                        >
                            <FormControlLabel value="none" control={<Radio />} label="Без тега" />
                            <FormControlLabel value="regular" control={<Radio />} label="Регулярный" />
                            <FormControlLabel value="single" control={<Radio />} label="Разовый" />
                            <FormControlLabel value="custom" control={<Radio />} label="Кастомный" />
                        </RadioGroup>
                    </FormControl>
                    
                    {editRouteTag === 'custom' && (
                        <TextField
                            margin="dense"
                            label="Название тега"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={editRouteCustomTag}
                            onChange={(e) => setEditRouteCustomTag(e.target.value)}
                            placeholder="Например: Рабочий, Выходной, Отпуск"
                            sx={{ mb: 2 }}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEditDialog}>Отмена</Button>
                    <Button 
                        onClick={handleSaveRouteName} 
                        variant="contained"
                        disabled={!editRouteStartPoint || !editRouteEndPoint || savedPoints.length === 0}
                    >
                        Сохранить
                    </Button>
                </DialogActions>
            </Dialog>
            
            {/* Диалог создания нового маршрута из точек */}
            <Dialog 
                open={createRouteDialogOpen} 
                onClose={handleCloseCreateRouteDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Создать новый маршрут из точек</DialogTitle>
                <DialogContent>
                    <TextField
                        margin="dense"
                        label="Название маршрута"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={newRouteName}
                        onChange={(e) => setNewRouteName(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    
                    {savedPoints.length === 0 ? (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            У вас нет сохраненных точек. Сначала сохраните точки на карте.
                        </Alert>
                    ) : (
                        <>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Начальная точка</InputLabel>
                                <Select
                                    value={selectedStartPoint?.id || ''}
                                    label="Начальная точка"
                                    onChange={(e) => {
                                        const point = savedPoints.find(p => p.id === e.target.value);
                                        setSelectedStartPoint(point);
                                    }}
                                >
                                    {savedPoints.map((point) => (
                                        <MenuItem key={point.id} value={point.id}>
                                            {point.name || `Точка ${formatDate(point.createdAt)}`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Конечная точка</InputLabel>
                                <Select
                                    value={selectedEndPoint?.id || ''}
                                    label="Конечная точка"
                                    onChange={(e) => {
                                        const point = savedPoints.find(p => p.id === e.target.value);
                                        setSelectedEndPoint(point);
                                    }}
                                >
                                    {savedPoints.map((point) => (
                                        <MenuItem key={point.id} value={point.id}>
                                            {point.name || `Точка ${formatDate(point.createdAt)}`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            
                            <Typography variant="subtitle1" gutterBottom>
                                Промежуточные точки
                            </Typography>
                            
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Добавить промежуточную точку</InputLabel>
                                <Select
                                    value=""
                                    label="Добавить промежуточную точку"
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            const point = savedPoints.find(p => p.id === e.target.value);
                                            if (point) handleAddIntermediatePoint(point);
                                        }
                                    }}
                                >
                                    {savedPoints
                                        .filter(point => 
                                            point.id !== selectedStartPoint?.id && 
                                            point.id !== selectedEndPoint?.id &&
                                            !selectedIntermediatePoints.some(p => p.id === point.id)
                                        )
                                        .map((point) => (
                                            <MenuItem key={point.id} value={point.id}>
                                                {point.name || `Точка ${formatDate(point.createdAt)}`}
                                            </MenuItem>
                                        ))}
                                </Select>
                            </FormControl>
                            
                            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
                                {selectedIntermediatePoints.map((point) => (
                                    <Chip
                                        key={point.id}
                                        label={point.name || `Точка ${formatDate(point.createdAt)}`}
                                        onDelete={() => handleRemoveIntermediatePoint(point.id)}
                                    />
                                ))}
                            </Stack>

                            {selectedIntermediatePoints.length > 0 && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Время остановки в промежуточных точках (минуты):
                                    </Typography>
                                    {selectedIntermediatePoints.map((point, index) => (
                                        <Box key={point.id} sx={{ mb: 2, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
                                                {point.name || `Точка ${formatDate(point.createdAt)}`}:
                                            </Typography>
                                            <Grid container spacing={2} alignItems="center">
                                                <Grid item xs={7}>
                                                    <Slider
                                                        size="small"
                                                        value={selectedIntermediateStopTimes[index] || 0}
                                                        onChange={(_, newValue) => {
                                                            const newTimes = [...selectedIntermediateStopTimes];
                                                            newTimes[index] = newValue;
                                                            setSelectedIntermediateStopTimes(newTimes);
                                                        }}
                                                        min={0}
                                                        max={120}
                                                        valueLabelDisplay="auto"
                                                        valueLabelFormat={(value) => `${value} мин`}
                                                    />
                                                </Grid>
                                                <Grid item xs={5}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <IconButton 
                                                            size="small"
                                                            onClick={() => {
                                                                const newValue = Math.max(0, (selectedIntermediateStopTimes[index] || 0) - 5);
                                                                const newTimes = [...selectedIntermediateStopTimes];
                                                                newTimes[index] = newValue;
                                                                setSelectedIntermediateStopTimes(newTimes);
                                                            }}
                                                        >
                                                            <RemoveIcon fontSize="small" />
                                                        </IconButton>
                                                        <TextField
                                                            type="number"
                                                            size="small"
                                                            fullWidth
                                                            value={selectedIntermediateStopTimes[index] || 0}
                                                            onChange={(e) => {
                                                                const newValue = parseInt(e.target.value, 10) || 0;
                                                                const newTimes = [...selectedIntermediateStopTimes];
                                                                newTimes[index] = newValue;
                                                                setSelectedIntermediateStopTimes(newTimes);
                                                            }}
                                                            sx={{
                                                                '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                                                                    '-webkit-appearance': 'none',
                                                                    margin: 0,
                                                                },
                                                                '& input[type=number]': {
                                                                    '-moz-appearance': 'textfield',
                                                                    fontSize: '1.2rem',
                                                                    fontWeight: '500',
                                                                },
                                                            }}
                                                            InputProps={{
                                                                inputProps: { min: 0, max: 1440 },
                                                                endAdornment: <Typography sx={{ fontSize: '1.2rem', fontWeight: '500' }}>мин</Typography>
                                                            }}
                                                        />
                                                        <IconButton 
                                                            size="small"
                                                            onClick={() => {
                                                                const newValue = Math.min(1440, (selectedIntermediateStopTimes[index] || 0) + 5);
                                                                const newTimes = [...selectedIntermediateStopTimes];
                                                                newTimes[index] = newValue;
                                                                setSelectedIntermediateStopTimes(newTimes);
                                                            }}
                                                        >
                                                            <AddIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Stack direction="row" spacing={1} useFlexGap>
                                                        {[5, 15, 30, 60].map((time) => (
                                                            <Chip 
                                                                key={time}
                                                                size="small"
                                                                label={`${time} мин`}
                                                                variant={selectedIntermediateStopTimes[index] === time ? "filled" : "outlined"}
                                                                color={selectedIntermediateStopTimes[index] === time ? "primary" : "default"}
                                                                clickable
                                                                onClick={() => {
                                                                    const newTimes = [...selectedIntermediateStopTimes];
                                                                    newTimes[index] = time;
                                                                    setSelectedIntermediateStopTimes(newTimes);
                                                                }}
                                                            />
                                                        ))}
                                                    </Stack>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    ))}
                                </Box>
                            )}

                            <Divider sx={{ my: 2 }} />
                            
                            <Typography variant="subtitle1" gutterBottom>
                                Настройки маршрута
                            </Typography>
                            
                            <Typography variant="subtitle2" gutterBottom>
                                Скорость анимации
                            </Typography>
                            <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                <Grid item xs>
                                    <Slider
                                        value={newRouteSpeed}
                                        onChange={(_, newValue) => setNewRouteSpeed(newValue)}
                                        min={1}
                                        max={20}
                                        marks={[
                                            { value: 1, label: '1' },
                                            { value: 5, label: '5' },
                                            { value: 10, label: '10' },
                                            { value: 20, label: '20' },
                                        ]}
                                        valueLabelDisplay="auto"
                                    />
                                </Grid>
                            </Grid>
                            
                            <Typography variant="subtitle2" gutterBottom>
                                Радиус поиска (км)
                            </Typography>
                            <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                <Grid item xs>
                                    <Slider
                                        value={newRouteRadius}
                                        onChange={(_, newValue) => setNewRouteRadius(newValue)}
                                        min={1}
                                        max={10}
                                        marks={[
                                            { value: 1, label: '1' },
                                            { value: 4, label: '4' },
                                            { value: 7, label: '7' },
                                            { value: 10, label: '10' },
                                        ]}
                                        valueLabelDisplay="auto"
                                    />
                                </Grid>
                            </Grid>
                            
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Алгоритм поиска пути</InputLabel>
                                <Select
                                    value={newRouteAlgorithm}
                                    label="Алгоритм поиска пути"
                                    onChange={(e) => setNewRouteAlgorithm(e.target.value)}
                                >
                                    <MenuItem value="astar">A* (A-звезда)</MenuItem>
                                    <MenuItem value="dijkstra">Дейкстра</MenuItem>
                                    <MenuItem value="greedy">Жадный алгоритм</MenuItem>
                                    <MenuItem value="bidirectional">Двунаправленный поиск</MenuItem>
                                </Select>
                            </FormControl>
                            
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <FormLabel>Тег маршрута</FormLabel>
                                <RadioGroup
                                    value={newRouteTag}
                                    onChange={(e) => setNewRouteTag(e.target.value)}
                                >
                                    <FormControlLabel value="none" control={<Radio />} label="Без тега" />
                                    <FormControlLabel value="regular" control={<Radio />} label="Регулярный" />
                                    <FormControlLabel value="single" control={<Radio />} label="Разовый" />
                                    <FormControlLabel value="custom" control={<Radio />} label="Кастомный" />
                                </RadioGroup>
                            </FormControl>
                            
                            {newRouteTag === 'custom' && (
                                <TextField
                                    margin="dense"
                                    label="Название тега"
                                    type="text"
                                    fullWidth
                                    variant="outlined"
                                    value={newRouteCustomTag}
                                    onChange={(e) => setNewRouteCustomTag(e.target.value)}
                                    placeholder="Например: Рабочий, Выходной, Отпуск"
                                    sx={{ mb: 2 }}
                                />
                            )}
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCreateRouteDialog}>Отмена</Button>
                    <Button 
                        onClick={handleCreateNewRoute} 
                        variant="contained"
                        disabled={!selectedStartPoint || !selectedEndPoint || savedPoints.length === 0}
                    >
                        Создать маршрут
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
} 