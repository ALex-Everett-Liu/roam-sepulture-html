# Personal Wiki Architecture Documentation

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

This personal wiki system is a static HTML-based knowledge base with client-side full-text search capabilities. It operates entirely in the browser using `file://` URLs (no server required), making it perfect for local use before optional Vercel deployment.

**Core Design Philosophy**: Zero-dependency runtime, maximum functionality with minimal complexity.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser Runtime                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │   search.js │  │   HTML Pages │  │   search-index.json│  │
│  │             │  │              │  │                    │  │
│  │ • Search    │  │ • Content    │  │ • Pre-built index  │  │
│  │ • Indexing  │  │ • Navigation │  │ • Metadata         │  │
│  │ • UI        │  │ • Styling    │  │ • Content snippets │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                  Build Time (Node.js)                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────┐  ┌────────────────────┐    │
│  │ generate-search-index.js    │  │   Dependencies     │    │
│  │                             │  │                    │    │
│  │ • Crawl HTML files          │  │ • JSDOM (dev)      │    │
│  │ • Extract content           │  │ • Node.js fs       │    │
│  │ • Build search index        │  │                    │    │
│  └─────────────────────────────┘  └────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Function Inventories

### search.js - Client-Side Search Engine
| Function | Purpose | Parameters | Returns |
|----------|---------|------------|---------|
| `loadSearchIndex()` | Async loads search-index.json | None | Promise<SearchIndex[]> |
| `performSearch(query)` | Main search algorithm | string query | SearchResult[] |
| `highlightMatches(text, query)` | Creates highlighted snippets | string text, string query | string |
| `renderResults(results)` | Renders search UI | SearchResult[] | void |
| `debounce(func, delay)` | Rate-limits search input | function, number | function |
| `escapeHtml(text)` | XSS prevention | string | string |
| `handleSearchInput()` | Event handler for search box | Event | void |

### generate-search-index.js - Build Tool
| Function | Purpose | Parameters | Returns |
|----------|---------|------------|---------|
| `crawlDirectory(dir)` | Recursively finds HTML files | string path | string[] |
| `extractContent(filePath)` | Parses HTML for searchable content | string path | PageData |
| `buildIndex(pages)` | Creates search index | PageData[] | SearchIndex[] |
| `writeIndexFile(index)` | Saves to search-index.json | SearchIndex[] | void |
| `getLastModified(filePath)` | Gets file modification time | string path | Date |

---

## Tricky Solutions & Design Rationale

### 1. Search Algorithm Complexity
**Problem**: Client-side search needs to be fast with large content
**Solution**: Two-tier approach
- **Pre-indexing**: All heavy processing done at build time
- **Runtime**: Simple string matching with scoring
- **Rationale**: Trade disk space (~KB) for CPU time at runtime

### 2. File:// URL Compatibility
**Problem**: CORS restrictions on file:// URLs
**Solution**: All resources are relative paths
```javascript
// Instead of absolute URLs
fetch('/search-index.json') // ❌ CORS error
fetch('./search-index.json') // ✅ Works with file://
```

### 3. Search Result Scoring
**Problem**: How to rank results without complex algorithms
**Solution**: Simple weighted scoring
```javascript
const score = 
  (titleMatches * 3) +    // Title is most important
  (contentMatches * 1) +  // Content matches
  (exactMatches * 5);     // Exact phrase matches
```

### 4. Responsive Search Results
**Problem**: Search results overlay needs to work on mobile
**Solution**: CSS positioning with viewport constraints
```css
.search-results {
  position: absolute;
  max-height: 400px;
  overflow-y: auto;
  /* Mobile-friendly with media queries */
}
```

---

## Key Use Cases & Workflows

### 1. User Searches for Content
```
User types in search box
    ↓
debounce() waits 300ms
    ↓
performSearch() queries index
    ↓
highlightMatches() creates snippets
    ↓
renderResults() displays in overlay
    ↓
User clicks result → navigates to page
```

### 2. Adding New Documentation
```
Author creates new HTML page
    ↓
Run: npm run build-search
    ↓
generate-search-index.js crawls new page
    ↓
search-index.json updated
    ↓
Git commit includes both new page + updated index
```

### 3. Development Workflow
```
Developer makes changes
    ↓
Test locally with file:// URLs
    ↓
Run build script to regenerate index
    ↓
Verify search still works
    ↓
Deploy to Vercel (optional)
```

