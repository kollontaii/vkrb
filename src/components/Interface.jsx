import { Button, IconButton, Typography, Snackbar, Alert, CircularProgress, Fade, Tooltip, Drawer, MenuItem, Select, InputLabel, FormControl, Menu, Backdrop, Stepper, Step, StepLabel, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Avatar, ListItemIcon, Divider, Box } from "@mui/material";
import { MuiColorInput } from "mui-color-input";
import { PlayArrow, Settings, Movie, Pause, Replay, Save, Bookmark, AccountCircle, Logout, Person, Close as CloseIcon, LocationOn } from "@mui/icons-material";
import Slider from "./Slider";
import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { INITIAL_COLORS, LOCATIONS } from "../config";
import { arrayToRgb, rgbToArray } from "../helpers";
import { useAuth } from "../hooks/useAuth.jsx";
import { routeService } from "../services/routeService";
import { pointService } from "../services/pointService";
import SavedRoutes from "./SavedRoutes";
import SavedPoints from "./SavedPoints";

// Компонент формы входа
function LoginForm({ onSuccess, onToggleForm }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [formError, setFormError] = useState('');
    const { login, loading } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!email || !password) {
            setFormError('Пожалуйста, заполните все поля');
            return;
        }

        try {
            await login(email, password);
            if (onSuccess) onSuccess();
        } catch (error) {
            setFormError(error.message);
        }
    };

    return (
        <Box 
            component="form" 
            onSubmit={handleSubmit} 
            sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 2,
                width: '100%',
                maxWidth: '400px'
            }}
        >
            {formError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {formError}
                </Alert>
            )}

            <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
            />

            <TextField
                label="Пароль"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
            />

            <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                disabled={loading}
                fullWidth
                sx={{ mt: 1 }}
            >
                {loading ? 'Выполняется вход...' : 'Войти'}
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2">
                    Нет аккаунта?{' '}
                    <Button 
                        variant="text" 
                        color="primary" 
                        onClick={onToggleForm}
                        sx={{ p: 0, minWidth: 'auto', verticalAlign: 'baseline' }}
                    >
                        Зарегистрироваться
                    </Button>
                </Typography>
            </Box>
        </Box>
    );
}

// Компонент формы регистрации
function RegisterForm({ onSuccess, onToggleForm }) {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [formError, setFormError] = useState('');
    const { register, loading } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        // Валидация формы
        if (!email || !username || !password || !confirmPassword) {
            setFormError('Пожалуйста, заполните все поля');
            return;
        }

        if (password !== confirmPassword) {
            setFormError('Пароли не совпадают');
            return;
        }

        if (password.length < 6) {
            setFormError('Пароль должен содержать не менее 6 символов');
            return;
        }

        try {
            await register(email, username, password);
            if (onSuccess) onSuccess();
        } catch (error) {
            setFormError(error.message);
        }
    };

    return (
        <Box 
            component="form" 
            onSubmit={handleSubmit} 
            sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 2,
                width: '100%',
                maxWidth: '400px'
            }}
        >
            {formError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {formError}
                </Alert>
            )}

            <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
            />

            <TextField
                label="Имя пользователя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                fullWidth
            />

            <TextField
                label="Пароль"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                helperText="Минимум 6 символов"
            />

            <TextField
                label="Подтвердите пароль"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                fullWidth
            />

            <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                disabled={loading}
                fullWidth
                sx={{ mt: 1 }}
            >
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2">
                    Уже есть аккаунт?{' '}
                    <Button 
                        variant="text" 
                        color="primary" 
                        onClick={onToggleForm}
                        sx={{ p: 0, minWidth: 'auto', verticalAlign: 'baseline' }}
                    >
                        Войти
                    </Button>
                </Typography>
            </Box>
        </Box>
    );
}

