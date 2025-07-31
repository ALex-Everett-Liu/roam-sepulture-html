class StrategyGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.points = [];
        this.currentTime = new Date('1000-01-01');
        this.selectedPoint = null;
        this.tempPosition = null;
        
        // zoom and pan related
        this.scale = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // path drawing related
        this.paths = [];
        this.pathMode = false;
        this.pathStartPoint = null;
        this.tempPathEndPoint = null;
        
        this.gameHistory = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateTimeDisplay();
        this.updateStats();
        this.updateZoomDisplay();
        this.render();
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
        
        document.getElementById('save-game').addEventListener('click', () => this.saveGame());
        document.getElementById('load-game').addEventListener('click', () => this.loadGame());
        document.getElementById('advance-time').addEventListener('click', () => this.showTimeModal());
        
        document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
        document.getElementById('reset-view').addEventListener('click', () => this.resetView());
        
        document.getElementById('create-town').addEventListener('click', () => this.createPoint('town'));
        document.getElementById('create-unit').addEventListener('click', () => this.createPoint('unit'));
        document.getElementById('cancel-create').addEventListener('click', () => this.hideModal('create-modal'));
        
        document.getElementById('edit-form').addEventListener('submit', (e) => this.savePointEdit(e));
        document.getElementById('delete-point').addEventListener('click', () => this.deletePoint());
        document.getElementById('cancel-edit').addEventListener('click', () => this.hideModal('edit-modal'));
        
        // Color picker controls
        document.getElementById('pick-color-btn').addEventListener('click', () => this.startColorPicking());
        document.getElementById('edit-color').addEventListener('input', (e) => this.syncColorFormats(e.target.value));
        document.getElementById('edit-color-hex').addEventListener('input', (e) => this.handleHexInput(e.target.value));
        
        document.getElementById('confirm-time').addEventListener('click', () => this.advanceTime());
        document.getElementById('cancel-time').addEventListener('click', () => this.hideModal('time-modal'));
        
        document.getElementById('file-input').addEventListener('change', (e) => this.handleFileLoad(e));
        
        // path drawing controls
        document.getElementById('start-path-mode').addEventListener('click', () => this.togglePathMode());
        document.getElementById('clear-all-paths').addEventListener('click', () => this.clearAllPaths());
    }

    handleCanvasClick(e) {
        if (this.isDragging) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        
        const worldX = (canvasX - this.offsetX) / this.scale;
        const worldY = (this.canvas.height - canvasY - this.offsetY) / this.scale;
        
        const clickedPoint = this.getPointAt(worldX, worldY);
        
        if (this.pathMode) {
            this.handlePathModeClick(clickedPoint, worldX, worldY);
            return;
        }
        
        if (clickedPoint) {
            this.selectedPoint = clickedPoint;
            this.showEditModal(clickedPoint);
        } else {
            this.tempPosition = { x: Math.round(worldX), y: Math.round(worldY) };
            this.showCreateModal(Math.round(worldX), Math.round(worldY));
        }
    }
    
    handlePathModeClick(clickedPoint, worldX, worldY) {
        if (!clickedPoint) return;
        
        if (!this.pathStartPoint) {
            // First point selection
            this.pathStartPoint = clickedPoint;
            document.getElementById('path-mode-status').innerHTML = 
                `<span style="color: #0066cc;">已选择起点: ${clickedPoint.name} - 现在选择终点</span>`;
        } else {
            // Second point selection
            if (this.pathStartPoint.id === clickedPoint.id) {
                // Same point clicked, reset
                this.pathStartPoint = null;
                document.getElementById('path-mode-status').innerHTML = 
                    `<span style="color: #666;">路径模式已激活 - 选择起点</span>`;
                return;
            }
            
            // Create path between points
            this.createPath(this.pathStartPoint, clickedPoint);
            this.exitPathMode();
        }
    }

    handleWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        
        const worldX = (canvasX - this.offsetX) / this.scale;
        const worldY = (this.canvas.height - canvasY - this.offsetY) / this.scale;
        
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const newScale = Math.max(0.1, Math.min(5, this.scale * zoomFactor));
        
        this.offsetX = canvasX - worldX * newScale;
        this.offsetY = this.canvas.height - canvasY - worldY * newScale;
        this.scale = newScale;
        
        this.updateZoomDisplay();
        this.render();
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.lastMouseX = e.clientX - rect.left;
        this.lastMouseY = e.clientY - rect.top;
        this.isDragging = true;
        this.canvas.style.cursor = 'grabbing';
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        
        const worldX = (canvasX - this.offsetX) / this.scale;
        const worldY = (this.canvas.height - canvasY - this.offsetY) / this.scale;
        
        document.getElementById('mouse-pos').textContent = `mouse position: (${Math.round(worldX)}, ${Math.round(worldY)})`;
        
        if (this.pathMode && this.pathStartPoint) {
            this.tempPathEndPoint = { x: worldX, y: worldY };
            this.render();
        }
        
        if (this.isDragging) {
            const dx = canvasX - this.lastMouseX;
            const dy = canvasY - this.lastMouseY;
            
            this.offsetX += dx;
            this.offsetY -= dy; // Invert dy for bottom-left origin
            
            this.lastMouseX = canvasX;
            this.lastMouseY = canvasY;
            
            this.render();
        }
    }

    handleMouseUp(e) {
        this.isDragging = false;
        this.canvas.style.cursor = this.isDragging ? 'grabbing' : 'crosshair';
    }

    zoomIn() {
        this.scale = Math.min(5, this.scale * 1.2);
        this.updateZoomDisplay();
        this.render();
    }

    zoomOut() {
        this.scale = Math.max(0.1, this.scale / 1.2);
        this.updateZoomDisplay();
        this.render();
    }

    resetView() {
        this.scale = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.updateZoomDisplay();
        this.render();
    }
    
    togglePathMode() {
        this.pathMode = !this.pathMode;
        const statusElement = document.getElementById('path-mode-status');
        const button = document.getElementById('start-path-mode');
        
        if (this.pathMode) {
            this.pathStartPoint = null;
            statusElement.style.display = 'block';
            statusElement.innerHTML = `<span style="color: #666;">路径模式已激活 - 选择起点</span>`;
            button.textContent = '退出路径模式';
            this.canvas.style.cursor = 'crosshair';
        } else {
            this.exitPathMode();
        }
    }
    
    exitPathMode() {
        this.pathMode = false;
        this.pathStartPoint = null;
        document.getElementById('path-mode-status').style.display = 'none';
        document.getElementById('start-path-mode').textContent = '开始绘制路径';
        this.canvas.style.cursor = 'crosshair';
    }
    
    createPath(point1, point2) {
        const distance = this.calculateDistance(point1, point2);
        
        // Check if path already exists
        const existingPath = this.paths.find(path => 
            (path.from.id === point1.id && path.to.id === point2.id) ||
            (path.from.id === point2.id && path.to.id === point1.id)
        );
        
        if (existingPath) {
            // Update existing path
            existingPath.distance = distance;
        } else {
            // Create new path
            const newPath = {
                id: Date.now(),
                from: point1,
                to: point2,
                distance: distance,
                color: '#007bff',
                createdAt: new Date(this.currentTime)
            };
            this.paths.push(newPath);
        }
        
        this.render();
    }
    
    calculateDistance(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    clearAllPaths() {
        this.paths = [];
        this.render();
    }

    updateZoomDisplay() {
        const zoomPercent = Math.round(this.scale * 100);
        document.getElementById('zoom-level').textContent = `${zoomPercent}%`;
    }

    getPointAt(x, y) {
        return this.points.find(point => {
            const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
            return distance <= 15;
        });
    }

    showCreateModal(x, y) {
        document.getElementById('pos-display').textContent = `(${x}, ${y})`;
        document.getElementById('create-modal').style.display = 'block';
    }

    showEditModal(point) {
        document.getElementById('edit-name').value = point.name;
        document.getElementById('edit-type').textContent = point.type === 'town' ? '城镇' : '军事单位';
        document.getElementById('edit-position').textContent = `(${point.x}, ${point.y})`;
        document.getElementById('edit-color').value = point.color;
        document.getElementById('edit-color-hex').value = point.color;
        document.getElementById('edit-population').value = point.population;
        document.getElementById('edit-soldiers').value = point.soldiers;
        document.getElementById('edit-food').value = point.food;
        document.getElementById('edit-money').value = point.money;
        document.getElementById('edit-modal').style.display = 'block';
    }

    showTimeModal() {
        document.getElementById('current-time-display').textContent = this.formatDate(this.currentTime);
        
        const dateInput = document.getElementById('new-date');
        const nextDay = new Date(this.currentTime);
        nextDay.setDate(nextDay.getDate() + 1);
        dateInput.value = nextDay.toISOString().split('T')[0];
        
        document.getElementById('time-modal').style.display = 'block';
    }

    hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
        this.tempPosition = null;
    }

    createPoint(type) {
        if (!this.tempPosition) return;

        const point = {
            id: Date.now(),
            name: type === 'town' ? '新城镇' : '新军事单位',
            type: type,
            x: this.tempPosition.x,
            y: this.tempPosition.y,
            color: '#ff0000',
            population: type === 'town' ? 1000 : 100,
            soldiers: type === 'town' ? 100 : 50,
            food: 5000,
            money: 2000,
            createdAt: new Date(this.currentTime)
        };

        this.points.push(point);
        this.hideModal('create-modal');
        this.updateStats();
        this.render();
    }

    savePointEdit(e) {
        e.preventDefault();
        
        if (!this.selectedPoint) return;

        this.selectedPoint.name = document.getElementById('edit-name').value;
        this.selectedPoint.color = document.getElementById('edit-color').value;
        this.selectedPoint.population = parseInt(document.getElementById('edit-population').value);
        this.selectedPoint.soldiers = parseInt(document.getElementById('edit-soldiers').value);
        this.selectedPoint.food = parseInt(document.getElementById('edit-food').value);
        this.selectedPoint.money = parseInt(document.getElementById('edit-money').value);

        this.hideModal('edit-modal');
        this.render();
    }
    
    startColorPicking() {
        if (this.points.length === 0) {
            alert('没有可用的据点进行取色！');
            return;
        }

        const colors = [...new Set(this.points.map(point => point.color))];
        this.showColorPicker(colors);
    }
    
    showColorPicker(colors) {
        // Create color picker modal
        const modal = document.createElement('div');
        modal.id = 'color-picker-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <h3>选择颜色</h3>
                <div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 5px; margin: 15px 0;">
                    ${colors.map(color => `
                        <div class="color-swatch" 
                             style="width: 30px; height: 30px; background-color: ${color}; 
                                    border-radius: 4px; cursor: pointer; border: 1px solid #ccc;"
                             data-color="${color}"
                             title="${color}">
                        </div>
                    `).join('')}
                </div>
                <div style="text-align: center;">
                    <button type="button" id="close-color-picker">关闭</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        // Add event listeners
        modal.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                const selectedColor = e.target.dataset.color;
                this.setSelectedColor(selectedColor);
                document.body.removeChild(modal);
            });
        });
        
        modal.querySelector('#close-color-picker').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }
    
    setSelectedColor(color) {
        document.getElementById('edit-color').value = color;
        document.getElementById('edit-color-hex').value = color;
    }
    
    syncColorFormats(color) {
        document.getElementById('edit-color-hex').value = color;
    }
    
    handleHexInput(hexValue) {
        // Validate and sync hex input
        let cleanHex = hexValue.trim();
        
        // Add # if missing
        if (!cleanHex.startsWith('#')) {
            cleanHex = '#' + cleanHex;
        }
        
        // Validate hex format
        const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (hexRegex.test(cleanHex)) {
            // Convert 3-digit hex to 6-digit
            if (cleanHex.length === 4) {
                cleanHex = '#' + cleanHex[1] + cleanHex[1] + cleanHex[2] + cleanHex[2] + cleanHex[3] + cleanHex[3];
            }
            document.getElementById('edit-color').value = cleanHex;
            document.getElementById('edit-color-hex').value = cleanHex;
        }
    }

    deletePoint() {
        if (!this.selectedPoint) return;

        this.points = this.points.filter(p => p.id !== this.selectedPoint.id);
        this.hideModal('edit-modal');
        this.selectedPoint = null;
        this.updateStats();
        this.render();
    }

    advanceTime() {
        const newDate = new Date(document.getElementById('new-date').value);
        
        if (newDate <= this.currentTime) {
            alert('The new time must be later than the current time!');
            return;
        }

        const currentState = {
            date: new Date(this.currentTime),
            points: JSON.parse(JSON.stringify(this.points))
        };
        
        this.gameHistory.push(currentState);
        this.currentTime = newDate;
        
        this.hideModal('time-modal');
        this.updateTimeDisplay();
        this.saveToHistory();
    }

    updateTimeDisplay() {
        document.getElementById('current-time').textContent = this.formatDate(this.currentTime);
    }

    updateStats() {
        const towns = this.points.filter(p => p.type === 'town').length;
        const units = this.points.filter(p => p.type === 'unit').length;
        
        document.getElementById('total-points').textContent = this.points.length;
        document.getElementById('town-count').textContent = towns;
        document.getElementById('unit-count').textContent = units;
    }

    formatDate(date) {
        return date.toISOString().split('T')[0] + ' AD';
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Transform to bottom-left origin coordinate system
        this.ctx.translate(this.offsetX, this.canvas.height - this.offsetY);
        this.ctx.scale(this.scale, -this.scale); // Flip Y-axis
        
        this.drawGrid();
        
        this.paths.forEach(path => this.drawPath(path));
        this.points.forEach(point => this.drawPoint(point));
        
        // Draw temporary path during path mode
        if (this.pathMode && this.pathStartPoint && this.tempPathEndPoint) {
            this.drawTempPath();
        }
        
        this.ctx.restore();
    }

    drawGrid() {
        const gridSize = 50;
        
        // Calculate visible world coordinates for bottom-left origin
        const minX = -this.offsetX / this.scale;
        const maxX = (this.canvas.width - this.offsetX) / this.scale;
        const minY = (-this.canvas.height + this.offsetY) / this.scale;
        const maxY = this.offsetY / this.scale;
        
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1 / this.scale;
        
        const startX = Math.floor(minX / gridSize) * gridSize;
        const endX = Math.ceil(maxX / gridSize) * gridSize;
        const startY = Math.floor(minY / gridSize) * gridSize;
        const endY = Math.ceil(maxY / gridSize) * gridSize;
        
        for (let x = startX; x <= endX; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, minY);
            this.ctx.lineTo(x, maxY);
            this.ctx.stroke();
        }
        
        for (let y = startY; y <= endY; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(minX, y);
            this.ctx.lineTo(maxX, y);
            this.ctx.stroke();
        }
        
        // Draw axes
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2 / this.scale;
        
        // X-axis
        if (minY <= 0 && maxY >= 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(minX, 0);
            this.ctx.lineTo(maxX, 0);
            this.ctx.stroke();
        }
        
        // Y-axis
        if (minX <= 0 && maxX >= 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, minY);
            this.ctx.lineTo(0, maxY);
            this.ctx.stroke();
        }
    }

    drawPoint(point) {
        this.ctx.save();
        
        this.ctx.fillStyle = point.color;
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2 / this.scale;
        
        const radius = 12 / this.scale;
        
        this.ctx.beginPath();
        if (point.type === 'town') {
            this.ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
        } else {
            this.ctx.moveTo(point.x, point.y - radius);
            this.ctx.lineTo(point.x + radius, point.y + radius);
            this.ctx.lineTo(point.x - radius, point.y + radius);
            this.ctx.closePath();
        }
        this.ctx.fill();
        this.ctx.stroke();
        
        // Flip text back to normal orientation
        this.ctx.scale(1, -1);
        this.ctx.fillStyle = '#333';
        this.ctx.font = `${12 / this.scale}px Microsoft YaHei`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(point.name, point.x, -(point.y + radius + 8 / this.scale));
        
        this.ctx.restore();
    }
    
    drawPath(path) {
        this.ctx.save();
        
        this.ctx.strokeStyle = path.color;
        this.ctx.lineWidth = 3 / this.scale;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Draw the path line
        this.ctx.beginPath();
        this.ctx.moveTo(path.from.x, path.from.y);
        this.ctx.lineTo(path.to.x, path.to.y);
        this.ctx.stroke();
        
        // Draw distance label at midpoint
        const midX = (path.from.x + path.to.x) / 2;
        const midY = (path.from.y + path.to.y) / 2;
        const distanceText = Math.round(path.distance) + ' units';
        
        // Draw background for text
        this.ctx.font = `${14 / this.scale}px Arial`;
        const textWidth = this.ctx.measureText(distanceText).width;
        const padding = 4 / this.scale;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(
            midX - textWidth/2 - padding,
            midY - (10 / this.scale) - padding,
            textWidth + 2 * padding,
            20 / this.scale + 2 * padding
        );
        
        // Draw distance text
        this.ctx.fillStyle = '#333';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Flip text back to normal orientation
        this.ctx.scale(1, -1);
        this.ctx.fillText(distanceText, midX, -midY);
        
        this.ctx.restore();
    }
    
    drawTempPath() {
        if (!this.pathStartPoint || !this.tempPathEndPoint) return;
        
        this.ctx.save();
        
        this.ctx.strokeStyle = '#007bff';
        this.ctx.lineWidth = 3 / this.scale;
        this.ctx.setLineDash([5 / this.scale, 5 / this.scale]);
        this.ctx.lineCap = 'round';
        
        // Draw temporary path line
        this.ctx.beginPath();
        this.ctx.moveTo(this.pathStartPoint.x, this.pathStartPoint.y);
        this.ctx.lineTo(this.tempPathEndPoint.x, this.tempPathEndPoint.y);
        this.ctx.stroke();
        
        // Draw distance label
        const midX = (this.pathStartPoint.x + this.tempPathEndPoint.x) / 2;
        const midY = (this.pathStartPoint.y + this.tempPathEndPoint.y) / 2;
        const distance = this.calculateDistance(this.pathStartPoint, this.tempPathEndPoint);
        const distanceText = Math.round(distance) + ' units';
        
        this.ctx.setLineDash([]);
        this.ctx.font = `${14 / this.scale}px Arial`;
        const textWidth = this.ctx.measureText(distanceText).width;
        const padding = 4 / this.scale;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(
            midX - textWidth/2 - padding,
            midY - (10 / this.scale) - padding,
            textWidth + 2 * padding,
            20 / this.scale + 2 * padding
        );
        
        this.ctx.fillStyle = '#007bff';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Flip text back to normal orientation
        this.ctx.scale(1, -1);
        this.ctx.fillText(distanceText, midX, -midY);
        
        this.ctx.restore();
    }

    saveGame() {
        const gameData = {
            currentTime: this.currentTime,
            points: this.points,
            paths: this.paths,
            history: this.gameHistory
        };
        
        const blob = new Blob([JSON.stringify(gameData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `strategy_game_${this.formatDate(this.currentTime).replace(/\s/g, '_')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    loadGame() {
        document.getElementById('file-input').click();
    }

    handleFileLoad(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const gameData = JSON.parse(event.target.result);
                this.currentTime = new Date(gameData.currentTime);
                this.points = gameData.points || [];
                this.paths = gameData.paths || [];
                this.gameHistory = gameData.history || [];
                
                this.updateTimeDisplay();
                this.updateStats();
                this.render();
            } catch (error) {
                alert('File format error!');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    saveToHistory() {
        const historyData = {
            currentTime: this.currentTime,
            points: this.points,
            paths: this.paths,
            history: this.gameHistory
        };
        
        localStorage.setItem('strategyGame', JSON.stringify(historyData));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('strategyGame');
        if (saved) {
            try {
                const gameData = JSON.parse(saved);
                this.currentTime = new Date(gameData.currentTime);
                this.points = gameData.points || [];
                this.paths = gameData.paths || [];
                this.gameHistory = gameData.history || [];
                
                this.updateTimeDisplay();
                this.updateStats();
                this.render();
            } catch (error) {
                console.error('Failed to load save file:', error);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new StrategyGame();
    game.loadFromStorage();
});