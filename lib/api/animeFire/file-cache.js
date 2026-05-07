const fs = require('fs');
const path = require('path');

class FileCache {
    constructor(options = {}) {
        this.ttlMs = options.ttlMs || 2 * 60 * 60 * 1000; // 2 horas padrão
        this.cacheDir = options.cacheDir || path.join(process.cwd(), 'data', 'cache');
        this.cleanupInterval = null;
        this.init();
    }

    init() {
        try {
            if (!fs.existsSync(this.cacheDir)) {
                fs.mkdirSync(this.cacheDir, { recursive: true });
            }
            this.startAutoCleanup();
            console.log(`? FileCache inicializado (TTL: ${this.ttlMs}ms, Dir: ${this.cacheDir})`);
        } catch (error) {
            console.error('? Erro ao inicializar FileCache:', error.message);
            throw error;
        }
    }

    // Gerar chave única e nome de arquivo seguro
    generateKey(scraperApiUrl) {
        const urlMatch = scraperApiUrl.match(/[?&]url=([^&]+)/);
        const originalUrl = urlMatch ? decodeURIComponent(urlMatch[1]) : scraperApiUrl;
        const key = `scraper:${originalUrl}`;
        // Criar hash simples para nome de arquivo
        const crypto = require('crypto');
        const hash = crypto.createHash('md5').update(key).digest('hex');
        return { key, fileName: `${hash}.json` };
    }

    getFilePath(fileName) {
        return path.join(this.cacheDir, fileName);
    }

    async get(scraperApiUrl) {
        const { key, fileName } = this.generateKey(scraperApiUrl);
        const filePath = this.getFilePath(fileName);
        
        try {
            if (!fs.existsSync(filePath)) {
                return null;
            }

            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const now = Date.now();

            if (now > data.expires_at) {
                fs.unlinkSync(filePath);
                return null;
            }

            console.log(`? Cache HIT: ${key.substring(0, 80)}...`);
            return data;
        } catch (error) {
            console.error('? Erro ao ler cache:', error.message);
            return null;
        }
    }

    async set(scraperApiUrl, data) {
        const { key, fileName } = this.generateKey(scraperApiUrl);
        const filePath = this.getFilePath(fileName);
        const now = Date.now();
        
        const cacheEntry = {
            key,
            url: scraperApiUrl,
            data: data.data,
            original_url: data.url,
            created_at: now,
            expires_at: now + this.ttlMs
        };

        try {
            fs.writeFileSync(filePath, JSON.stringify(cacheEntry), 'utf8');
            console.log(`? Cache SET: ${key.substring(0, 80)}... (expira em ${new Date(cacheEntry.expires_at).toISOString()})`);
            return true;
        } catch (error) {
            console.error('? Erro ao salvar cache:', error.message);
            return false;
        }
    }

    async has(scraperApiUrl) {
        const { fileName } = this.generateKey(scraperApiUrl);
        const filePath = this.getFilePath(fileName);
        
        try {
            if (!fs.existsSync(filePath)) return false;
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            return Date.now() <= data.expires_at;
        } catch {
            return false;
        }
    }

    async delete(scraperApiUrl) {
        const { fileName } = this.generateKey(scraperApiUrl);
        const filePath = this.getFilePath(fileName);
        
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                return true;
            }
            return false;
        } catch (error) {
            console.error('? Erro ao deletar cache:', error.message);
            return false;
        }
    }

    async cleanup() {
        try {
            const files = fs.readdirSync(this.cacheDir);
            const now = Date.now();
            let removed = 0;

            for (const file of files) {
                if (!file.endsWith('.json')) continue;
                
                const filePath = path.join(this.cacheDir, file);
                try {
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    if (now > data.expires_at) {
                        fs.unlinkSync(filePath);
                        removed++;
                    }
                } catch {
                    // Arquivo corrompido, remove
                    fs.unlinkSync(filePath);
                    removed++;
                }
            }

            if (removed > 0) {
                console.log(`? FileCache cleanup: ${removed} entradas removidas`);
            }
            return removed;
        } catch (error) {
            console.error('? Erro na limpeza:', error.message);
            return 0;
        }
    }

    async clear() {
        try {
            const files = fs.readdirSync(this.cacheDir);
            let removed = 0;

            for (const file of files) {
                if (file.endsWith('.json')) {
                    fs.unlinkSync(path.join(this.cacheDir, file));
                    removed++;
                }
            }

            console.log(`? FileCache clear: ${removed} entradas removidas`);
            return removed;
        } catch (error) {
            console.error('? Erro ao limpar cache:', error.message);
            return 0;
        }
    }

    async stats() {
        try {
            const files = fs.readdirSync(this.cacheDir);
            const now = Date.now();
            let total = 0;
            let valid = 0;
            let expired = 0;
            let totalSize = 0;

            for (const file of files) {
                if (!file.endsWith('.json')) continue;
                
                const filePath = path.join(this.cacheDir, file);
                const stats = fs.statSync(filePath);
                totalSize += stats.size;
                total++;

                try {
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    if (now <= data.expires_at) {
                        valid++;
                    } else {
                        expired++;
                    }
                } catch {
                    expired++;
                }
            }

            return {
                total,
                valid,
                expired,
                totalSize,
                ttlMs: this.ttlMs,
                cacheDir: this.cacheDir
            };
        } catch (error) {
            return { total: 0, valid: 0, expired: 0, totalSize: 0, ttlMs: this.ttlMs, cacheDir: this.cacheDir };
        }
    }

    startAutoCleanup() {
        const interval = 10 * 60 * 1000; // 10 minutos
        this.cleanupInterval = setInterval(() => {
            this.cleanup().catch(err => {
                console.error('? Erro na limpeza automática:', err.message);
            });
        }, interval);
        console.log(`? Auto-cleanup configurado (a cada ${interval}ms)`);
    }

    stopAutoCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

module.exports = FileCache;