const Interface = forwardRef(({ canStart, started, animationEnded, playbackOn, time, maxTime, settings, colors, loading, timeChanged, cinematic, placeEnd, changeRadius, changeAlgorithm, setPlaceEnd, setCinematic, setSettings, setColors, startPathfinding, toggleAnimation, clearPath, changeLocation, startNode, endNode, loadRoute, placeIntermediate, setPlaceIntermediate, intermediatePoints, directMapClick, onAddIntermediatePoint }, ref) => {
    const [sidebar, setSidebar] = useState(false);
    const [snack, setSnack] = useState({
        open: false,
        message: "",
        type: "error",
    });
    const [showTutorial, setShowTutorial] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [helper, setHelper] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const menuOpen = Boolean(menuAnchor);
    const helperTime = useRef(4800);
    const rightDown = useRef(false);
    const leftDown = useRef(false);
    
    // Состояния для работы с маршрутами
    const [saveRouteDialogOpen, setSaveRouteDialogOpen] = useState(false);
    const [routeName, setRouteName] = useState('');
    const [savedRoutesDrawerOpen, setSavedRoutesDrawerOpen] = useState(false);
    
    // Состояния для работы с точками
    const [savePointDialogOpen, setSavePointDialogOpen] = useState(false);
    const [pointName, setPointName] = useState('');
    const [savedPointsDrawerOpen, setSavedPointsDrawerOpen] = useState(false);
    const [currentPoint, setCurrentPoint] = useState(null);
    
    // Хук авторизации
    const { user, isAuthenticated, logout } = useAuth();

    // В функции компонента Interface добавляем новые состояния и функции для работы с аккаунтом
    const [authDialogOpen, setAuthDialogOpen] = useState(false);
    const [profileDialogOpen, setProfileDialogOpen] = useState(false);
    const [userMenuAnchor, setUserMenuAnchor] = useState(null);
    const userMenuOpen = Boolean(userMenuAnchor);

    // Expose showSnack to parent from ref
    useImperativeHandle(ref, () => ({
        showSnack(message, type = "error") {
            setSnack({ open: true, message, type });
        },
    }));
      
    function closeSnack() {
        setSnack({...snack, open: false});
    }

    function closeHelper() {
        setHelper(false);
    }

    function handleTutorialChange(direction) {
        if(activeStep >= 2 && direction > 0) {
            setShowTutorial(false);
            return;
        }
        
        setActiveStep(Math.max(activeStep + direction, 0));
    }

    // Start pathfinding or toggle playback
    function handlePlay() {
        if(!canStart) return;
        if(!started && time === 0) {
            startPathfinding();
            return;
        }
        toggleAnimation();
    }
    
    function closeMenu() {
        setMenuAnchor(null);
    }

    window.onkeydown = e => {
        if(e.code === "ArrowRight" && !rightDown.current && !leftDown.current && (!started || animationEnded)) {
            rightDown.current = true;
            toggleAnimation(false, 1);
        }
        else if(e.code === "ArrowLeft" && !leftDown.current && !rightDown.current && animationEnded) {
            leftDown.current = true;
            toggleAnimation(false, -1);
        }
    };

    window.onkeyup = e => {
        if(e.code === "Escape") setCinematic(false);
        else if(e.code === "Space") {
            e.preventDefault();
            handlePlay();
        }
        else if(e.code === "ArrowRight" && rightDown.current) {
            rightDown.current = false;
            toggleAnimation(false, 1);
        }
        else if(e.code === "ArrowLeft" && animationEnded && leftDown.current) {
            leftDown.current = false;
            toggleAnimation(false, 1);
        }
        else if(e.code === "KeyR" && (animationEnded || !started)) clearPath();
    };

    // Show cinematic mode helper
    useEffect(() => {
        if(!cinematic) return;
        setHelper(true);
        setTimeout(() => {
            helperTime.current = 2500;
        }, 200);
    }, [cinematic]);

    useEffect(() => {
        if(localStorage.getItem("path_sawtutorial")) return;
        setShowTutorial(true);
        localStorage.setItem("path_sawtutorial", true);
    }, []);

    // Новые функции для работы с маршрутами
    const handleSaveRouteClick = () => {
        if (!isAuthenticated) {
            setSnack({ open: true, message: "Авторизуйтесь, чтобы сохранять маршруты", type: "info" });
            return;
        }
        
        if (!startNode || !endNode) {
            setSnack({ open: true, message: "Создайте маршрут для сохранения", type: "warning" });
            return;
        }
        
        setSaveRouteDialogOpen(true);
    };
    
    const handleSaveRoute = () => {
        if (!user || !user.id) {
            setSnack({ open: true, message: "Для сохранения маршрута необходимо авторизоваться", type: "error" });
            setSaveRouteDialogOpen(false);
            return;
        }

        const route = {
            name: routeName || `Маршрут ${new Date().toLocaleDateString()}`,
            startNode: {
                id: startNode.id,
                lat: startNode.lat,
                lon: startNode.lon
            },
            endNode: {
                id: endNode.id,
                lat: endNode.lat,
                lon: endNode.lon
            },
            intermediatePoints: intermediatePoints.map(point => ({
                id: point.id,
                lat: point.lat,
                lon: point.lon
            })),
            settings,
            algorithm: settings.algorithm
        };
        
        console.log('Сохраняем маршрут:', route, 'для пользователя:', user.id);
        
        if (routeService.saveRoute(user.id, route)) {
            setSnack({ open: true, message: "Маршрут успешно сохранен", type: "success" });
        } else {
            setSnack({ open: true, message: "Ошибка при сохранении маршрута", type: "error" });
        }
        
        setSaveRouteDialogOpen(false);
        setRouteName('');
    };
    
    const handleOpenSavedRoutes = () => {
        if (!isAuthenticated) {
            setSnack({ open: true, message: "Авторизуйтесь, чтобы просматривать сохраненные маршруты", type: "info" });
            return;
        }
        
        setSavedRoutesDrawerOpen(true);
    };
    
    const handleSelectRoute = (route) => {
        if (loadRoute) {
            loadRoute(route);
        }
    };

    // В функции компонента Interface добавляем новые функции для работы с аккаунтом
    const handleOpenUserMenu = (event) => {
        setUserMenuAnchor(event.currentTarget);
    };

    const handleCloseUserMenu = () => {
        setUserMenuAnchor(null);
    };

    const handleLogout = () => {
        logout();
        handleCloseUserMenu();
    };

    const handleOpenAuthDialog = () => {
        setAuthDialogOpen(true);
    };

    const handleCloseAuthDialog = () => {
        setAuthDialogOpen(false);
    };

    const handleOpenProfileDialog = () => {
        setProfileDialogOpen(true);
        handleCloseUserMenu();
    };

    const handleCloseProfileDialog = () => {
        setProfileDialogOpen(false);
    };

    // В функции компонента Interface добавляем состояние isLoginForm
    const [isLoginForm, setIsLoginForm] = useState(true);

    // Функции для работы с точками
    const handleSavePointClick = () => {
        if (!isAuthenticated) {
            setSnack({ open: true, message: "Авторизуйтесь, чтобы сохранять точки", type: "info" });
            return;
        }
        
        if (!startNode) {
            setSnack({ open: true, message: "Выберите точку на карте для сохранения", type: "warning" });
            return;
        }
        
        setCurrentPoint(startNode);
        setSavePointDialogOpen(true);
    };
    
    const handleSavePoint = () => {
        if (!user || !user.id || !currentPoint) {
            setSnack({ open: true, message: "Для сохранения точки необходимо авторизоваться", type: "error" });
            setSavePointDialogOpen(false);
            return;
        }

        const point = {
            name: pointName || `Точка ${new Date().toLocaleDateString()}`,
            id: currentPoint.id,
            lat: currentPoint.lat,
            lon: currentPoint.lon
        };
        
        console.log('Сохраняем точку:', point, 'для пользователя:', user.id);
        
        if (pointService.savePoint(user.id, point)) {
            setSnack({ open: true, message: "Точка успешно сохранена", type: "success" });
        } else {
            setSnack({ open: true, message: "Ошибка при сохранении точки", type: "error" });
        }
        
        setSavePointDialogOpen(false);
        setPointName('');
    };
    
    const handleOpenSavedPoints = () => {
        if (!isAuthenticated) {
            setSnack({ open: true, message: "Авторизуйтесь, чтобы просматривать сохраненные точки", type: "info" });
            return;
        }
        
        setSavedPointsDrawerOpen(true);
    };
    
    const handleSelectPointAsStart = (point) => {
        console.log('Точка выбрана как начальная:', point);
        
        // Формируем правильный объект для изменения локации
        const location = {
            longitude: point.lon,
            latitude: point.lat
        };
        
        // Сначала меняем локацию карты
        changeLocation(location);
        
        // Используем directMapClick вместо loadRoute
        setTimeout(() => {
            if (directMapClick) {
                directMapClick(point.lat, point.lon, false);
            } else if (loadRoute) {
                // Запасной вариант, если directMapClick недоступен
                loadRoute({
                    startNode: {
                        id: point.id,
                        lat: point.lat,
                        lon: point.lon
                    },
                    endNode: null,
                    intermediatePoints: []
                });
            }
        }, 500); // Задержка позволяет корректно анимировать перемещение карты
    };
    
    const handleSelectPointAsEnd = (point) => {
        console.log('Точка выбрана как конечная:', point);
        
        if (!startNode) {
            setSnack({ open: true, message: "Сначала выберите начальную точку", type: "warning" });
            return;
        }
        
        // Проверяем, находится ли точка в пределах досягаемости
        const distanceLon = Math.abs(startNode.lon - point.lon);
        const distanceLat = Math.abs(startNode.lat - point.lat);
        
        // Грубая оценка, находится ли точка в зоне досягаемости
        // Примерно 0.1 градуса соответствует ~11 км, поэтому проверяем, что расстояние меньше радиуса в градусах
        const radiusInDegrees = settings.radius / 111; // приблизительно радиус в градусах (1 градус ~ 111 км)
        
        if (Math.sqrt(distanceLon * distanceLon + distanceLat * distanceLat) > radiusInDegrees) {
            setSnack({ open: true, message: "Выбранная точка находится вне зоны досягаемости", type: "warning" });
            return;
        }
        
        // Устанавливаем режим выбора конечной точки
        if (setPlaceEnd) {
            setPlaceIntermediate(false);
            setPlaceEnd(true);
        }
        
        // Используем directMapClick вместо loadRoute
        if (directMapClick) {
            directMapClick(point.lat, point.lon, true);
        } else if (loadRoute) {
            // Запасной вариант, если directMapClick недоступен
            loadRoute({
                startNode: startNode,
                endNode: {
                    id: point.id,
                    lat: point.lat,
                    lon: point.lon
                },
                intermediatePoints: intermediatePoints || [],
                settings: settings
            });
        }
    };
    
    const handleSelectPointAsIntermediate = (point) => {
        console.log('Точка выбрана как промежуточная:', point);
        
        if (!startNode) {
            setSnack({ open: true, message: "Сначала выберите начальную точку", type: "warning" });
            return;
        }
        
        // Проверка на валидность координат точки
        if (!point || !point.id || point.lat === undefined || point.lon === undefined) {
            setSnack({ open: true, message: "Ошибка: выбранная точка содержит некорректные данные", type: "error" });
            console.error("Некорректные данные точки:", point);
            return;
        }
        
        // Проверяем, находится ли точка в пределах досягаемости от начальной точки
        const distanceLon = Math.abs(startNode.lon - point.lon);
        const distanceLat = Math.abs(startNode.lat - point.lat);
        const radiusInDegrees = settings.radius / 111; // приблизительно радиус в градусах (1 градус ~ 111 км)
        
        if (Math.sqrt(distanceLon * distanceLon + distanceLat * distanceLat) > radiusInDegrees) {
            setSnack({ open: true, message: "Выбранная точка находится вне зоны досягаемости", type: "warning" });
            return;
        }
        
        // Устанавливаем режим выбора промежуточной точки
        if (setPlaceIntermediate) {
            setPlaceEnd(false);
            setPlaceIntermediate(true);
        }
        
        // Добавляем точку как промежуточную
        const newPoint = {
            id: point.id,
            lat: point.lat,
            lon: point.lon
        };
        
        console.log('Добавляем промежуточную точку:', newPoint);
        
        try {
            // Используем функцию onAddIntermediatePoint вместо прямого обновления state
            if (onAddIntermediatePoint && onAddIntermediatePoint(newPoint)) {
                setSnack({ open: true, message: "Промежуточная точка успешно добавлена", type: "success" });
                // Закрываем панель после добавления
                setSavedPointsDrawerOpen(false);
            } else {
                console.error("Не удалось добавить промежуточную точку через onAddIntermediatePoint");
                setSnack({ open: true, message: "Не удалось добавить промежуточную точку", type: "error" });
            }
        } catch (error) {
            console.error("Ошибка при добавлении промежуточной точки:", error);
            setSnack({ open: true, message: "Ошибка при добавлении промежуточной точки", type: "error" });
        }
    };

    return (
        <>
            <div className={`nav-top ${cinematic ? "cinematic" : ""}`}>
                <div className="side slider-container">
                    <Typography id="playback-slider" gutterBottom>
                        Управление анимацией
                    </Typography>
                    <Slider disabled={!animationEnded}  value={animationEnded ? time : maxTime} min={animationEnded ? 0 : -1} max={maxTime} onChange={(e) => {timeChanged(Number(e.target.value));}} className="slider" aria-labelledby="playback-slider" />
                </div>
                <IconButton disabled={!canStart} onClick={handlePlay} style={{ backgroundColor: "#46B780", width: 60, height: 60 }} size="large">
                    {(!started || animationEnded && !playbackOn) 
                        ? <PlayArrow style={{ color: "#fff", width: 26, height: 26 }} fontSize="inherit" />
                        : <Pause style={{ color: "#fff", width: 26, height: 26 }} fontSize="inherit" />
                    }
                </IconButton>
                <div className="side">
                    <Button disabled={!animationEnded && started} onClick={clearPath} style={{ color: "#fff", backgroundColor: "#404156", paddingInline: 30, paddingBlock: 7 }} variant="contained">Очистить путь</Button>
                </div>
            </div>

            <div className={`nav-right ${cinematic ? "cinematic" : ""}`}>
                <Tooltip title={isAuthenticated ? user?.username || 'Профиль' : 'Войти'}>
                    <IconButton 
                        onClick={isAuthenticated ? handleOpenUserMenu : handleOpenAuthDialog} 
                        style={{ backgroundColor: "#2A2B37", width: 36, height: 36 }} 
                        size="large"
                    >
                        {isAuthenticated ? 
                            <Avatar 
                                sx={{ 
                                    width: 22, 
                                    height: 22, 
                                    bgcolor: 'primary.main',
                                    fontSize: '0.8rem'
                                }}
                            >
                                {user?.username?.charAt(0)?.toUpperCase() || 'П'}
                            </Avatar> : 
                            <AccountCircle style={{ color: "#fff", width: 22, height: 22 }} fontSize="inherit" />
                        }
                    </IconButton>
                </Tooltip>
                <Tooltip title="Сохранить маршрут">
                    <IconButton onClick={handleSaveRouteClick} style={{ backgroundColor: "#2A2B37", width: 36, height: 36 }} size="large">
                        <Save style={{ color: "#fff", width: 22, height: 22 }} fontSize="inherit" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Сохраненные маршруты">
                    <IconButton onClick={handleOpenSavedRoutes} style={{ backgroundColor: "#2A2B37", width: 36, height: 36 }} size="large">
                        <Bookmark style={{ color: "#fff", width: 22, height: 22 }} fontSize="inherit" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Сохранить точку">
                    <IconButton onClick={handleSavePointClick} style={{ backgroundColor: "#2A2B37", width: 36, height: 36 }} size="large">
                        <LocationOn style={{ color: "#fff", width: 22, height: 22 }} fontSize="inherit" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Сохраненные точки">
                    <IconButton onClick={handleOpenSavedPoints} style={{ backgroundColor: "#2A2B37", width: 36, height: 36 }} size="large">
                        <LocationOn style={{ color: "#fff", width: 18, height: 18, marginRight: -5 }} fontSize="inherit" />
                        <Bookmark style={{ color: "#fff", width: 15, height: 15, position: "relative", top: -2, left: -5 }} fontSize="inherit" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Открыть настройки">
                    <IconButton onClick={() => {setSidebar(true);}} style={{ backgroundColor: "#2A2B37", width: 36, height: 36 }} size="large">
                        <Settings style={{ color: "#fff", width: 24, height: 24 }} fontSize="inherit" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Кинематический режим">
                    <IconButton className="btn-cinematic" onClick={() => {setCinematic(!cinematic);}} style={{ backgroundColor: "#2A2B37", width: 36, height: 36 }} size="large">
                        <Movie style={{ color: "#fff", width: 24, height: 24 }} fontSize="inherit" />
                    </IconButton>
                </Tooltip>

                {/* Меню пользователя */}
                <Menu
                    anchorEl={userMenuAnchor}
                    open={userMenuOpen}
                    onClose={handleCloseUserMenu}
                    PaperProps={{
                        elevation: 3,
                        sx: { minWidth: 200 }
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                    <MenuItem onClick={handleOpenProfileDialog}>
                        <ListItemIcon>
                            <Person fontSize="small" />
                        </ListItemIcon>
                        Мой профиль
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout}>
                        <ListItemIcon>
                            <Logout fontSize="small" />
                        </ListItemIcon>
                        Выйти
                    </MenuItem>
                </Menu>
            </div>

            <div className="mobile-controls" style={{ bottom: "20px" }}>
                <Button 
                    onClick={() => {
                        if (placeEnd) {
                            setPlaceEnd(false);
                            setPlaceIntermediate(false);
                        } else if (placeIntermediate) {
                            setPlaceEnd(true);
                            setPlaceIntermediate(false);
                        } else {
                            setPlaceIntermediate(true);
                            setPlaceEnd(false);
                        }
                    }} 
                    style={{ color: "#fff", backgroundColor: "#404156", paddingInline: 30, paddingBlock: 7 }} 
                    variant="contained"
                >
                    {placeEnd ? "Конечная точка" : placeIntermediate ? "Промежуточная точка" : "Начальная точка"}
                </Button>
            </div>

            <div className="loader-container">
                <Fade
                    in={loading}
                    style={{
                        transitionDelay: loading ? "50ms" : "0ms",
                    }}
                    unmountOnExit
                >
                    <CircularProgress color="inherit" />
                </Fade>
            </div>

            <Snackbar 
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }} 
                open={snack.open} 
                autoHideDuration={4000} 
                onClose={closeSnack}>
                <Alert 
                    onClose={closeSnack} 
                    severity={snack.type} 
                    style={{ width: "100%", color: "#fff" }}
                >
                    {snack.message}
                </Alert>
            </Snackbar>

            <Snackbar 
                anchorOrigin={{ vertical: "top", horizontal: "center" }} 
                open={helper} 
                autoHideDuration={helperTime.current} 
                onClose={closeHelper}
            >
                <div className="cinematic-alert">
                    <Typography fontSize="18px"><b>Кинематический режим</b></Typography>
                    <Typography>Используйте клавиши для управления анимацией</Typography>
                    <Typography>Нажмите <b>Escape</b> для выхода</Typography>
                </div>
            </Snackbar>

            <Backdrop
                open={showTutorial}
                onClick={e => {if(e.target.classList.contains("backdrop")) setShowTutorial(false);}}
                className="backdrop"
            >
                <div className="tutorial-container">
                    <Stepper activeStep={activeStep}>
                        <Step>
                            <StepLabel>Основы управления</StepLabel>
                        </Step>
                        <Step>
                            <StepLabel>Управление воспроизведением</StepLabel>
                        </Step>
                        <Step>
                            <StepLabel>Изменение настроек</StepLabel>
                        </Step>
                    </Stepper>
                    <div className="content">
                        <h1>Визуализатор поиска пути на карте</h1>
                        {activeStep === 0 && <div>
                            <p>
                                <b>Управление:</b> <br/>
                                <b>Левая кнопка:</b> Установить начальную точку <br/>
                                <b>Правая кнопка:</b> Установить конечную точку <br/>
                            </p>
                            <p>Конечная точка должна быть размещена в пределах показанного радиуса.</p>
                            <video className="video" autoPlay muted loop>
                                <source src="./videos/tutorial1.mp4" type="video/mp4"/>
                            </video>
                        </div>}
                        {activeStep === 1 && <div>
                            <p>
                                Чтобы начать визуализацию, нажмите <b>кнопку Старт</b> или клавишу <b>Пробел</b>.<br/>
                                Функция воспроизведения доступна после завершения работы алгоритма.
                            </p>
                            <video className="video" autoPlay muted loop>
                                <source src="./videos/tutorial2.mp4" type="video/mp4"/>
                            </video>
                        </div>}
                        {activeStep === 2 && <div>
                            <p>
                                Вы можете настроить параметры анимации в <b>боковой панели настроек</b>. <br/>
                                Старайтесь устанавливать радиус области только настолько большим, насколько это необходимо. <br/>
                                Любое значение выше <b>10км</b> считается экспериментальным. Если возникнут проблемы с производительностью, остановите анимацию и очистите путь.
                            </p>
                            <video className="video" autoPlay muted loop>
                                <source src="./videos/tutorial3.mp4" type="video/mp4"/>
                            </video>
                        </div>}
                    </div>
                    <div className="controls">
                        <Button onClick={() => {setShowTutorial(false);}}
                            className="close" variant="outlined" style={{ borderColor: "#9f9f9f", color: "#9f9f9f", paddingInline: 15 }}
                        >
                            Закрыть
                        </Button>
                        <Button onClick={() => {handleTutorialChange(-1);}}
                            variant="outlined" style={{ borderColor: "#9f9f9f", color: "#9f9f9f", paddingInline: 18 }}
                        >
                                Назад
                        </Button>
                        <Button onClick={() => {handleTutorialChange(1);}}
                            variant="contained" style={{ backgroundColor: "#46B780", color: "#fff", paddingInline: 30, fontWeight: "bold" }}
                        >
                            {activeStep >= 2 ? "Завершить" : "Далее"}
                        </Button>
                    </div>
                </div>
            </Backdrop>

            <Drawer
                className={`side-drawer ${cinematic ? "cinematic" : ""}`}
                anchor="left"
                open={sidebar}
                onClose={() => {setSidebar(false);}}
            >
                <div className="sidebar-container">

                    <FormControl variant="filled">
                        <InputLabel style={{ fontSize: 14 }} id="algo-select">Алгоритм</InputLabel>
                        <Select
                            labelId="algo-select"
                            value={settings.algorithm}
                            onChange={e => {changeAlgorithm(e.target.value);}}
                            required
                            style={{ backgroundColor: "#404156", color: "#fff", width: "100%", paddingLeft: 1 }}
                            inputProps={{MenuProps: {MenuListProps: {sx: {backgroundColor: "#404156"}}}}}
                            size="small"
                            disabled={!animationEnded && started}
                        >
                            <MenuItem value={"astar"}>Алгоритм A*</MenuItem>
                            <MenuItem value={"greedy"}>Жадный алгоритм</MenuItem>
                            <MenuItem value={"dijkstra"}>Алгоритм Дейкстры</MenuItem>
                            <MenuItem value={"bidirectional"}>Двунаправленный поиск</MenuItem>
                        </Select>
                    </FormControl>

                    <div>
                        <Button
                            id="locations-button"
                            aria-controls={menuOpen ? "locations-menu" : undefined}
                            aria-haspopup="true"
                            aria-expanded={menuOpen ? "true" : undefined}
                            onClick={(e) => {setMenuAnchor(e.currentTarget);}}
                            variant="contained"
                            disableElevation
                            style={{ backgroundColor: "#404156", color: "#fff", textTransform: "none", fontSize: 16, paddingBlock: 8, justifyContent: "start" }}
                        >
                            Города
                        </Button>
                        <Menu
                            id="locations-menu"
                            anchorEl={menuAnchor}
                            open={menuOpen}
                            onClose={() => {setMenuAnchor(null);}}
                            MenuListProps={{
                                "aria-labelledby": "locations-button",
                                sx: {
                                    backgroundColor: "#404156"
                                }
                            }}
                            anchorOrigin={{
                                vertical: "top",
                                horizontal: "right",
                            }}
                        >
                            {LOCATIONS.map(location => 
                                <MenuItem key={location.name} onClick={() => {
                                    closeMenu();
                                    changeLocation(location);
                                }}>{location.name}</MenuItem>
                            )}
                        </Menu>
                    </div>

                    <div className="side slider-container">
                        <Typography id="area-slider" >
                            Радиус области: {settings.radius}км ({(settings.radius / 1.609).toFixed(1)}ми)
                        </Typography>
                        <Slider disabled={started && !animationEnded} min={2} max={20} step={1} value={settings.radius} onChangeCommited={() => { changeRadius(settings.radius); }} onChange={e => { setSettings({...settings, radius: Number(e.target.value)}); }} className="slider" aria-labelledby="area-slider" style={{ marginBottom: 1 }} 
                            marks={[
                                {
                                    value: 2,
                                    label: "2км"
                                },
                                {
                                    value: 20,
                                    label: "20км"
                                }
                            ]} 
                        />
                    </div>

                    <div className="side slider-container">
                        <Typography id="speed-slider" >
                            Скорость анимации
                        </Typography>
                        <Slider min={1} max={30} value={settings.speed} onChange={e => { setSettings({...settings, speed: Number(e.target.value)}); }} className="slider" aria-labelledby="speed-slider" style={{ marginBottom: 1 }} />
                    </div>

                    <div className="point-selection-container">
                        <Typography style={{ color: "#A8AFB3", textTransform: "uppercase", fontSize: 14 }} >
                            Режим выбора точек
                        </Typography>
                        <div className="button-group">
                            <Button 
                                variant={!placeEnd && !placeIntermediate ? "contained" : "outlined"}
                                onClick={() => {
                                    setPlaceEnd(false);
                                    setPlaceIntermediate(false);
                                }}
                                sx={{ mb: 1, mr: 1 }}
                            >
                                Начальная
                            </Button>
                            <Button 
                                variant={placeIntermediate ? "contained" : "outlined"}
                                onClick={() => {
                                    setPlaceEnd(false);
                                    setPlaceIntermediate(true);
                                }}
                                sx={{ mb: 1, mr: 1 }}
                            >
                                Промежуточная
                            </Button>
                            <Button 
                                variant={placeEnd ? "contained" : "outlined"}
                                onClick={() => {
                                    setPlaceEnd(true);
                                    setPlaceIntermediate(false);
                                }}
                                sx={{ mb: 1 }}
                            >
                                Конечная
                            </Button>
                        </div>
                    </div>

                    {intermediatePoints && intermediatePoints.length > 0 && (
                        <div className="intermediate-points-container">
                            <Typography style={{ color: "#A8AFB3", textTransform: "uppercase", fontSize: 14 }} >
                                Промежуточные точки ({intermediatePoints.length})
                            </Typography>
                            <div className="intermediate-points-list">
                                {intermediatePoints.map((point, index) => (
                                    <div key={index} className="intermediate-point-item" style={{ marginBottom: 8 }}>
                                        <Typography variant="body2" style={{ color: "#fff" }}>
                                            Точка {index + 1}: [{point.lat.toFixed(5)}, {point.lon.toFixed(5)}]
                                        </Typography>
                                    </div>
                                ))}
                                <Typography variant="caption" style={{ color: "#A8AFB3", fontSize: 12, marginTop: 8, display: 'block' }}>
                                    Для удаления точки щелкните по ней на карте
                                </Typography>
                            </div>
                        </div>
                    )}

                    <div className="styles-container">
                        <Typography style={{ color: "#A8AFB3", textTransform: "uppercase", fontSize: 14 }} >
                            Стили
                        </Typography>
                        
                        <div>
                            <Typography id="start-fill-label" >
                                Цвет заливки начальной точки
                            </Typography>
                            <div className="color-container">
                                <MuiColorInput value={arrayToRgb(colors.startNodeFill)} onChange={v => {setColors({...colors, startNodeFill: rgbToArray(v)});}} aria-labelledby="start-fill-label" style={{ backgroundColor: "#404156" }} />
                                <IconButton onClick={() => {setColors({...colors, startNodeFill: INITIAL_COLORS.startNodeFill});}} style={{ backgroundColor: "transparent" }} size="small">
                                    <Replay style={{ color: "#fff", width: 20, height: 20 }} fontSize="inherit" />
                                </IconButton>
                            </div>
                        </div>

                        <div>
                            <Typography id="start-border-label" >
                                Цвет границы начальной точки
                            </Typography>
                            <div className="color-container">
                                <MuiColorInput value={arrayToRgb(colors.startNodeBorder)} onChange={v => {setColors({...colors, startNodeBorder: rgbToArray(v)});}} aria-labelledby="start-border-label" style={{ backgroundColor: "#404156" }} />
                                <IconButton onClick={() => {setColors({...colors, startNodeBorder: INITIAL_COLORS.startNodeBorder});}} style={{ backgroundColor: "transparent" }} size="small">
                                    <Replay style={{ color: "#fff", width: 20, height: 20 }} fontSize="inherit" />
                                </IconButton>
                            </div>
                        </div>

                        <div>
                            <Typography id="end-fill-label" >
                                Цвет заливки конечной точки
                            </Typography>
                            <div className="color-container">
                                <MuiColorInput value={arrayToRgb(colors.endNodeFill)} onChange={v => {setColors({...colors, endNodeFill: rgbToArray(v)});}} aria-labelledby="end-fill-label" style={{ backgroundColor: "#404156" }} />
                                <IconButton onClick={() => {setColors({...colors, endNodeFill: INITIAL_COLORS.endNodeFill});}} style={{ backgroundColor: "transparent" }} size="small">
                                    <Replay style={{ color: "#fff", width: 20, height: 20 }} fontSize="inherit" />
                                </IconButton>
                            </div>
                        </div>

                        <div>
                            <Typography id="end-border-label" >
                                Цвет границы конечной точки
                            </Typography>
                            <div className="color-container">
                                <MuiColorInput value={arrayToRgb(colors.endNodeBorder)} onChange={v => {setColors({...colors, endNodeBorder: rgbToArray(v)});}} aria-labelledby="end-border-label" style={{ backgroundColor: "#404156" }} />
                                <IconButton onClick={() => {setColors({...colors, endNodeBorder: INITIAL_COLORS.endNodeBorder});}} style={{ backgroundColor: "transparent" }} size="small">
                                    <Replay style={{ color: "#fff", width: 20, height: 20 }} fontSize="inherit" />
                                </IconButton>
                            </div>
                        </div>

                        <div>
                            <Typography id="path-label" >
                                Цвет пути
                            </Typography>
                            <div className="color-container">
                                <MuiColorInput value={arrayToRgb(colors.path)} onChange={v => {setColors({...colors, path: rgbToArray(v)});}} aria-labelledby="path-label" style={{ backgroundColor: "#404156" }} />
                                <IconButton onClick={() => {setColors({...colors, path: INITIAL_COLORS.path});}} style={{ backgroundColor: "transparent" }} size="small">
                                    <Replay style={{ color: "#fff", width: 20, height: 20 }} fontSize="inherit" />
                                </IconButton>
                            </div>
                        </div>

                        <div>
                            <Typography id="route-label" >
                                Цвет кратчайшего маршрута
                            </Typography>
                            <div className="color-container">
                                <MuiColorInput value={arrayToRgb(colors.route)} onChange={v => {setColors({...colors, route: rgbToArray(v)});}} aria-labelledby="route-label" style={{ backgroundColor: "#404156" }} />
                                <IconButton onClick={() => {setColors({...colors, route: INITIAL_COLORS.route});}} style={{ backgroundColor: "transparent" }} size="small">
                                    <Replay style={{ color: "#fff", width: 20, height: 20 }} fontSize="inherit" />
                                </IconButton>
                            </div>
                        </div>
                    </div>

                    <div className="shortcuts-container">
                        <Typography style={{ color: "#A8AFB3", textTransform: "uppercase", fontSize: 14 }} >
                            Горячие клавиши
                        </Typography>

                        <div className="shortcut">
                            <p>ПРОБЕЛ</p>
                            <p>Запуск/Остановка анимации</p>
                        </div>
                        <div className="shortcut">
                            <p>R</p>
                            <p>Очистить путь</p>
                        </div>
                        <div className="shortcut">
                            <p>Стрелки</p>
                            <p>Управление анимацией</p>
                        </div>
                        <Button onClick={() => {setActiveStep(0);setShowTutorial(true);}}
                            variant="contained" style={{ backgroundColor: "#404156", color: "#fff" }}
                        >
                            Показать обучение
                        </Button>
                    </div>
                </div>
            </Drawer>

            {/* Диалог сохранения маршрута */}
            <Dialog open={saveRouteDialogOpen} onClose={() => setSaveRouteDialogOpen(false)}>
                <DialogTitle>Сохранить маршрут</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Название маршрута"
                        type="text"
                        fullWidth
                        value={routeName}
                        onChange={(e) => setRouteName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSaveRouteDialogOpen(false)}>Отмена</Button>
                    <Button onClick={handleSaveRoute} color="primary">Сохранить</Button>
                </DialogActions>
            </Dialog>
            
            {/* Компонент сохраненных маршрутов */}
                        <SavedRoutes
                open={savedRoutesDrawerOpen}
                onClose={() => setSavedRoutesDrawerOpen(false)}
                onSelectRoute={handleSelectRoute}
            />
            
            <SavedPoints
                open={savedPointsDrawerOpen}
                onClose={() => setSavedPointsDrawerOpen(false)}
                onSelectAsStart={handleSelectPointAsStart}
                onSelectAsEnd={handleSelectPointAsEnd}
                onSelectAsIntermediate={handleSelectPointAsIntermediate}
            />
            
            {/* Диалог сохранения точки */}
            <Dialog open={savePointDialogOpen} onClose={() => setSavePointDialogOpen(false)}>
                <DialogTitle>Сохранить точку</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Название точки"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={pointName}
                        onChange={(e) => setPointName(e.target.value)}
                        placeholder="Например: Дом, Работа, Магазин"
                    />
                    {currentPoint && (
                        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                            Координаты: {currentPoint.lat.toFixed(5)}, {currentPoint.lon.toFixed(5)}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSavePointDialogOpen(false)}>Отмена</Button>
                    <Button onClick={handleSavePoint} variant="contained">Сохранить</Button>
                </DialogActions>
            </Dialog>

            {/* Диалог для профиля */}
            <Dialog 
                open={profileDialogOpen} 
                onClose={handleCloseProfileDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Мой профиль</DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 3, mt: 1, display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                            sx={{ 
                                width: 80, 
                                height: 80, 
                                bgcolor: 'primary.main',
                                fontSize: '2rem',
                                mr: 3
                            }}
                        >
                            {user?.username?.charAt(0)?.toUpperCase() || 'П'}
                        </Avatar>
                        <Box>
                            <Typography variant="h6">
                                {user?.username || 'Пользователь'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {user?.email || 'Нет данных'}
                            </Typography>
                        </Box>
                    </Box>
                    
                    <TextField
                        label="Имя пользователя"
                        value={user?.username || ''}
                        fullWidth
                        disabled
                        sx={{ mb: 2 }}
                    />
                    
                    <TextField
                        label="Email"
                        value={user?.email || ''}
                        fullWidth
                        disabled
                        sx={{ mb: 2 }}
                    />
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        ID пользователя: {user?.id || 'Нет данных'}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseProfileDialog}>Закрыть</Button>
                </DialogActions>
            </Dialog>

            {/* Импортируем диалог авторизации */}
            <Dialog 
                open={authDialogOpen} 
                onClose={handleCloseAuthDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {isLoginForm ? 'Вход в систему' : 'Регистрация'}
                    <IconButton
                        aria-label="close"
                        onClick={handleCloseAuthDialog}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            py: 2,
                        }}
                    >
                        {isLoginForm ? (
                            <LoginForm 
                                onSuccess={handleCloseAuthDialog} 
                                onToggleForm={() => setIsLoginForm(false)} 
                            />
                        ) : (
                            <RegisterForm 
                                onSuccess={handleCloseAuthDialog} 
                                onToggleForm={() => setIsLoginForm(true)} 
                            />
                        )}
                    </Box>
                </DialogContent>
            </Dialog>
        </>
    );
});

Interface.displayName = "Interface";

export default Interface;
