import AStar from "./algorithms/AStar";
import BidirectionalSearch from "./algorithms/BidirectionalSearch";
import Dijkstra from "./algorithms/Dijkstra";
import Greedy from "./algorithms/Greedy";
import PathfindingAlgorithm from "./algorithms/PathfindingAlgorithm";

export default class PathfindingState {
    static #instance;

    /**
     * Singleton class
     * @returns {PathfindingState}
     */
    constructor() {
        if (!PathfindingState.#instance) {
            this.endNode = null;
            this.graph = null;
            this.finished = false;
            this.algorithm = new PathfindingAlgorithm();
            PathfindingState.#instance = this;
        }
    
        return PathfindingState.#instance;
    }

    get startNode() {
        return this.graph.startNode;
    }

    /**
     * 
     * @param {Number} id OSM node id
     * @returns {import("./Node").default} node
     */
    getNode(id) {
        return this.graph?.getNode(id);
    }

    /**
     * Находит ближайший узел к указанным координатам
     * @param {Number} lat Широта
     * @param {Number} lon Долгота
     * @returns {import("./Node").default} Ближайший узел или null
     */
    findNearestNode(lat, lon) {
        if (!this.graph || !this.graph.nodes || this.graph.nodes.size === 0) {
            console.error("findNearestNode: Граф пуст или не содержит узлов");
            return null;
        }

        let minDistance = Infinity;
        let nearestNode = null;
        let nodeCount = 0;
        let validNodeCount = 0;

        // Перебираем все узлы и находим ближайший
        for (const node of this.graph.nodes.values()) {
            nodeCount++;
            
            // Получаем координаты узла, учитывая разные варианты хранения (lat/lon или latitude/longitude)
            const nodeLat = node.lat !== undefined ? node.lat : node.latitude;
            const nodeLon = node.lon !== undefined ? node.lon : node.longitude;
            
            if (nodeLat === undefined || nodeLon === undefined) {
                continue;
            }
            
            validNodeCount++;
            
            // Вычисляем расстояние между точками (приближение)
            const distance = Math.sqrt(
                Math.pow(nodeLat - lat, 2) + 
                Math.pow(nodeLon - lon, 2)
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestNode = node;
            }
        }

        if (!nearestNode) {
            console.error(`findNearestNode: Не удалось найти подходящий узел. Всего узлов: ${nodeCount}, узлов с координатами: ${validNodeCount}`);
        } else {
            console.log(`findNearestNode: Найден ближайший узел с id=${nearestNode.id}, расстояние=${minDistance.toFixed(6)}`);
        }

        return nearestNode;
    }

    /**
     * Resets to default state
     */
    reset() {
        this.finished = false;
        if(!this.graph) return;
        for(const key of this.graph.nodes.keys()) {
            this.graph.nodes.get(key).reset();
        }
    }

    /**
     * Resets state and initializes new pathfinding animation
     */
    start(algorithm) {
        this.reset();
        switch(algorithm) {
            case "astar":
                this.algorithm = new AStar();
                break;
            case "greedy":
                this.algorithm = new Greedy();
                break;
            case "dijkstra":
                this.algorithm = new Dijkstra();
                break;
            case "bidirectional":
                this.algorithm = new BidirectionalSearch();
                break;
            default:
                this.algorithm = new AStar();
                break;
        }

        this.algorithm.start(this.startNode, this.endNode);
    }

    /**
     * Progresses the pathfinding algorithm by one step/iteration
     * @returns {(import("./Node").default)[]} array of nodes that were updated
     */
    nextStep() {
        const updatedNodes = this.algorithm.nextStep();
        if(this.algorithm.finished || updatedNodes.length === 0) {
            this.finished = true;
        }

        return updatedNodes;
    }
}