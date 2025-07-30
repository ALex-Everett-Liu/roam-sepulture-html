# Strategy Game Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Function Inventories](#function-inventories)
4. [Tricky Solutions & Design Rationale](#tricky-solutions--design-rationale)
5. [Key Use Cases & Workflows](#key-use-cases--workflows)
6. [Code Conventions](#code-conventions)
7. [Naming Conventions](#naming-conventions)
8. [Module Details](#module-details)

---

## Overview

This is a browser-based strategy game built with HTML5 Canvas and vanilla JavaScript. The game allows users to create and manage strategic bases (towns and military units) on a scalable map, with time progression and historical state management.

**Core Design Philosophy**: Client-side game engine with responsive design, unlimited canvas space, and comprehensive data persistence.

---

## System Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     Browser Runtime                        │
├────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │   StrategyGame      │  │   HTML Interface    │          │
│  │                     │  │                     │          │
│  │ • Canvas Rendering  │  │ • Modals            │          │
│  │ • Zoom & Pan        │  │ • Controls          │          │
│  │ • Point Management  │  │ • Statistics        │          │
│  │ • Time System       │  │ • File Operations   │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                              │                             │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │   JSON Storage      │  │   Event System      │          │
│  │                     │  │                     │          │
│  │ • Save/Load         │  │ • Mouse Events      │          │
│  │ • History Tracking  │  │ • Keyboard Events   │          │
│  │ • Local Storage     │  │ • Modal Events      │          │
│  └─────────────────────┘  └─────────────────────┘          │
└────────────────────────────────────────────────────────────┘
```

---

## Function Inventories

### StrategyGame Class - Core Game Engine
| Function | Purpose | Parameters | Returns |
|----------|---------|------------|---------|
| `constructor()` | Initialize game state and canvas | None | void |
| `init()` | Setup initial game state | None | void |
| `setupEventListeners()` | Bind all UI events | None | void |
| `handleCanvasClick(e)` | Process canvas clicks | MouseEvent | void |
| `getPointAt(x, y)` | Find point at coordinates | number, number | Point object |
| `render()` | Main render loop | None | void |
| `drawGrid()` | Render coordinate grid | None | void |
| `drawPoint(point)` | Render individual point | Point object | void |

### Zoom & Pan System
| Function | Purpose | Parameters | Returns |
|----------|---------|------------|---------|
| `handleWheel(e)` | Zoom in/out with mouse wheel | WheelEvent | void |
| `handleMouseDown(e)` | Start drag operation | MouseEvent | void |
| `handleMouseMove(e)` | Handle mouse movement | MouseEvent | void |
| `handleMouseUp(e)` | End drag operation | MouseEvent | void |
| `zoomIn()` | Zoom in via button | None | void |
| `zoomOut()` | Zoom out via button | None | void |
| `resetView()` | Reset zoom and pan | None | void |
| `updateZoomDisplay()` | Update zoom percentage | None | void |

### Point Management
| Function | Purpose | Parameters | Returns |
|----------|---------|------------|---------|
| `createPoint(type)` | Create new strategic point | string type | void |
| `savePointEdit(e)` | Save edited point properties | Event | void |
| `deletePoint()` | Remove selected point | None | void |
| `showCreateModal(x, y)` | Display creation dialog | number, number | void |
| `showEditModal(point)` | Display edit dialog | Point object | void |

### Time System
| Function | Purpose | Parameters | Returns |
|----------|---------|------------|---------|
| `advanceTime()` | Progress game timeline | None | void |
| `updateTimeDisplay()` | Update time display | None | void |
| `formatDate(date)` | Format date for display | Date | string |

### Data Persistence
| Function | Purpose | Parameters | Returns |
|----------|---------|------------|---------|
| `saveGame()` | Export game to JSON file | None | void |
| `loadGame()` | Import game from JSON file | None | void |
| `handleFileLoad(e)` | Process file upload | Event | void |
| `saveToHistory()` | Save to localStorage | None | void |
| `loadFromStorage()` | Load from localStorage | None | void |

---

## Tricky Solutions & Design Rationale

### 1. Infinite Canvas Space
**Problem**: Fixed 800x600 canvas limits strategic placement
**Solution**: Implement world coordinate system with zoom/pan
```javascript
// Coordinate transformation
const worldX = (canvasX - offsetX) / scale;
const worldY = (canvasY - offsetY) / scale;
```
**Rationale**: Enables unlimited strategic space while maintaining performance

### 2. Dynamic Grid Rendering
**Problem**: Static grid becomes dense at high zoom levels
**Solution**: Calculate visible grid based on view bounds
```javascript
const minX = -offsetX / scale;
const maxX = (canvas.width - offsetX) / scale;
// Render only visible grid lines
```
**Rationale**: Maintains visual clarity regardless of zoom level

### 3. Point Hit Detection
**Problem**: Accurate clicking on scaled points
**Solution**: Convert coordinates to world space before distance calculation
```javascript
const distance = Math.sqrt((point.x - worldX) ** 2 + (point.y - worldY) ** 2);
```
**Rationale**: Ensures consistent interaction regardless of scale

### 4. Responsive Design
**Problem**: Desktop and mobile usability
**Solution**: CSS Grid with media queries and touch event support
```css
@media (max-width: 768px) {
    .main-content {
        grid-template-columns: 1fr;
        grid-template-rows: 1fr auto;
    }
}
```
**Rationale**: Single codebase works across all devices

### 5. Data Serialization
**Problem**: Complex game state persistence
**Solution**: JSON with Date serialization and error handling
```javascript
JSON.stringify({
    currentTime: this.currentTime.toISOString(),
    points: this.points,
    history: this.gameHistory
})
```
**Rationale**: Human-readable format with full state preservation

---

## Key Use Cases & Workflows

### 1. Creating a New Base
```
User clicks on canvas
    ↓
handleCanvasClick() calculates world coordinates
    ↓
showCreateModal() displays creation dialog
    ↓
User selects town or military unit
    ↓
createPoint() adds to points array
    ↓
render() updates visual display
    ↓
updateStats() refreshes counters
```

### 2. Time Progression Workflow
```
User clicks "Advance Time"
    ↓
showTimeModal() displays date picker
    ↓
User selects new date
    ↓
advanceTime() validates and progresses
    ↓
Current state saved to gameHistory
    ↓
updateTimeDisplay() shows new date
    ↓
saveToHistory() persists to localStorage
```

### 3. Zoom and Pan Navigation
```
User scrolls mouse wheel
    ↓
handleWheel() calculates zoom factor
    ↓
Adjusts scale and offset for zoom center
    ↓
User drags mouse
    ↓
handleMouseDown/Up/Move() tracks movement
    ↓
Updates offset for panning
    ↓
render() redraws with new view
```

### 4. Save/Restore Game
```
User clicks "Save Game"
    ↓
saveGame() creates JSON blob
    ↓
Triggers browser download
    ↓
User loads saved file
    ↓
handleFileLoad() parses JSON
    ↓
Validates and restores game state
    ↓
render() displays loaded game
```

---

## Code Conventions

### JavaScript Style
- **ES6+ features**: Classes, const/let, arrow functions, template literals
- **Async/Await**: Used for file operations
- **Error handling**: Try/catch for file operations and JSON parsing
- **Naming**: camelCase for variables, PascalCase for class names
- **Comments**: JSDoc-style for complex algorithms

### Canvas Rendering
- **Coordinate system**: World coordinates for unlimited space
- **Scaling**: Dynamic scaling based on zoom level
- **Performance**: Only render visible grid lines
- **Visual consistency**: Point sizes scale inversely with zoom

### Data Structures
```javascript
// Point object structure
{
    id: number,           // Unique identifier (timestamp)
    name: string,         // Display name
    type: 'town'|'unit',  // Point classification
    x: number,            // World X coordinate
    y: number,            // World Y coordinate
    color: string,        // Hex color for faction
    population: number,   // Total population
    soldiers: number,     // Military units
    food: number,         // Resource: food
    money: number,        // Resource: money
    createdAt: Date       // Creation timestamp
}

// Game state structure
{
    currentTime: Date,    // Game timeline
    points: Point[],      // All strategic points
    history: History[]    // Previous game states
}
```

### File Organization
```
strategy-game/
├── strategy_game.html        # Main game interface
├── strategy_game.js         # Core game engine
├── strategy_styles.css      # Styling and responsive design
├── architecture_game.md     # This documentation
└── saved-games/            # User save files (generated)
```

---

## Naming Conventions

### Variables and Functions
- **Game state**: `currentTime`, `points`, `gameHistory`
- **Canvas properties**: `canvas`, `ctx`, `scale`, `offsetX`, `offsetY`
- **Event handlers**: `handleCanvasClick`, `handleWheel`, `handleMouseDown`
- **UI elements**: `$game-canvas`, `$zoom-level`, `$mouse-pos`
- **Point types**: `'town'`, `'unit'` (lowercase strings)

### CSS Classes
- **Layout**: `.game-container`, `.main-content`, `.canvas-container`
- **Controls**: `.zoom-controls`, `.canvas-controls`, `.control-panel`
- **Interactive**: `.btn-town`, `.btn-unit`, `.btn-cancel`
- **State**: `.modal`, `.modal-content`, `.form-actions`

### Constants
- **Canvas size**: 800x600 pixels (fixed)
- **Zoom range**: 0.1x to 5x (10% to 500%)
- **Grid size**: 50 pixels (world coordinates)
- **Point radius**: 12 pixels (world coordinates)

---

## Module Details

### strategy_game.js - Core Engine

#### Constructor & Initialization
```javascript
// Initialize game state with zoom/pan support
constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.scale = 1.0;  // Zoom level
    this.offsetX = 0;   // Pan offset
    this.offsetY = 0;
}
```

#### Coordinate System
- **Canvas coordinates**: 0-800 x 0-600 (fixed)
- **World coordinates**: Unlimited (-∞ to +∞)
- **Transformation**: `world = (canvas - offset) / scale`

#### Rendering Pipeline
1. **Clear canvas**: `ctx.clearRect()`
2. **Apply transforms**: `ctx.translate()` + `ctx.scale()`
3. **Draw grid**: Dynamic based on visible area
4. **Draw points**: Scale-invariant sizing
5. **Restore context**: `ctx.restore()`

### strategy_game.html - Interface Structure

#### Layout Architecture
```html
<header>          <!-- Game title and time display -->
<main-content>    <!-- Grid layout: canvas + controls -->
    <canvas-container>  <!-- Interactive game area -->
    <control-panel>     <!-- Game controls and stats -->
<modals>          <!-- Create/edit/time dialogs -->
```

#### Responsive Design
- **Desktop**: 2-column grid (canvas + controls)
- **Mobile**: 1-column stack with reordering
- **Touch support**: Drag to pan, pinch to zoom

### strategy_styles.css - Visual System

#### Color Scheme
- **Primary**: #1e3c72 → #2a5298 (blue gradient)
- **Secondary**: #4CAF50 (save), #F44336 (delete)
- **Neutral**: #9E9E9E (cancel), #f8f9fa (background)

#### Typography
- **Font**: Microsoft YaHei for Chinese support
- **Sizes**: 28px (title), 18px (time), 14px (controls)
- **Weights**: Bold for titles, normal for content

#### Interactive Elements
- **Buttons**: Hover effects with transform
- **Modals**: Backdrop blur and shadow effects
- **Canvas**: Cursor changes (crosshair → grabbing)

---

## Performance Considerations

### Rendering Optimization
- **Grid culling**: Only render visible grid lines
- **Point scaling**: Maintain visual size across zoom levels
- **Efficient redraw**: Clear and redraw entire canvas
- **Memory usage**: Points stored as simple objects

### Data Management
- **Index size**: O(n) memory for n points
- **Serialization**: JSON with ISO date strings
- **File size**: Compressed JSON for save files
- **Local storage**: Automatic save every 2 seconds (debounced)

### Browser Compatibility
- **Canvas API**: Full modern browser support
- **File API**: Drag-and-drop and file input
- **Local storage**: Persistent game state
- **Responsive**: Mobile and desktop optimized

---

## Security & Data Integrity

### Input Validation
- **Coordinate bounds**: No limits (world coordinates)
- **Resource validation**: Positive integers only
- **File validation**: JSON schema checking
- **XSS prevention**: Escaped user input

### Data Persistence
- **Local storage**: Automatic backup every change
- **File export**: User-controlled save files
- **Import validation**: Schema and data type checking
- **Error recovery**: Graceful handling of corrupted saves

---

## Testing Checklist

### Core Functionality
- [ ] Point creation and editing
- [ ] Zoom and pan navigation
- [ ] Time progression
- [ ] Save/load operations
- [ ] Responsive design

### Edge Cases
- [ ] Large coordinate values (>10000)
- [ ] Many points (1000+)
- [ ] File corruption handling
- [ ] Browser back/forward navigation
- [ ] Mobile touch interactions

### Performance
- [ ] Smooth zoom/pan at 60fps
- [ ] Quick save/load operations
- [ ] Memory usage under 50MB
- [ ] File size under 1MB for typical games