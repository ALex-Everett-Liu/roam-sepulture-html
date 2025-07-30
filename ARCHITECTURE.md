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

**Core Design Philosophy**: Modern web technologies with pragmatic dependency usage for enhanced functionality and developer experience.

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

### 2. URL Compatibility
**Consideration**: Support for both local and deployed usage
**Solution**: Flexible path handling with relative URLs
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
- **Vetted dependencies**: Use established libraries with good security track records
- **Content Security Policy**: Compatible with CSP restrictions

### Privacy
- **No tracking**: No analytics or external calls
- **Local-first**: Processing happens in browser when possible
- **Minimal data collection**: Only essential data for functionality

---

## Module Documentation

### tags.html - Tag Index Module
A client-side tag-based navigation system for browsing pages by tags and keywords.

**Features:**
- Tag-based filtering with multi-select cloud
- Full-text search by title and description
- Responsive card-based layout
- Metadata display (category, date, tags)
- Self-contained page database

**Data Structure:**
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

### template.html - Documentation Template
A modern documentation template that transforms plain text into visually appealing HTML.

**Features:**
- Progressive enhancement (works without JS)
- TailwindCSS styling
- Visual elements (icons, diagrams, code blocks)
- Accessibility compliant
- SEO optimized

**Technical Stack:**
- TailwindCSS (via CDN)
- Font Awesome icons
- Google Fonts (Inter, JetBrains Mono)
- Prism.js syntax highlighting
- Semantic HTML structure

### image_gallery.html - Image Gallery
Complete image gallery with ranking, tags, and fullscreen viewing capabilities.

**Features:**
- External JSON data loading
- Numeric ranking system (e.g., 8.5, 9.25)
- Tag filtering and sorting
- Fullscreen viewer with zoom/pan
- Import/export functionality
- Custom dimensions: Per-image width/height configuration
- CSS Grid system: Responsive layout with span control (1-4 columns)
- Touch gestures: Pinch-to-zoom and pan for mobile
- Keyboard shortcuts: ESC, +/-, 0 keys for navigation
- File operations: Import/export via FileReader API

**Data Structure:**
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

### index.html - Navigation Hub
Central navigation page with search integration and topic organization.

**Features:**
- Full-text search integration
- Hierarchical topic navigation
- Visual hierarchy: Nested list styling with tree indicators
- Responsive design: Works on mobile and desktop

---

## Future Enhancements

### Planned Features
- **Fuzzy search**: Using Levenshtein distance
- **Search suggestions**: Auto-complete functionality
- **Multi-language support**: Unicode-aware search
- **Advanced filters**: By date, category, tags
- **Image optimization**: Automatic thumbnail generation
- **Batch operations**: Bulk image management

### Compatibility Considerations
- **Index format**: Will maintain v1 compatibility
- **URL structure**: Existing links will continue working
- **API surface**: Core APIs will remain stable
- **Dependency management**: Careful version pinning for stability