---

## Code Conventions

### JavaScript Style
- **ES6+ features**: Use const/let, arrow functions, template literals
- **Async/Await**: Preferred over callbacks
- **Error handling**: Always use try/catch for async operations
- **Naming**: camelCase for variables, PascalCase for constructors

### HTML Structure
- **Semantic markup**: Use proper heading hierarchy (h1→h2→h3)
- **Accessibility**: Always include alt text, proper ARIA labels
- **Responsive**: Mobile-first design with CSS Grid/Flexbox

### File Organization
```
project-root/
├── index.html              # Main navigation
├── search.js              # Client-side search
├── search-index.json      # Generated search data
├── generate-search-index.js # Build script
├── programming/           # Documentation sections
│   ├── 01/
│   └── programming.html
└── ARCHITECTURE.md        # This file
```

---

## Naming Conventions

### File Naming
- **Content files**: `kebab-case.html` (e.g., `git-bash-setup.html`)
- **Generated files**: `search-index.json` (always kebab-case)
- **Scripts**: `camelCase.js` (e.g., `generateSearchIndex.js`)

### CSS Classes
- **Component-based**: `.search-container`, `.search-results`
- **State-based**: `.search-result:hover`, `.active`
- **Utility**: `.hidden`, `.visible`

### JavaScript Variables
- **DOM elements**: `$searchInput`, `$resultsContainer`
- **Data**: `searchIndex`, `searchResults`
- **Functions**: `performSearch()`, `renderResults()`

### Search Index Schema
```json
{
  "title": "Human-readable title",
  "content": "Searchable text content",
  "url": "relative/path/to/file.html",
  "lastModified": "2025-07-22T20:27:27.158Z"
}
```

---

## Module Details

### search.js Detailed Flow

#### Initialization
```javascript
// 1. Event listener setup
document.addEventListener('DOMContentLoaded', initSearch);

// 2. Search input binding
$searchInput.addEventListener('input', debounce(handleSearchInput, 300));

// 3. Click outside to close
document.addEventListener('click', handleClickOutside);
```

#### Search Process
```javascript
// 1. Query normalization
const query = input.toLowerCase().trim();

// 2. Tokenization for multi-word search
const tokens = query.split(/\s+/);

// 3. Scoring algorithm
const results = pages.map(page => ({
  ...page,
  score: calculateScore(page, tokens)
})).filter(r => r.score > 0).sort((a, b) => b.score - a.score);
```

### generate-search-index.js Build Process

#### Content Extraction Strategy
```javascript
// 1. Parse HTML with JSDOM
const dom = new JSDOM(htmlContent);

// 2. Extract meaningful text
const title = dom.window.document.querySelector('h1, title')?.textContent || '';
const content = extractVisibleText(dom.window.document.body);

// 3. Clean content
const cleaned = content
  .replace(/\s+/g, ' ')  // Normalize whitespace
  .trim()
  .substring(0, 5000);   // Limit for performance
```

#### Index Optimization
- **Size limits**: Content truncated to 5KB per page
- **Metadata**: Includes lastModified for cache invalidation
- **Relative URLs**: Ensures file:// compatibility

---

## Performance Considerations

### Runtime Performance
- **Index size**: Target < 500KB for fast loading
- **Search latency**: < 100ms for queries under 1000 pages
- **Memory usage**: Search index loaded once, cached

### Build Performance
- **Incremental builds**: Only changed files re-indexed
- **Parallel processing**: Uses Node.js async I/O
- **File watching**: Optional npm script for development

---

## Security & Privacy

### Client-Side Security
- **XSS Prevention**: All user input escaped with `escapeHtml()`
- **No external dependencies**: Eliminates supply chain risks
- **Content Security Policy**: Compatible with CSP restrictions

### Privacy
- **No tracking**: No analytics or external calls
- **Local-only**: All processing happens in browser
- **No cookies**: Stateless search implementation

---

## Independent Module Documentation

Each module in this system operates as a completely independent application with no integration points between them.

### tags.html - Tag Index Module
**Purpose**: Browse and search pages by tags and keywords
**Architecture**: Client-side tag-based navigation system
**Data Source**: Hardcoded `pages` array with metadata

#### Key Features
- **Tag-based filtering**: Multi-select tag cloud with real-time filtering
- **Full-text search**: Search by title and description
- **Responsive grid**: Card-based layout for page listings
- **Metadata display**: Shows category, date, and tags for each page
- **Independent data**: Self-contained page database

