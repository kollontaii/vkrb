export const MAP_STYLE = "./dark_style.json";

// Доступные стили карты
export const MAP_STYLES = {
    dark: {
        id: "dark",
        name: "Темная",
        url: "./dark_style.json",
        showBuildings: false
    },
    light: {
        id: "light",
        name: "Светлая",
        url: "./light_style.json",
        showBuildings: false
    }
};

// Стиль карты по умолчанию
export const DEFAULT_MAP_STYLE = MAP_STYLES.dark;

export const INITIAL_VIEW_STATE = {
    longitude: -0.127,
    latitude:  51.507   ,
    zoom: 13,
    pitch: 0,
    bearing: 0
};

export const INITIAL_COLORS = {
    startNodeFill: [70, 183, 128],
    startNodeBorder: [255, 255, 255],
    endNodeFill: [152, 4, 12],
    endNodeBorder: [0, 0, 0],
    path: [70, 183, 128],
    route: [165, 13, 32],
};

export const LOCATIONS = [
    { name: "Нью-Йорк", latitude: 40.712, longitude: -74.006 },
    { name: "Токио", latitude: 35.682, longitude: 139.759 },
    { name: "Париж", latitude: 48.856, longitude: 2.352 },
    { name: "Рим", latitude: 41.902, longitude: 12.496 },
    { name: "Прага", latitude: 50.086, longitude: 14.420 },
    { name: "Лондон", latitude: 51.507, longitude: -0.127 },
    { name: "Дубай", latitude: 25.276, longitude: 55.296 },
    { name: "Сингапур", latitude: 1.352, longitude: 103.820 },
    { name: "Сан-Франциско", latitude: 37.774, longitude: -122.419 },
    { name: "Берлин", latitude: 52.520, longitude: 13.405 },
    { name: "Сидней", latitude: -33.868, longitude: 151.209 },
    { name: "Амстердам", latitude: 52.367, longitude: 4.900 },
    { name: "Стокгольм", latitude: 59.329, longitude: 18.068 },
    { name: "Гонконг", latitude: 22.319, longitude: 114.169 },
    { name: "Рио-де-Жанейро", latitude: -22.906, longitude: -43.172 },
    { name: "Шанхай", latitude: 31.230, longitude: 121.473 },
    { name: "Барселона", latitude: 41.385, longitude: 2.173 }
];