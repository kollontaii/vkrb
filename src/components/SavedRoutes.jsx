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
    Grid
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RouteIcon from '@mui/icons-material/Route';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
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
    const [createRouteDialogOpen, setCreateRouteDialogOpen] = useState(false);
    const [newRouteName, setNewRouteName] = useState('');
    const [newRouteSpeed, setNewRouteSpeed] = useState(5);
    const [newRouteRadius, setNewRouteRadius] = useState(4);
    const [newRouteAlgorithm, setNewRouteAlgorithm] = useState('dijkstra');
    const [selectedStartPoint, setSelectedStartPoint] = useState(null);
    const [selectedEndPoint, setSelectedEndPoint] = useState(null);
    const [selectedIntermediatePoints, setSelectedIntermediatePoints] = useState([]);
    
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
    };
    
    const handleCloseEditDialog = () => {
        setEditingRoute(null);
        setEditRouteName('');
        setEditRouteSpeed(5);
        setEditRouteRadius(4);
        setEditRouteAlgorithm('astar');
    };
    
    const handleSaveRouteName = () => {
        if (!editingRoute || !user || !user.id) return;
        
        const updatedData = {
            name: editRouteName,
            settings: {
                ...editingRoute.settings,
                speed: editRouteSpeed,
                radius: editRouteRadius,
                algorithm: editRouteAlgorithm
            }
        };
        
        if (routeService.updateRoute(user.id, editingRoute.id, updatedData)) {
            loadRoutes();
            handleCloseEditDialog();
        }
    };
    
    const handleOpenCreateRouteDialog = () => {
        setNewRouteName('');
        setNewRouteSpeed(5);
        setNewRouteRadius(4);
        setNewRouteAlgorithm('dijkstra');
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
            }
        };
        
        if (routeService.createRouteFromPoints(
            user.id, 
            routeData, 
            selectedStartPoint, 
            selectedEndPoint, 
            selectedIntermediatePoints
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
    };
    
    const handleRemoveIntermediatePoint = (pointId) => {
        setSelectedIntermediatePoints(selectedIntermediatePoints.filter(p => p.id !== pointId));
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
                                    primary={route.name || `Маршрут от ${formatDate(route.createdAt)}`}
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
                    
                    <FormControl fullWidth sx={{ mb: 2 }}>
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
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEditDialog}>Отмена</Button>
                    <Button onClick={handleSaveRouteName} variant="contained">Сохранить</Button>
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