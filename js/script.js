// Get the grid container element from the HTML
const gridContainer = document.getElementById('grid-container');

// Define the size of our grid
const GRID_WIDTH = 50; // 50 nodes wide
const GRID_HEIGHT = 20; // 20 nodes tall

// Function to create the grid
function createGrid() {
    for (let i = 0; i < GRID_HEIGHT; i++) {
        for (let j = 0; j < GRID_WIDTH; j++) {
            const node = document.createElement('div');
            node.className = 'node';
            node.id = `node-${i}-${j}`;
            gridContainer.appendChild(node);
        }
    }
}

// Set the grid container's style to have the correct number of columns
gridContainer.style.gridTemplateColumns = `repeat(${GRID_WIDTH}, 1fr)`;

// Call the function to create the grid when the script loads
createGrid();

// This variable must be defined AFTER createGrid() is called
const nodes = document.querySelectorAll('.node');

// --- INTERACTIVITY ---

// Get references to the buttons
const setStartBtn = document.getElementById('set-start-btn');
const setEndBtn = document.getElementById('set-end-btn');
const drawWallBtn = document.getElementById('draw-wall-btn');
const visualizeBtn1 = document.getElementById('visualize-dijkstra-btn');
const visualizeBtn2 = document.getElementById('visualize-astar-btn');
const clearBoardBtn = document.getElementById('clear-board-btn');

// Keep track of the current interaction mode
let currentMode = 'wall'; // 'start', 'end', or 'wall'
let startNode = null;
let endNode = null;
let isMouseDown = false;

// --- Event Listeners ---
setStartBtn.addEventListener('click', () => setMode('start'));
setEndBtn.addEventListener('click', () => setMode('end'));
drawWallBtn.addEventListener('click', () => setMode('wall'));
clearBoardBtn.addEventListener('click', clearBoard);

gridContainer.addEventListener('mousedown', e => {
    if (e.target.classList.contains('node')) {
        isMouseDown = true;
        handleNodeClick(e.target);
    }
});

gridContainer.addEventListener('mouseover', e => {
    if (isMouseDown && e.target.classList.contains('node')) {
        handleNodeHover(e.target);
    }
});

window.addEventListener('mouseup', () => {
    isMouseDown = false;
});

// --- Interactivity Functions ---
function setMode(mode) {
    currentMode = mode;
    setStartBtn.classList.toggle('active', mode === 'start');
    setEndBtn.classList.toggle('active', mode === 'end');
    drawWallBtn.classList.toggle('active', mode === 'wall');
}

function clearBoard() {
    nodes.forEach(node => {
        node.classList.remove('start', 'end', 'wall', 'visited', 'path');
    });
    startNode = null;
    endNode = null;
}

function handleNodeClick(node) {
    switch (currentMode) {
        case 'start':
            if (startNode) startNode.classList.remove('start');
            node.classList.remove('wall');
            node.classList.add('start');
            startNode = node;
            break;
        case 'end':
            if (endNode) endNode.classList.remove('end');
            node.classList.remove('wall');
            node.classList.add('end');
            endNode = node;
            break;
        case 'wall':
            if (!node.classList.contains('start') && !node.classList.contains('end')) {
                node.classList.toggle('wall');
            }
            break;
    }
}

function handleNodeHover(node) {
    if (currentMode === 'wall') {
        if (!node.classList.contains('start') && !node.classList.contains('end')) {
            node.classList.add('wall');
        }
    }
}

// --- ALGORITHM IMPLEMENTATION ---

// This is the main function that starts the visualization
visualizeBtn1.addEventListener('click', () => {
    if (!startNode || !endNode) {
        alert("Please set a start and end node!");
        return;
    }
    const nodesMap = createNodeMap();
    const startNodeObj = nodesMap[startNode.id];
    const endNodeObj = nodesMap[endNode.id];
    
    // Check if for some reason the nodes weren't found in the map
    if (!startNodeObj || !endNodeObj) {
        console.error("Start or End node object not found in nodesMap!");
        return;
    }

    const visitedNodesInOrder = dijkstra(nodesMap, startNodeObj, endNodeObj);
    // We pass the end node's data DIRECTLY to the animation function to prevent errors
    animateAlgorithm(visitedNodesInOrder, nodesMap, endNodeObj);
});

visualizeBtn2.addEventListener('click', () => {
    if (!startNode || !endNode) {
        alert("Please set a start and end node!");
        return;
    }
    const nodesMap = createNodeMap();
    const startNodeObj = nodesMap[startNode.id];
    const endNodeObj = nodesMap[endNode.id];
    
    // Check if for some reason the nodes weren't found in the map
    if (!startNodeObj || !endNodeObj) {
        console.error("Start or End node object not found in nodesMap!");
        return;
    }

    const visitedNodesInOrder = aStar(nodesMap, startNodeObj, endNodeObj);
    // We pass the end node's data DIRECTLY to the animation function to prevent errors
    animateAlgorithm(visitedNodesInOrder, nodesMap, endNodeObj);
});

