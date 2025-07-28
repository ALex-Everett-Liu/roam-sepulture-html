# Debugging Lessons: Image Gallery Subsidiary Images

Created a comprehensive debugging lessons learned document that captures the critical insights from today's troubleshooting session. The document covers the key issues we encountered and provides actionable prevention strategies for future development.

## Critical Debugging Tips for Image Group Functionality

### 1. Data Structure Validation
**Lesson**: Always verify field requirements against actual implementation
- **Issue**: Subsidiary images missing `majorImageId` field
- **Root Cause**: JSON data structure didn't match filtering logic requirements
- **Solution**: Added `majorImageId: 1` to subsidiary image records

**Checklist for future data validation**:
```json
// Required fields for subsidiary images:
{
  "id": number,
  "src": string,
  "width": string,
  "height": string,
  "gridSpan": number,
  "isMajor": false,
  "groupId": string,
  "majorImageId": number  // ← Critical missing field
}
```

### 2. Scope and Variable Context
**Lesson**: Always check function parameter scope when debugging
- **Issue**: `group is not defined` error after function signature change
- **Root Cause**: Used wrong variable name in function call (`group.major` vs `majorImage`)
- **Solution**: Corrected parameter reference to match function signature

**Debugging pattern**:
1. Check function signature: `function createImageGroup(majorImage, subsidiaries)`
2. Verify variable names in scope: `majorImage` is parameter, not `group.major`
3. Update all call sites consistently

### 3. CSS Layout Constraints
**Lesson**: Understand CSS grid limitations in nested contexts
- **Issue**: Subsidiary images couldn't exceed 158px width despite `gridSpan: 4`
- **Root Cause**: Subsidiary gallery uses `minmax(150px, 1fr)` grid columns
- **Solution**: Added CSS classes to override grid behavior for wide items

**CSS debugging approach**:
```css
/* Original constraint */
.subsidiary-gallery {
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

/* Added override classes */
.subsidiary-item.wide { grid-column: span 2; }
.subsidiary-item.extra-wide { grid-column: span 3; }
.subsidiary-item.full-width { grid-column: 1 / -1; }
```

### 4. Data Inheritance Patterns
**Lesson**: Plan for metadata inheritance in hierarchical structures
- **Issue**: Subsidiary images showing "undefined" labels
- **Root Cause**: Subsidiary images omitted title field, but display logic expected it
- **Solution**: Added fallback inheritance from major image

**Implementation pattern**:
```javascript
// Safe inheritance
const displayTitle = img.title || majorImage.title;
```

## Key Debugging Workflow

### Step 1: Console Inspection
- Check browser console for JavaScript errors
- Examine generated HTML structure
- Verify CSS computed styles

### Step 2: Data Validation
- Compare JSON structure against schema requirements
- Validate all required fields are present
- Check data type consistency

### Step 3: Scope Analysis
- Trace variable scope from function parameters
- Verify parameter names match usage
- Check for shadowing or naming conflicts

### Step 4: CSS Investigation
- Use browser DevTools to inspect computed styles
- Identify layout constraints (grid, flex, etc.)
- Test overrides in DevTools before code changes

### Step 5: Incremental Testing
- Make one change at a time
- Test each component in isolation
- Verify integration after fixes

## Prevention Strategies

### 1. Schema Documentation
```json
{
  "$schema": "image-gallery-schema.json",
  "definitions": {
    "subsidiaryImage": {
      "required": ["id", "src", "groupId", "majorImageId", "gridSpan"],
      "properties": {
        "title": {"type": "string", "description": "Optional - inherits from major if missing"}
      }
    }
  }
}
```

### 2. Runtime Validation
```javascript
function validateSubsidiaryImage(img) {
  const required = ['id', 'src', 'groupId', 'majorImageId'];
  const missing = required.filter(field => !img[field]);
  if (missing.length > 0) {
    console.warn(`Subsidiary image ${img.id} missing:`, missing);
  }
}
```

### 3. Development Tools Integration
- Add ESLint rules for undefined variables
- Use TypeScript for better type checking
- Implement JSON schema validation during loading

## Quick Reference: Common Issues

| Symptom | Likely Cause | Quick Fix |
|---------|--------------|-----------|
| "undefined" labels | Missing title field | Add inheritance fallback |
| Width constraints | CSS grid limitations | Add span classes |
| Scope errors | Wrong variable names | Check function signatures |
| Missing subsidiary images | Invalid filtering | Validate data structure |

## Testing Checklist

Before deploying image group functionality:
- [ ] All subsidiary images have `majorImageId`
- [ ] Major images have `groupId`
- [ ] CSS classes handle all `gridSpan` values (1-4)
- [ ] Empty titles inherit properly
- [ ] Console shows no errors
- [ ] Responsive behavior works on all screen sizes
- [ ] Import/export preserves all required fields

## Additional Critical Debugging Lessons

### 1. Missing filterAndSortImages() Calls
**Issue**: "No images found" despite successful JSON loading
**Root Cause**: `filterAndSortImages()` wasn't called after loading JSON data
**Solution**: Added explicit calls after both success and fallback cases
```javascript
// Critical fix added after JSON loading
filterAndSortImages();
console.log('After filterAndSortImages, filteredImages:', filteredImages.length);
```

### 2. Subsidiary Image Inheritance in Filtering
**Issue**: Subsidiary images weren't properly filtered by tags or sorted by ranking
**Root Cause**: Filtering logic didn't account for subsidiary images inheriting metadata
**Solution**: Enhanced filtering to check major image properties when filtering subsidiaries

### 3. Import/Export Data Flow
**Issue**: Tag cloud and UI state weren't properly refreshed after data import
**Solution**: Added explicit UI refresh calls and state cleanup in import function

### 4. Complete Debug Flow Verification
**Test Protocol**:
- **Refresh page** → Check console for: "After filterAndSortImages, filteredImages: [actual count]"
- **Import new JSON** → Verify tag cloud updates automatically
- **Filter by tags** → Confirm subsidiaries are correctly filtered via major image tags
- **Sort by ranking** → Verify standalone images appear in correct sort position

### Complete Debug Checklist
For future gallery debugging:
- [ ] Verify filterAndSortImages() is called after data load
- [ ] Check subsidiary image inheritance logic
- [ ] Validate tag cloud updates after data changes
- [ ] Test Windows absolute path handling
- [ ] Verify standalone image sort order preservation

---

*Last updated: 2025-07-29*
*File: `debugging-lessons-learned.md`*