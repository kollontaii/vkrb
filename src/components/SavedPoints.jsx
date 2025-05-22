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
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { pointService } from '../services/pointService';
import { useAuth } from '../hooks/useAuth.jsx';

export default function SavedPoints({ open, onClose, onSelectAsStart, onSelectAsEnd, onSelectAsIntermediate }) {
    const [points, setPoints] = useState([]);
    const [editingPoint, setEditingPoint] = useState(null);
    const [editPointName, setEditPointName] = useState('');
    const { user, isAuthenticated } = useAuth();
    
    useEffect(() => {
        if (isAuthenticated && user && open) {
            loadPoints();
        }
    }, [isAuthenticated, user, open]);
    
    const loadPoints = () => {
        if (!user || !user.id) {
            console.warn('Не удалось загрузить точки: пользователь не авторизован');
            return;
        }
        
        console.log('Загружаем точки для пользователя:', user.id);
        const userPoints = pointService.getUserPoints(user.id);
        console.log('Загруженные точки:', userPoints);
        setPoints(userPoints);
    };
    
    const handleDeletePoint = (pointId) => {
        if (!user || !user.id) {
            console.warn('Не удалось удалить точку: пользователь не авторизован');
            return;
        }
        
        console.log('Удаляем точку:', pointId);
        if (pointService.deletePoint(user.id, pointId)) {
            loadPoints();
        }
    };
    
    const handleSelectAsStart = (point) => {
        console.log('Выбрана точка как начальная:', point);
        if (onSelectAsStart) {
            onSelectAsStart(point);
            onClose();
        }
    };
    
    const handleSelectAsEnd = (point) => {
        console.log('Выбрана точка как конечная:', point);
        if (onSelectAsEnd) {
            onSelectAsEnd(point);
            onClose();
        }
    };

    const handleSelectAsIntermediate = (point) => {
        console.log('Выбрана точка как промежуточная:', point);
        if (onSelectAsIntermediate) {
            onSelectAsIntermediate(point);
        }
    };
    
    const handleOpenEditDialog = (point) => {
        setEditingPoint(point);
        setEditPointName(point.name || '');
    };
    
    const handleCloseEditDialog = () => {
        setEditingPoint(null);
        setEditPointName('');
    };
    
    const handleSavePointName = () => {
        if (!editingPoint || !user || !user.id) return;
        
        if (pointService.updatePointName(user.id, editingPoint.id, editPointName)) {
            loadPoints();
            handleCloseEditDialog();
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
                        Сохраненные точки
                    </Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                
                <Divider />
                
                {!isAuthenticated && (
                    <Box sx={{ p: 2 }}>
                        <Alert severity="info">
                            Авторизуйтесь, чтобы сохранять и просматривать точки
                        </Alert>
                    </Box>
                )}
                
                {isAuthenticated && points.length === 0 && (
                    <Box sx={{ p: 2 }}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper', textAlign: 'center' }}>
                            <LocationOnIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                            <Typography variant="body1" color="text.secondary">
                                У вас пока нет сохраненных точек
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Создайте точку на карте и нажмите кнопку "Сохранить"
                            </Typography>
                        </Paper>
                    </Box>
                )}
                
                {isAuthenticated && points.length > 0 && (
                    <List sx={{ overflow: 'auto', flexGrow: 1 }}>
                        {points.map((point) => (
                            <ListItem
                                key={point.id}
                                divider
                                sx={{ 
                                    flexDirection: 'column', 
                                    alignItems: 'flex-start',
                                    pb: 2 
                                }}
                            >
                                <Box sx={{ 
                                    width: '100%', 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start'
                                }}>
                                    <ListItemText
                                        primary={point.name || `Точка от ${formatDate(point.createdAt)}`}
                                        secondary={
                                            <Typography variant="body2" component="span">
                                                {`${point.lat.toFixed(5)}, ${point.lon.toFixed(5)}`}
                                            </Typography>
                                        }
                                        primaryTypographyProps={{ fontWeight: 'medium' }}
                                        sx={{ mb: 1 }}
                                    />
                                    <Box>
                                        <IconButton 
                                            size="small"
                                            aria-label="edit"
                                            onClick={() => handleOpenEditDialog(point)}
                                            sx={{ mr: 0.5 }}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton 
                                            size="small"
                                            aria-label="delete"
                                            onClick={() => handleDeletePoint(point.id)}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>
                                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap', width: '100%' }}>
                                    <Button 
                                        size="small" 
                                        variant="outlined"
                                        color="primary"
                                        onClick={() => handleSelectAsStart(point)}
                                    >
                                        Как начальная
                                    </Button>
                                    <Button 
                                        size="small" 
                                        variant="outlined"
                                        color="secondary"
                                        onClick={() => handleSelectAsEnd(point)}
                                    >
                                        Как конечная
                                    </Button>
                                    <Button 
                                        size="small" 
                                        variant="outlined"
                                        color="info"
                                        onClick={() => handleSelectAsIntermediate(point)}
                                    >
                                        Как промежуточная
                                    </Button>
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Drawer>
            
            <Dialog open={Boolean(editingPoint)} onClose={handleCloseEditDialog}>
                <DialogTitle>Изменить название точки</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Название"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={editPointName}
                        onChange={(e) => setEditPointName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEditDialog}>Отмена</Button>
                    <Button onClick={handleSavePointName} variant="contained">Сохранить</Button>
                </DialogActions>
            </Dialog>
        </>
    );
} 