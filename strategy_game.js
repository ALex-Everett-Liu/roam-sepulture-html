class StrategyGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.points = [];
        this.currentTime = new Date('1000-01-01');
        this.selectedPoint = null;
        this.tempPosition = null;
        
        this.gameHistory = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateTimeDisplay();
        this.updateStats();
        this.render();
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        
        document.getElementById('save-game').addEventListener('click', () => this.saveGame());
        document.getElementById('load-game').addEventListener('click', () => this.loadGame());
        document.getElementById('advance-time').addEventListener('click', () => this.showTimeModal());
        
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
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const clickedPoint = this.getPointAt(x, y);
        
        if (clickedPoint) {
            this.selectedPoint = clickedPoint;
            this.showEditModal(clickedPoint);
        } else {
            this.tempPosition = { x, y };
            this.showCreateModal(x, y);
        }
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
            alert('新时间必须晚于当前时间！');
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
        
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawGrid();
        
        this.points.forEach(point => this.drawPoint(point));
    }

    drawGrid() {
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.canvas.width; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.canvas.height; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawPoint(point) {
        this.ctx.save();
        
        this.ctx.fillStyle = point.color;
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        if (point.type === 'town') {
            this.ctx.arc(point.x, point.y, 12, 0, 2 * Math.PI);
        } else {
            this.ctx.moveTo(point.x, point.y - 12);
            this.ctx.lineTo(point.x + 12, point.y + 12);
            this.ctx.lineTo(point.x - 12, point.y + 12);
            this.ctx.closePath();
        }
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#333';
        this.ctx.font = '12px Microsoft YaHei';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(point.name, point.x, point.y - 20);
        
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
                alert('文件格式错误！');
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
                console.error('加载存档失败:', error);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new StrategyGame();
    game.loadFromStorage();
});