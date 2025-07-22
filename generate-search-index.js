const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

class SearchIndexGenerator {
    constructor() {
        this.index = [];
    }

    async generateIndex() {
        console.log('Generating search index...');
        
        const htmlFiles = this.findHtmlFiles('.');
        
        for (const file of htmlFiles) {
            await this.indexFile(file);
        }
        
        this.saveIndex();
        console.log(`Indexed ${this.index.length} pages`);
    }

    findHtmlFiles(dir) {
        const files = [];
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                files.push(...this.findHtmlFiles(fullPath));
            } else if (item.endsWith('.html') && !item.startsWith('.')) {
                files.push(fullPath);
            }
        }
        
        return files;
    }

    async indexFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const dom = new JSDOM(content);
            const document = dom.window.document;
            
            const title = document.querySelector('title')?.textContent || 
                         document.querySelector('h1')?.textContent || 
                         path.basename(filePath, '.html');
            
            // Remove script and style content
            const scripts = document.querySelectorAll('script, style');
            scripts.forEach(script => script.remove());
            
            const bodyText = document.body?.textContent || 
                           document.textContent || '';
            
            // Clean up text content
            const cleanContent = bodyText
                .replace(/\s+/g, ' ')
                .trim()
                .substring(0, 1000); // Limit content length
            
            const url = filePath.replace(/^\.\//, '').replace(/\\/g, '/');
            
            this.index.push({
                title: title.trim(),
                content: cleanContent,
                url: url,
                lastModified: fs.statSync(filePath).mtime.toISOString()
            });
            
        } catch (error) {
            console.warn(`Failed to index ${filePath}:`, error.message);
        }
    }

    saveIndex() {
        fs.writeFileSync('search-index.json', JSON.stringify(this.index, null, 2));
    }
}

// Run if called directly
if (require.main === module) {
    const generator = new SearchIndexGenerator();
    generator.generateIndex().catch(console.error);
}

module.exports = SearchIndexGenerator;