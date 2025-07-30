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
        
        document.getElementById('confirm-time').addEventListener('click', () => this.advanceTime());
        document.getElementById('cancel-time').addEventListener('click', () => this.hideModal('time-modal'));
        
        document.getElementById('file-input').addEventListener('change', (e) => this.handleFileLoad(e));
    }

    handleCanvasClick(e) {
        if (this.isDragging) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        
        const worldX = (canvasX - this.offsetX) / this.scale;
        const worldY = (this.canvas.height - canvasY - this.offsetY) / this.scale;
        
        const clickedPoint = this.getPointAt(worldX, worldY);
        
        if (clickedPoint) {
            this.selectedPoint = clickedPoint;
            this.showEditModal(clickedPoint);
        } else {
            this.tempPosition = { x: Math.round(worldX), y: Math.round(worldY) };
            this.showCreateModal(Math.round(worldX), Math.round(worldY));
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
        
        this.points.forEach(point => this.drawPoint(point));
        
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

    saveGame() {
        const gameData = {
            currentTime: this.currentTime,
            points: this.points,
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