function createNodeMap() {
    const map = {};
    for (let row = 0; row < GRID_HEIGHT; row++) {
        for (let col = 0; col < GRID_WIDTH; col++) {
            const id = `node-${row}-${col}`;
            const domNode = document.getElementById(id);
            map[id] = {
                id,
                row,
                col,
                distance: Infinity,
                isWall: domNode.classList.contains('wall'),
                previousNode: null,
            };
        }
    }
    return map;
}

function dijkstra(nodesMap, startNode, endNode) {
    const visitedNodesInOrder = [];
    startNode.distance = 0;
    const unvisitedNodes = Object.values(nodesMap);

    while (unvisitedNodes.length) {
        unvisitedNodes.sort((a, b) => a.distance - b.distance);
        const closestNode = unvisitedNodes.shift();
        if (closestNode.isWall) continue;
        if (closestNode.distance === Infinity) return visitedNodesInOrder;
        
        visitedNodesInOrder.push(closestNode);
        if (closestNode.id === endNode.id) return visitedNodesInOrder;
        
        updateUnvisitedNeighbors(closestNode, nodesMap);
    }
    return visitedNodesInOrder;
}

function updateUnvisitedNeighbors(node, nodesMap) {
    const neighbors = getNeighbors(node, nodesMap);
    for (const neighbor of neighbors) {
        if (node.distance + 1 < neighbor.distance) {
            neighbor.distance = node.distance + 1;
            neighbor.previousNode = node.id;
        }
    }
}

function getNeighbors(node, nodesMap) {
    const neighbors = [];
    const { col, row } = node;
    if (row > 0) neighbors.push(nodesMap[`node-${row - 1}-${col}`]);
    if (row < GRID_HEIGHT - 1) neighbors.push(nodesMap[`node-${row + 1}-${col}`]);
    if (col > 0) neighbors.push(nodesMap[`node-${row}-${col - 1}`]);
    if (col < GRID_WIDTH - 1) neighbors.push(nodesMap[`node-${row}-${col + 1}`]);
    return neighbors.filter(neighbor => neighbor && !neighbor.isWall);
}

// This function handles the blue "visited" animation
function animateAlgorithm(visitedNodesInOrder, nodesMap, endNodeObj) {
    for (let i = 0; i <= visitedNodesInOrder.length; i++) {
        if (i === visitedNodesInOrder.length) {
            setTimeout(() => {
                // After the blue animation, it calls the yellow path animation
                // It passes the end node data DIRECTLY to prevent it from being undefined
                animateShortestPath(nodesMap, endNodeObj);
            }, 10 * i);
            return;
        }
        setTimeout(() => {
            const node = visitedNodesInOrder[i];
            const domNode = document.getElementById(node.id);
            if (!domNode.classList.contains('start') && !domNode.classList.contains('end')) {
                 domNode.classList.add('visited');
            }
        }, 10 * i);
    }
}

// This function handles the final yellow "path" animation
function animateShortestPath(nodesMap, endNodeObject) {
    const path = [];
    let currentNode = endNodeObject;

    // If no path exists
    if (!currentNode || currentNode.previousNode === null) {
        console.log("No path found to animate!");
        return;
    }

    // Backtrack until there is no previousNode
    while (currentNode) {
        path.unshift(currentNode);
        if (!currentNode.previousNode) break; // Stop before we hit null
        currentNode = nodesMap[currentNode.previousNode];
    }

    // Animate each node in the reconstructed path
    for (let i = 0; i < path.length; i++) {
        setTimeout(() => {
            const node = path[i];
            const domNode = document.getElementById(node.id);
            if (!domNode.classList.contains('start') && !domNode.classList.contains('end')) {
                domNode.classList.add('path');
            }
        }, 50 * i);
    }
}
function manhattanDistance(nodeA, nodeB) {
  const dx = Math.abs(nodeA.col - nodeB.col);
  const dy = Math.abs(nodeA.row - nodeB.row);
  return dx + dy;
}

function aStar(nodesMap, startNode, endNode) {
    const visitedNodesInOrder = [];
    startNode.distance = 0;
    const unvisitedNodes = Object.values(nodesMap);

    while (unvisitedNodes.length) {
        // Inside your new aStar function
    unvisitedNodes.sort((a, b) => {
        const fCostA = a.distance + manhattanDistance(a, endNode);
        const fCostB = b.distance + manhattanDistance(b, endNode);
        return fCostA - fCostB;
        });
        const closestNode = unvisitedNodes.shift();
        if (closestNode.isWall) continue;
        if (closestNode.distance === Infinity) return visitedNodesInOrder;
        
        visitedNodesInOrder.push(closestNode);
        if (closestNode.id === endNode.id) return visitedNodesInOrder;
        
        updateUnvisitedNeighbors(closestNode, nodesMap);
    }
    return visitedNodesInOrder;
}
