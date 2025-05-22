import DeckGL from "@deck.gl/react";
import { Map as MapGL } from "react-map-gl";
import maplibregl from "maplibre-gl";
import { PolygonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { FlyToInterpolator } from "deck.gl";
import { TripsLayer } from "@deck.gl/geo-layers";
import { createGeoJSONCircle } from "../helpers";
import { useEffect, useRef, useState } from "react";
import { getBoundingBoxFromPolygon, getMapGraph, getNearestNode } from "../services/MapService";
import PathfindingState from "../models/PathfindingState";
import Interface from "./Interface";
import { INITIAL_COLORS, INITIAL_VIEW_STATE, MAP_STYLE } from "../config";
import useSmoothStateChange from "../hooks/useSmoothStateChange";

function Map() {
    const [startNode, setStartNode] = useState(null);
    const [endNode, setEndNode] = useState(null);
    const [intermediatePoints, setIntermediatePoints] = useState([]);
    const [selectionRadius, setSelectionRadius] = useState([]);
    const [tripsData, setTripsData] = useState([]);
    const [started, setStarted] = useState();
    const [time, setTime] = useState(0);
    const [animationEnded, setAnimationEnded] = useState(false);
    const [playbackOn, setPlaybackOn] = useState(false);
    const [playbackDirection, setPlaybackDirection] = useState(1);
    const [fadeRadiusReverse, setFadeRadiusReverse] = useState(false);
    const [cinematic, setCinematic] = useState(false);
    const [placeEnd, setPlaceEnd] = useState(false);
    const [placeIntermediate, setPlaceIntermediate] = useState(false);
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({ algorithm: "astar", radius: 4, speed: 5 });
    const [colors, setColors] = useState(INITIAL_COLORS);
    const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
    const ui = useRef();
    const fadeRadius = useRef();
    const requestRef = useRef();
    const previousTimeRef = useRef();
    const timer = useRef(0);
    const waypoints = useRef([]);
    const state = useRef(new PathfindingState());
    const traceNode = useRef(null);
    const traceNode2 = useRef(null);
    const currentIntermediateIndex = useRef(-1);
    const fullPathData = useRef([]);
    const selectionRadiusOpacity = useSmoothStateChange(0, 0, 1, 400, fadeRadius.current, fadeRadiusReverse);

    // Публичная функция для прямого вызова mapClick
    const direct_mapClick = async (lat, lon, isRightClick = false) => {
        // Создаем объект с координатами для mapClick
        const e = {
            coordinate: [lon, lat],
            layer: {id: "selection-radius"} // Имитируем, что клик внутри радиуса
        };
        
        // Создаем объект информации о клике для mapClick
        const info = {
            rightButton: isRightClick
        };
        
        // Вызываем mapClick с созданными параметрами
        await mapClick(e, info);
    };

    async function mapClick(e, info, radius = null) {
        if(started && !animationEnded) return;

        setFadeRadiusReverse(false);
        fadeRadius.current = true;
        clearPath();

        // Проверяем, нажата ли клавиша Ctrl
        if (info.srcEvent && (info.srcEvent.ctrlKey || info.ctrlKey)) {
            if(e.layer?.id !== "selection-radius") {
                ui.current.showSnack("Пожалуйста, выберите точку внутри радиуса.", "info");
                return;
            }

            if(loading) {
                ui.current.showSnack("Пожалуйста, дождитесь загрузки всех данных.", "info");
                return;
            }

            const loadingHandle = setTimeout(() => {
                setLoading(true);
            }, 300);
            
            const node = await getNearestNode(e.coordinate[1], e.coordinate[0]);
            if(!node) {
                ui.current.showSnack("В окрестности не найдено доступных точек, попробуйте другое место.");
                clearTimeout(loadingHandle);
                setLoading(false);
                return;
            }

            // Используем функцию addIntermediatePoint для добавления точки с проверкой на дубликаты
            addIntermediatePoint(node);
            
            clearTimeout(loadingHandle);
            setLoading(false);
            return;
        }

        if (placeIntermediate) {
            if(e.layer?.id !== "selection-radius") {
                ui.current.showSnack("Пожалуйста, выберите точку внутри радиуса.", "info");
                return;
            }

            if(loading) {
                ui.current.showSnack("Пожалуйста, дождитесь загрузки всех данных.", "info");
                return;
            }

            const loadingHandle = setTimeout(() => {
                setLoading(true);
            }, 300);
            
            const node = await getNearestNode(e.coordinate[1], e.coordinate[0]);
            if(!node) {
                ui.current.showSnack("В окрестности не найдено доступных точек, попробуйте другое место.");
                clearTimeout(loadingHandle);
                setLoading(false);
                return;
            }

            setIntermediatePoints(prev => [...prev, node]);
            setPlaceIntermediate(false);
            
            clearTimeout(loadingHandle);
            setLoading(false);
            return;
        }

        if(info.rightButton || placeEnd) {
            if(e.layer?.id !== "selection-radius") {
                ui.current.showSnack("Пожалуйста, выберите точку внутри радиуса.", "info");
                return;
            }

            if(loading) {
                ui.current.showSnack("Пожалуйста, дождитесь загрузки всех данных.", "info");
                return;
            }

            const loadingHandle = setTimeout(() => {
                setLoading(true);
            }, 300);
            
            const node = await getNearestNode(e.coordinate[1], e.coordinate[0]);
            if(!node) {
                ui.current.showSnack("В окрестности не найдено доступных точек, попробуйте другое место.");
                clearTimeout(loadingHandle);
                setLoading(false);
                return;
            }

            const realEndNode = state.current.getNode(node.id);
            setEndNode(node);
            
            clearTimeout(loadingHandle);
            setLoading(false);

            if(!realEndNode) {
                ui.current.showSnack("Произошла ошибка. Пожалуйста, попробуйте снова.");
                return;
            }
            state.current.endNode = realEndNode;
            
            return;
        }

        const loadingHandle = setTimeout(() => {
            setLoading(true);
        }, 300);

        const node = await getNearestNode(e.coordinate[1], e.coordinate[0]);
        if(!node) {
            ui.current.showSnack("В окрестности не найдено доступных точек, попробуйте другое место.");
            clearTimeout(loadingHandle);
            setLoading(false);
            return;
        }

        setStartNode(node);
        setEndNode(null);
        setIntermediatePoints([]);
        const circle = createGeoJSONCircle([node.lon, node.lat], radius ?? settings.radius);
        setSelectionRadius([{ contour: circle}]);
        
        getMapGraph(getBoundingBoxFromPolygon(circle)).then(graph => {
            state.current.graph = graph;
            
            // Находим ближайший узел для начальной точки
            const startGraphNode = state.current.findNearestNode(node.lat, node.lon);
            if (startGraphNode) {
                // Обновляем ID начальной точки
                setStartNode(prev => ({
                    ...prev,
                    id: startGraphNode.id
                }));
            }
            
            clearPath();
            clearTimeout(loadingHandle);
            setLoading(false);
        });
    }

    function removeIntermediatePoint(index) {
        setIntermediatePoints(prev => prev.filter((_, i) => i !== index));
    }

    function addIntermediatePoint(point) {
        // Проверяем, нет ли уже такой точки в массиве промежуточных точек
        const isPointExists = intermediatePoints.some(p => p.id === point.id);
        if (isPointExists) {
            ui.current.showSnack("Эта точка уже добавлена как промежуточная", "info");
            return false;
        }
        
        // Добавляем новую промежуточную точку
        setIntermediatePoints(prev => [...prev, point]);
        return true;
    }

    function startPathfinding() {
        setFadeRadiusReverse(true);
        setTimeout(() => {
            clearPath();
            currentIntermediateIndex.current = -1;
            fullPathData.current = [];
            
            if (intermediatePoints.length > 0) {
                processNextRouteSegment();
            } else {
                state.current.start(settings.algorithm);
                setStarted(true);
            }
        }, 400);
    }

    function processNextRouteSegment() {
        currentIntermediateIndex.current++;
        console.log(`Обрабатываем сегмент ${currentIntermediateIndex.current}`);
        
        // Проверка состояния графа перед началом поиска
        if (!state.current.graph || !state.current.graph.nodes || state.current.graph.nodes.size === 0) {
            ui.current.showSnack("Ошибка: граф не загружен или не содержит узлов", "error");
            console.error("Граф не загружен или не содержит узлов");
            return;
        }
        
        console.log(`Размер графа: ${state.current.graph.nodes.size} узлов`);
        
        let fromNode, toNode;
        
        if (currentIntermediateIndex.current === 0) {
            // Используем findNearestNode вместо getNode для начальной точки
            fromNode = state.current.findNearestNode(startNode.lat, startNode.lon);
            console.log('Начальная точка первого сегмента: startNode', startNode);
            
            // Проверка на случай, если начальная точка не найдена в графе
            if (!fromNode) {
                console.error(`Не удалось найти начальную точку с координатами ${startNode.lat}, ${startNode.lon} в графе`);
                ui.current.showSnack("Ошибка: Начальная точка вне графа", "error");
                return;
            }
            
            // Обновляем ID начальной точки
            setStartNode(prev => ({
                ...prev,
                id: fromNode.id
            }));
        } else {
            const prevIdx = currentIntermediateIndex.current - 1;
            const prevPoint = intermediatePoints[prevIdx];
            
            // Используем findNearestNode вместо getNode для промежуточной точки
            fromNode = state.current.findNearestNode(prevPoint.lat, prevPoint.lon);
            console.log(`Начальная точка сегмента ${currentIntermediateIndex.current}: промежуточная точка ${prevIdx}`, prevPoint);
            
            // Проверка на случай, если промежуточная точка не найдена в графе
            if (!fromNode) {
                console.error(`Не удалось найти промежуточную точку с координатами ${prevPoint.lat}, ${prevPoint.lon} в графе`);
                ui.current.showSnack("Не удалось найти промежуточную точку в графе", "error");
                return;
            }
            
            // Обновляем промежуточную точку в массиве
            const updatedIntermediatePoints = [...intermediatePoints];
            updatedIntermediatePoints[prevIdx] = {
                id: fromNode.id,
                lat: fromNode.latitude || prevPoint.lat,
                lon: fromNode.longitude || prevPoint.lon
            };
            setIntermediatePoints(updatedIntermediatePoints);
            console.log(`Промежуточная точка ${prevIdx} обновлена на id=${fromNode.id}`);
        }
        
        if (currentIntermediateIndex.current < intermediatePoints.length) {
            const currentPoint = intermediatePoints[currentIntermediateIndex.current];
            
            // Используем findNearestNode вместо getNode для промежуточной точки
            toNode = state.current.findNearestNode(currentPoint.lat, currentPoint.lon);
            console.log(`Конечная точка сегмента ${currentIntermediateIndex.current}: промежуточная точка ${currentIntermediateIndex.current}`, currentPoint);
            
            if (toNode) {
                console.log(`Найден узел с id ${toNode.id} для точки с координатами ${currentPoint.lat}, ${currentPoint.lon}`);
                // Обновляем промежуточную точку в массиве
                const updatedIntermediatePoints = [...intermediatePoints];
                updatedIntermediatePoints[currentIntermediateIndex.current] = {
                    id: toNode.id,
                    lat: toNode.latitude || currentPoint.lat,
                    lon: toNode.longitude || currentPoint.lon
                };
                setIntermediatePoints(updatedIntermediatePoints);
                console.log(`Промежуточная точка ${currentIntermediateIndex.current} обновлена на id=${toNode.id}`);
            } else {
                console.error(`Не удалось найти узел для промежуточной точки с координатами ${currentPoint.lat}, ${currentPoint.lon}`);
                ui.current.showSnack("Не удалось найти ближайший узел для промежуточной точки", "error");
                return;
            }
        } else {
            // Используем findNearestNode вместо getNode для конечной точки
            toNode = state.current.findNearestNode(endNode.lat, endNode.lon);
            console.log('Конечная точка последнего сегмента: endNode', endNode);
            
            if (toNode) {
                console.log(`Найден узел с id ${toNode.id} для конечной точки с координатами ${endNode.lat}, ${endNode.lon}`);
                // Обновляем конечную точку
                setEndNode({
                    id: toNode.id,
                    lat: toNode.latitude || endNode.lat,
                    lon: toNode.longitude || endNode.lon
                });
                console.log(`Конечная точка обновлена на id=${toNode.id}`);
            } else {
                console.error(`Не удалось найти узел для конечной точки с координатами ${endNode.lat}, ${endNode.lon}`);
                ui.current.showSnack("Не удалось найти ближайший узел для конечной точки", "error");
                return;
            }
        }
        
        if (!fromNode || !toNode) {
            ui.current.showSnack("Ошибка при построении маршрута: не удалось определить точки сегмента", "error");
            console.error("Не удалось определить точки для сегмента", { fromNode, toNode });
            return;
        }
        
        console.log(`Сегмент ${currentIntermediateIndex.current} настроен: fromNode=${fromNode.id}, toNode=${toNode.id}`);
        state.current.graph.startNode = fromNode;
        state.current.endNode = toNode;
        
        state.current.start(settings.algorithm);
        setStarted(true);
    }

    function toggleAnimation(loop = true, direction = 1) {
        if(time === 0 && !animationEnded) return;
        setPlaybackDirection(direction);
        if(animationEnded) {
            if(loop && time >= timer.current) {
                setTime(0);
            }
            setStarted(true);
            setPlaybackOn(!playbackOn);
            return;
        }
        setStarted(!started);
        if(started) {
            previousTimeRef.current = null;
        }
    }

    function clearPath() {
        setStarted(false);
        setTripsData([]);
        setTime(0);
        state.current.reset();
        waypoints.current = [];
        fullPathData.current = [];
        timer.current = 0;
        previousTimeRef.current = null;
        traceNode.current = null;
        traceNode2.current = null;
        currentIntermediateIndex.current = -1;
        setAnimationEnded(false);
    }

    function animateStep(newTime) {
        const updatedNodes = state.current.nextStep();
        for(const updatedNode of updatedNodes) {
            updateWaypoints(updatedNode, updatedNode.referer);
        }

        if(state.current.finished && !animationEnded) {
            if(settings.algorithm === "bidirectional") {
                if(!traceNode.current) traceNode.current = updatedNodes[0];
                const parentNode = traceNode.current.parent;
                updateWaypoints(parentNode, traceNode.current, "route", Math.max(Math.log2(settings.speed), 1));
                traceNode.current = parentNode ?? traceNode.current;

                if(!traceNode2.current) {
                    traceNode2.current = updatedNodes[0];
                    traceNode2.current.parent = traceNode2.current.prevParent;
                }
                const parentNode2 = traceNode2.current.parent;
                updateWaypoints(parentNode2, traceNode2.current, "route", Math.max(Math.log2(settings.speed), 1));
                traceNode2.current = parentNode2 ?? traceNode2.current;
                
                if (time >= timer.current && parentNode == null && parentNode2 == null) {
                    const routeSegment = waypoints.current.filter(wp => wp.color === "route");
                    const pathSegment = waypoints.current.filter(wp => wp.color === "path");
                    
                    if (currentIntermediateIndex.current >= intermediatePoints.length) {
                        fullPathData.current = [...fullPathData.current, ...pathSegment, ...routeSegment];
                    } else {
                        fullPathData.current = [...fullPathData.current, ...pathSegment, ...routeSegment];
                    }
                    
                    const hasMoreSegments = currentIntermediateIndex.current < intermediatePoints.length;
                    
                    if (hasMoreSegments) {
                        console.log(`Закончили сегмент ${currentIntermediateIndex.current}, переходим к следующему`);
                        waypoints.current = [];
                        timer.current = 0;
                        setTime(0);
                        traceNode.current = null;
                        traceNode2.current = null;
                        state.current.reset();
                        
                        processNextRouteSegment();
                        return;
                    } else {
                        console.log('Построение маршрута завершено');
                        
                        // Проверяем, что в финальном маршруте есть участки "route"
                        const hasRouteSegments = fullPathData.current.some(wp => wp.color === "route");
                        
                        // Если нет участков "route", преобразуем все сегменты в "route"
                        if (!hasRouteSegments) {
                            console.log('Преобразуем все сегменты маршрута в тип "route"');
                            fullPathData.current = fullPathData.current.map(wp => ({
                                ...wp,
                                color: "route"
                            }));
                        }
                        
                        // Обновляем временные метки для полного маршрута
                        updateTimestampsForFullPath();
                        
                        // Показываем полный маршрут и завершаем анимацию
                        setTripsData(fullPathData.current);
                        setTime(timer.current);
                        setAnimationEnded(true);
                    }
                }
            }
            else {
                if(!traceNode.current) traceNode.current = state.current.endNode;
                const parentNode = traceNode.current.parent;
                updateWaypoints(parentNode, traceNode.current, "route", Math.max(Math.log2(settings.speed), 1));
                traceNode.current = parentNode ?? traceNode.current;
                
                if (time >= timer.current && parentNode == null) {
                    const routeSegment = waypoints.current.filter(wp => wp.color === "route");
                    const pathSegment = waypoints.current.filter(wp => wp.color === "path");
                    
                    if (currentIntermediateIndex.current >= intermediatePoints.length) {
                        fullPathData.current = [...fullPathData.current, ...pathSegment, ...routeSegment];
                    } else {
                        fullPathData.current = [...fullPathData.current, ...pathSegment, ...routeSegment];
                    }
                    
                    const hasMoreSegments = currentIntermediateIndex.current < intermediatePoints.length;
                    
                    if (hasMoreSegments) {
                        console.log(`Закончили сегмент ${currentIntermediateIndex.current}, переходим к следующему`);
                        waypoints.current = [];
                        timer.current = 0;
                        setTime(0);
                        traceNode.current = null;
                        state.current.reset();
                        
                        processNextRouteSegment();
                        return;
                    } else {
                        console.log('Построение маршрута завершено');
                        
                        // Проверяем, что в финальном маршруте есть участки "route"
                        const hasRouteSegments = fullPathData.current.some(wp => wp.color === "route");
                        
                        // Если нет участков "route", преобразуем все сегменты в "route"
                        if (!hasRouteSegments) {
                            console.log('Преобразуем все сегменты маршрута в тип "route"');
                            fullPathData.current = fullPathData.current.map(wp => ({
                                ...wp,
                                color: "route"
                            }));
                        }
                        
                        // Обновляем временные метки для полного маршрута
                        updateTimestampsForFullPath();
                        
                        // Показываем полный маршрут и завершаем анимацию
                        setTripsData(fullPathData.current);
                        setTime(timer.current);
                        setAnimationEnded(true);
                    }
                }
            }
        }

        if (previousTimeRef.current != null && !animationEnded) {
            const deltaTime = newTime - previousTimeRef.current;
            setTime(prevTime => (prevTime + deltaTime * playbackDirection));
        }

        if(previousTimeRef.current != null && animationEnded && playbackOn) {
            const deltaTime = newTime - previousTimeRef.current;
            if(time >= timer.current && playbackDirection !== -1) {
                setPlaybackOn(false);
            }
            setTime(prevTime => (Math.max(Math.min(prevTime + deltaTime * 2 * playbackDirection, timer.current), 0)));
        }
    }

    function animate(newTime) {
        for(let i = 0; i < settings.speed; i++) {
            animateStep(newTime);
        }

        previousTimeRef.current = newTime;
        requestRef.current = requestAnimationFrame(animate);
    }

    function updateWaypoints(node, refererNode, color = "path", timeMultiplier = 1) {
        if(!node || !refererNode) return;
        const distance = Math.hypot(node.longitude - refererNode.longitude, node.latitude - refererNode.latitude);
        const timeAdd = distance * 50000 * timeMultiplier;

        const newWaypoint = { 
            path: [[refererNode.longitude, refererNode.latitude], [node.longitude, node.latitude]],
            timestamps: [timer.current, timer.current + timeAdd],
            color
        };

        waypoints.current = [...waypoints.current, newWaypoint];
        timer.current += timeAdd;
        
        // Сортируем waypoints, чтобы линии route отрисовывались поверх path
        const sortedWaypoints = [...waypoints.current].sort((a, b) => {
            if (a.color === "path" && b.color === "route") return -1;
            if (a.color === "route" && b.color === "path") return 1;
            return 0;
        });
        
        setTripsData(() => sortedWaypoints);
    }

    function changeLocation(location) {
        setViewState({ ...viewState, longitude: location.longitude, latitude: location.latitude, zoom: 13,transitionDuration: 1, transitionInterpolator: new FlyToInterpolator()});
    }

    function changeSettings(newSettings) {
        setSettings(newSettings);
        const items = { settings: newSettings, colors };
        localStorage.setItem("path_settings", JSON.stringify(items));
    }

    function changeColors(newColors) {
        setColors(newColors);
        const items = { settings, colors: newColors };
        localStorage.setItem("path_settings", JSON.stringify(items));
    }

    function changeAlgorithm(algorithm) {
        clearPath();
        changeSettings({ ...settings, algorithm });
    }

    function changeRadius(radius) {
        changeSettings({...settings, radius});
        if(startNode) {
            mapClick({coordinate: [startNode.lon, startNode.lat]}, {}, radius);
        }
    }

    async function loadRoute(savedRoute) {
        if (!savedRoute || !savedRoute.startNode) {
            ui.current.showSnack("Ошибка загрузки: не указана начальная точка", "error");
            return;
        }

        setLoading(true);
        clearPath();

        try {
            // Устанавливаем настройки, если они переданы
            if (savedRoute.settings) {
                setSettings(savedRoute.settings);
            }

            // Устанавливаем начальную точку
            setStartNode(savedRoute.startNode);
            
            // Создаем круг выбора вокруг начальной точки
            const circle = createGeoJSONCircle(
                [savedRoute.startNode.lon, savedRoute.startNode.lat], 
                savedRoute.settings?.radius || settings.radius
            );
            setSelectionRadius([{ contour: circle }]);
            
            // Загружаем граф для начальной точки
            // Убираем использование ID при загрузке графа, так как он может быть недействительным
            const graph = await getMapGraph(getBoundingBoxFromPolygon(circle));
            state.current.graph = graph;
            
            // Находим ближайший узел для начальной точки вместо использования ID
            const startGraphNode = state.current.findNearestNode(
                savedRoute.startNode.lat, 
                savedRoute.startNode.lon
            );
            
            if (startGraphNode) {
                // Обновляем ID начальной точки
                setStartNode({
                    ...savedRoute.startNode,
                    id: startGraphNode.id
                });
            } else {
                ui.current.showSnack("Не удалось найти узел графа для начальной точки", "error");
            }

            // Устанавливаем промежуточные точки, если они есть
            if (savedRoute.intermediatePoints && savedRoute.intermediatePoints.length > 0) {
                // Здесь мы не меняем ID промежуточных точек - они будут обновлены при построении маршрута
                setIntermediatePoints(savedRoute.intermediatePoints);
            } else {
                setIntermediatePoints([]);
            }

            // Устанавливаем конечную точку, если она есть
            if (savedRoute.endNode) {
                setEndNode(savedRoute.endNode);
                
                // Находим ближайший узел для конечной точки вместо использования ID
                const realEndNode = state.current.findNearestNode(
                    savedRoute.endNode.lat,
                    savedRoute.endNode.lon
                );
                
                if (!realEndNode) {
                    setEndNode(null); // Сбрасываем конечную точку, если она не найдена в графе
                    ui.current.showSnack("Конечная точка вне зоны досягаемости от начальной", "warning");
                } else {
                    // Обновляем ID конечной точки
                    setEndNode({
                        ...savedRoute.endNode,
                        id: realEndNode.id
                    });
                    state.current.endNode = realEndNode;
                }
            } else {
                setEndNode(null);
                state.current.endNode = null;
            }
            
            // Устанавливаем вид карты
            setViewState({
                ...viewState,
                longitude: savedRoute.startNode.lon,
                latitude: savedRoute.startNode.lat,
                zoom: 13,
                transitionDuration: 1000,
                transitionInterpolator: new FlyToInterpolator()
            });
            
            if (savedRoute.endNode) {
                ui.current.showSnack("Маршрут успешно загружен", "success");
            } else {
                ui.current.showSnack("Начальная точка успешно установлена", "success");
            }
        } catch (error) {
            console.error("Ошибка при загрузке маршрута:", error);
            ui.current.showSnack("Ошибка при загрузке", "error");
        } finally {
            setLoading(false);
        }
    }

    function updateTimestampsForFullPath() {
        if (fullPathData.current.length === 0) return;
        
        let currentTime = 0;
        
        // Сначала сортируем массив, чтобы все элементы path шли перед route
        fullPathData.current.sort((a, b) => {
            if (a.color === "path" && b.color === "route") return -1;
            if (a.color === "route" && b.color === "path") return 1;
            return 0;
        });
        
        fullPathData.current = fullPathData.current.map(segment => {
            const duration = segment.timestamps[1] - segment.timestamps[0];
            const newSegment = {
                ...segment,
                timestamps: [currentTime, currentTime + duration]
            };
            currentTime += duration;
            return newSegment;
        });
        
        timer.current = currentTime;
    }

    useEffect(() => {
        if(!started) return;
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [started, time, animationEnded, playbackOn]);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(res => {
            changeLocation(res.coords);
        });

        const settings = localStorage.getItem("path_settings");
        if(!settings) return;
        const items = JSON.parse(settings);

        setSettings(items.settings);
        setColors(items.colors);
    }, []);

    return (
        <>
            <div onContextMenu={(e) => { e.preventDefault(); }}>
                <DeckGL
                    initialViewState={viewState}
                    controller={{ doubleClickZoom: false, keyboard: false }}
                    onClick={mapClick}
                >
                    <PolygonLayer 
                        id={"selection-radius"}
                        data={selectionRadius}
                        pickable={true}
                        stroked={true}
                        getPolygon={d => d.contour}
                        getFillColor={[80, 210, 0, 10]}
                        getLineColor={[9, 142, 46, 175]}
                        getLineWidth={3}
                        opacity={selectionRadiusOpacity}
                    />
                    <TripsLayer
                        id={"pathfinding-layer"}
                        data={tripsData}
                        opacity={1}
                        widthMinPixels={3}
                        widthMaxPixels={5}
                        fadeTrail={false}
                        currentTime={time}
                        getColor={d => colors[d.color]}
                        updateTriggers={{
                            getColor: [colors.path, colors.route]
                        }}
                    />
                    <ScatterplotLayer 
                        id="start-end-points"
                        data={[
                            ...(startNode ? [{ coordinates: [startNode.lon, startNode.lat], color: colors.startNodeFill, lineColor: colors.startNodeBorder }] : []),
                            ...(intermediatePoints.map((point, index) => ({ 
                                coordinates: [point.lon, point.lat], 
                                color: [255, 165, 0, 200],
                                lineColor: [255, 140, 0, 255],
                                pointIndex: index
                            }))),
                            ...(endNode ? [{ coordinates: [endNode.lon, endNode.lat], color: colors.endNodeFill, lineColor: colors.endNodeBorder }] : []),
                        ]}
                        pickable={true}
                        opacity={1}
                        stroked={true}
                        filled={true}
                        radiusScale={1}
                        radiusMinPixels={7}
                        radiusMaxPixels={20}
                        lineWidthMinPixels={1}
                        lineWidthMaxPixels={3}
                        getPosition={d => d.coordinates}
                        getFillColor={d => d.color}
                        getLineColor={d => d.lineColor}
                        onClick={(info, event) => {
                            if (info.object && info.object.pointIndex !== undefined && !started && !animationEnded) {
                                removeIntermediatePoint(info.object.pointIndex);
                                event.stopPropagation();
                            }
                        }}
                    />
                    <MapGL 
                        reuseMaps mapLib={maplibregl} 
                        mapStyle={MAP_STYLE} 
                        doubleClickZoom={false}
                    />
                </DeckGL>
            </div>
            <Interface 
                ref={ui}
                canStart={startNode && endNode}
                started={started}
                animationEnded={animationEnded}
                playbackOn={playbackOn}
                time={time}
                startPathfinding={startPathfinding}
                toggleAnimation={toggleAnimation}
                clearPath={clearPath}
                timeChanged={setTime}
                changeLocation={changeLocation}
                maxTime={timer.current}
                settings={settings}
                setSettings={changeSettings}
                changeAlgorithm={changeAlgorithm}
                colors={colors}
                setColors={changeColors}
                loading={loading}
                cinematic={cinematic}
                setCinematic={setCinematic}
                placeEnd={placeEnd}
                setPlaceEnd={setPlaceEnd}
                placeIntermediate={placeIntermediate}
                setPlaceIntermediate={setPlaceIntermediate}
                intermediatePoints={intermediatePoints}
                onAddIntermediatePoint={addIntermediatePoint}
                onRemoveIntermediatePoint={removeIntermediatePoint}
                changeRadius={changeRadius}
                startNode={startNode}
                endNode={endNode}
                loadRoute={loadRoute}
                directMapClick={direct_mapClick}
            />
            <div className="attrib-container"><summary className="maplibregl-ctrl-attrib-button" title="Переключить атрибуцию" aria-label="Переключить атрибуцию"></summary><div className="maplibregl-ctrl-attrib-inner">© <a href="https://carto.com/about-carto/" target="_blank" rel="noopener">CARTO</a>, © <a href="http://www.openstreetmap.org/about/" target="_blank">OpenStreetMap</a> авторы</div></div>
        </>
    );
}

// Экспортируем компонент Map
export default Map;