#### Data Structure
```javascript
const pages = [{
  title: "Page Title",
  description: "Page description",
  url: "relative/path.html",
  tags: ["tag1", "tag2"],
  category: "category-name",
  date: "2025-07-23"
}];
```

#### Technical Implementation
- **Pure HTML/CSS/JS**: No external dependencies
- **Client-side filtering**: No server requirements
- **Responsive design**: Mobile-first approach
- **Accessibility**: Keyboard navigation support

### template.html - Documentation Template Module
**Purpose**: Modern documentation template for transforming plain text into visually appealing HTML
**Architecture**: Client-side documentation renderer with progressive enhancement

#### Key Features
- **Progressive enhancement**: Works without JavaScript
- **TailwindCSS styling**: Modern, responsive design
- **Visual elements**: Icons, diagrams, and code blocks
- **Accessibility**: WCAG 2.1 AA compliance
- **SEO optimized**: Structured data and meta tags

#### Design Principles
- **Content preservation**: Maintains original text meaning
- **Visual enhancement**: Adds styling without content changes
- **Responsive layout**: Works on all screen sizes
- **Performance optimized**: Minimal JavaScript usage

#### Technical Stack
- **TailwindCSS**: Utility-first CSS framework
- **Font Awesome**: Icon system
- **Google Fonts**: Inter and JetBrains Mono
- **Semantic HTML**: Proper document structure

### image_gallery.html - Image Gallery Module
**Purpose**: Complete standalone image gallery with ranking, tags, and fullscreen viewing
**Architecture**: Client-side image management system with external JSON support

#### Key Features
- **External JSON data**: Images loaded from `private-pages-01/images_data_sample.json`
- **Ranking system**: Numeric ratings (e.g., 8.5, 9.25, 7.8)
- **Tag filtering**: Multi-select tag cloud for image filtering
- **Sorting**: By ranking, name, and other criteria
- **Fullscreen viewer**: Zoom, pan, and touch support
- **Import/export**: JSON data management

#### Data Structure
```json
{
  "images": [{
    "id": 1,
    "title": "Image Title",
    "description": "Image description",
    "src": "path/to/image.jpg",
    "ranking": 8.5,
    "tags": ["nature", "landscape"],
    "width": "400px",
    "height": "300px",
    "gridSpan": 2
  }]
}
```

#### Advanced Features
- **Custom dimensions**: Per-image width/height configuration
- **CSS Grid system**: Responsive layout with span control (1-4 columns)
- **Touch gestures**: Pinch-to-zoom and pan for mobile
- **Keyboard shortcuts**: ESC, +/-, 0 keys for navigation
- **File operations**: Import/export via FileReader API

### index.html - Navigation Hub
**Purpose**: Central navigation with search integration
**Architecture**: Simple HTML navigation with client-side search

#### Key Features
- **Search integration**: Uses search.js for full-text search
- **Hierarchical navigation**: Organized by topic categories
- **Visual hierarchy**: Nested list styling with tree indicators
- **Responsive design**: Works on mobile and desktop

---

## Module Independence Principle

### Design Philosophy
Each module is designed as a **completely independent application** with these characteristics:

- **Zero dependencies**: No shared code or data between modules
- **Standalone operation**: Each module works without the others
- **Self-contained**: All functionality within a single HTML file
- **No integration points**: Modules do not communicate or share state

### Benefits
- **Selective usage**: Use only the modules you need
- **Simplified maintenance**: Changes to one module don't affect others
- **Easy deployment**: Each module can be deployed independently
- **Reduced complexity**: No cross-module dependencies to manage

### Navigation
While modules are independent, they include navigation links back to `index.html` for user convenience, but this is purely for user experience and not a technical integration.

---

## Future Enhancements

### Planned Features
- **Fuzzy search**: Using Levenshtein distance
- **Search suggestions**: Auto-complete functionality
- **Multi-language support**: Unicode-aware search
- **Advanced filters**: By date, category, tags
- **Image optimization**: Automatic thumbnail generation
- **Batch operations**: Bulk image management

### Backward Compatibility
- **Index format**: Will maintain v1 compatibility
- **URL structure**: Existing links will continue working
- **API surface**: search.js public API will remain stable
- **Image data**: JSON schema will maintain backward compatibility