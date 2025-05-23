import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { MAP_STYLES } from '../config';

function MapStyleSwitcher({ currentStyle, onStyleChange }) {
    const handleToggleStyle = () => {
        // Переключаем стиль между светлым и темным
        const newStyle = currentStyle.id === 'dark' ? MAP_STYLES.light : MAP_STYLES.dark;
        onStyleChange(newStyle);
    };

    return (
        <Box className="map-style-switcher" sx={{ position: 'absolute', top: 15, right: 55, zIndex: 1000 }}>
            <Tooltip title={`Переключить на ${currentStyle.id === 'dark' ? 'светлую' : 'темную'} тему`}>
                <IconButton
                    onClick={handleToggleStyle}
                    style={{ backgroundColor: "#2A2B37", width: 36, height: 36 }}
                    size="large"
                >
                    {currentStyle.id === 'dark' ? (
                        <LightModeIcon style={{ color: "#fff", width: 22, height: 22 }} fontSize="inherit" />
                    ) : (
                        <DarkModeIcon style={{ color: "#fff", width: 22, height: 22 }} fontSize="inherit" />
                    )}
                </IconButton>
            </Tooltip>
        </Box>
    );
}

export default MapStyleSwitcher; 