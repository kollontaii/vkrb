import React from 'react';
import { Box, Typography, Switch, FormControlLabel, FormGroup, FormControl, Select, MenuItem, Button, InputLabel } from '@mui/material';
import { ShuffleOn } from '@mui/icons-material';

/**
 * Компонент для оптимизации маршрута с помощью алгоритмов решения задачи коммивояжера
 */
const RouteOptimizer = ({ 
    settings,
    onSettingsChange,
    onOptimize,
    startNode,
    endNode,
    intermediatePoints 
}) => {
    // Обработчик изменения настроек оптимизации
    const handleTspChange = (e) => {
        onSettingsChange({ useTsp: e.target.checked });
    };

    // Обработчик изменения метода оптимизации
    const handleTspMethodChange = (e) => {
        onSettingsChange({ tspMethod: e.target.value });
    };

    // Проверка возможности оптимизации
    const canOptimize = intermediatePoints && intermediatePoints.length >= 2 && startNode && endNode;

    return (
        <Box sx={{ mb: 3 }}>
            <Typography style={{ color: "#A8AFB3", textTransform: "uppercase", fontSize: 14, marginBottom: 10 }}>
                Оптимизация маршрута
            </Typography>
            
            <FormGroup>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.useTsp || false}
                            onChange={handleTspChange}
                            color="primary"
                        />
                    }
                    label="Оптимизировать порядок точек автоматически"
                />
            </FormGroup>
            
            <Box sx={{ mt: 1, mb: 2 }}>
                <FormControl fullWidth disabled={!settings.useTsp}>
                    <InputLabel id="tsp-method-label">Метод оптимизации</InputLabel>
                    <Select
                        labelId="tsp-method-label"
                        value={settings.tspMethod || 'nearest'}
                        onChange={handleTspMethodChange}
                        label="Метод оптимизации"
                    >
                        <MenuItem value="nearest">Ближайший сосед (быстрый)</MenuItem>
                        <MenuItem value="2opt">2-Opt (лучший результат)</MenuItem>
                    </Select>
                </FormControl>
            </Box>
            
            <Button
                variant="contained"
                color="primary"
                onClick={onOptimize}
                startIcon={<ShuffleOn />}
                disabled={!canOptimize}
                fullWidth
                sx={{ mb: 1 }}
            >
                Оптимизировать маршрут
            </Button>
            
            {!canOptimize && (
                <Typography variant="caption" color="text.secondary">
                    Для оптимизации необходимы начальная, конечная и минимум 2 промежуточные точки
                </Typography>
            )}
        </Box>
    );
};

export default RouteOptimizer; 