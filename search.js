class WikiSearch {
    constructor() {
        this.index = [];
        this.loadIndex();
    }

    async loadIndex() {
        try {
            const response = await fetch('search-index.json');
            this.index = await response.json();
        } catch (error) {
            console.warn('Search index not found, creating empty index');
            this.index = [];
        }
    }

    search(query) {
        if (!query.trim()) return [];
        
        const terms = query.toLowerCase().split(/\s+/);
        const results = [];

        for (const doc of this.index) {
            let score = 0;
            let matches = [];

            for (const term of terms) {
                const titleMatch = doc.title.toLowerCase().includes(term);
                const contentMatch = doc.content.toLowerCase().includes(term);
                
                if (titleMatch) score += 10;
                if (contentMatch) score += 5;
                
                if (titleMatch || contentMatch) {
                    matches.push(term);
                }
            }

            if (score > 0) {
                results.push({
                    ...doc,
                    score,
                    matches: [...new Set(matches)]
                });
            }
        }

        return results.sort((a, b) => b.score - a.score);
    }

    renderSearchBox() {
        return `
            <div class="search-container">
                <input type="text" id="search-input" placeholder="Search wiki..." autocomplete="off">
                <div id="search-results" class="search-results" style="display: none;"></div>
            </div>
        `;
    }

    renderResults(results) {
        if (results.length === 0) {
            return '<div class="no-results">No results found</div>';
        }

        return results.map(result => `
            <div class="search-result">
                <a href="${result.url}">
                    <div class="result-title">${result.title}</div>
                    <div class="result-snippet">${this.createSnippet(result.content, result.matches)}</div>
                </a>
            </div>
        `).join('');
    }

    createSnippet(content, matches) {
        const maxLength = 150;
        let snippet = content.substring(0, maxLength);
        
        if (content.length > maxLength) {
            snippet += '...';
        }

        matches.forEach(term => {
            const regex = new RegExp(`(${term})`, 'gi');
            snippet = snippet.replace(regex, '<mark>$1</mark>');
        });

        return snippet;
    }
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const search = new WikiSearch();
    
    // Add search box to pages
    const containers = document.querySelectorAll('.container');
    if (containers.length > 0) {
        containers[0].insertAdjacentHTML('afterbegin', search.renderSearchBox());
        
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            if (query.length > 1) {
                const results = search.search(query);
                searchResults.innerHTML = search.renderResults(results);
                searchResults.style.display = 'block';
            } else {
                searchResults.style.display = 'none';
            }
        });
        
        searchInput.addEventListener('blur', () => {
            setTimeout(() => searchResults.style.display = 'none', 200);
        });
    }
});