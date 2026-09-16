const axios = require('axios');
const fs = require('fs');
const path = require('path');

class BitbucketCache {
    constructor(options = {}) {
        this.ttlMs = options.ttlMs || 2 * 60 * 60 * 1000; // 2 horas padrão
        this.cacheDir = options.cacheDir || path.join(process.cwd(), 'data', 'cache');
        this.bitbucketUrl = options.bitbucketUrl || process.env.BITBUCKET_CACHE_URL;
        this.username = options.username || process.env.BITBUCKET_USERNAME;
        this.password = options.password || process.env.BITBUCKET_PASSWORD;
        this.repository = options.repository || process.env.BITBUCKET_REPOSITORY;
        this.init();
    }

    async init() {
        try {
            if (!fs.existsSync(this.cacheDir)) {
                fs.mkdirSync(this.cacheDir, { recursive: true });
            }
            console.log(`? BitbucketCache inicializado (TTL: ${this.ttlMs}ms, Dir: ${this.cacheDir})`);
            console.log(`? Repositório: ${this.repository}`);
        } catch (error) {
            console.error('? Erro ao inicializar BitbucketCache:', error.message);
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
            // Tentar cache local primeiro
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const now = Date.now();

                if (now <= data.expires_at) {
                    console.log(`? Cache HIT (local): ${key.substring(0, 80)}...`);
                    return data;
                } else {
                    fs.unlinkSync(filePath);
                }
            }

            // Se não tem local, tentar do Bitbucket
            if (this.bitbucketUrl && this.username && this.password) {
                const bitbucketFileName = `cache/${fileName}`;
                const bitbucketFileUrl = `https://api.bitbucket.org/2.0/repositories/${this.username}/${this.repository}/src/${bitbucketFileName}`;
                
                try {
                    const response = await axios.get(bitbucketFileUrl, {
                        auth: {
                            username: this.username,
                            password: this.password
                        },
                        timeout: 10000
                    });

                    if (response.data) {
                        const data = JSON.parse(response.data);
                        const now = Date.now();

                        if (now <= data.expires_at) {
                            // Salvar localmente para cache futuro
                            fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');
                            console.log(`? Cache HIT (bitbucket): ${key.substring(0, 80)}...`);
                            return data;
                        } else {
                            console.log(`? Cache expirado no Bitbucket: ${key.substring(0, 80)}...`);
                            return null;
                        }
                    }
                } catch (error) {
                    console.error('? Erro ao buscar do Bitbucket:', error.message);
                    return null;
                }
            }

            return null;
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
            // Salvar localmente
            fs.writeFileSync(filePath, JSON.stringify(cacheEntry), 'utf8');

            // Tentar salvar no Bitbucket
            if (this.bitbucketUrl && this.username && this.password) {
                const bitbucketFileName = `cache/${fileName}`;
                const bitbucketFileUrl = `https://api.bitbucket.org/2.0/repositories/${this.username}/${this.repository}/src/${bitbucketFileName}`;
                
                try {
                    await axios.put(bitbucketFileUrl, JSON.stringify(cacheEntry), {
                        auth: {
                            username: this.username,
                            password: this.password
                        },
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        timeout: 30000
                    });
                    console.log(`? Cache SET (bitbucket): ${key.substring(0, 80)}...`);
                } catch (error) {
                    console.error('? Erro ao salvar no Bitbucket:', error.message);
                    // Não falhar completamente se falhar no Bitbucket
                }
            }

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
            // Verificar local primeiro
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const now = Date.now();
                return now <= data.expires_at;
            }

            // Se não tem local, verificar no Bitbucket
            if (this.bitbucketUrl && this.username && this.password) {
                const bitbucketFileName = `cache/${fileName}`;
                const bitbucketFileUrl = `https://api.bitbucket.org/2.0/repositories/${this.username}/${this.repository}/src/${bitbucketFileName}`;
                
                try {
                    const response = await axios.get(bitbucketFileUrl, {
                        auth: {
                            username: this.username,
                            password: this.password
                        },
                        timeout: 5000
                    });

                    if (response.data) {
                        const data = JSON.parse(response.data);
                        const now = Date.now();
                        return now <= data.expires_at;
                    }
                } catch (error) {
                    console.error('? Erro ao verificar no Bitbucket:', error.message);
                    return false;
                }
            }

            return false;
        } catch {
            return false;
        }
    }

    async delete(scraperApiUrl) {
        const { fileName } = this.generateKey(scraperApiUrl);
        const filePath = this.getFilePath(fileName);
        let deleted = false;
        
        try {
            // Deletar localmente
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                deleted = true;
                console.log(`?? Cache deletado (local): ${key.substring(0, 80)}...`);
            }

            // Tentar deletar do Bitbucket
            if (this.bitbucketUrl && this.username && this.password) {
                const bitbucketFileName = `cache/${fileName}`;
                const bitbucketFileUrl = `https://api.bitbucket.org/2.0/repositories/${this.username}/${this.repository}/src/${bitbucketFileName}`;
                
                try {
                    await axios.delete(bitbucketFileUrl, {
                        auth: {
                            username: this.username,
                            password: this.password
                        },
                        timeout: 10000
                    });
                    deleted = true;
                    console.log(`?? Cache deletado (bitbucket): ${key.substring(0, 80)}...`);
                } catch (error) {
                    console.error('? Erro ao deletar do Bitbucket:', error.message);
                    // Não falhar completamente se falhar no Bitbucket
                }
            }

            return deleted;
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
                console.log(`? BitbucketCache cleanup (local): ${removed} entradas removidas`);
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

            console.log(`? BitbucketCache clear (local): ${removed} entradas removidas`);
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
                cacheDir: this.cacheDir,
                repository: this.repository
            };
        } catch (error) {
            return { total: 0, valid: 0, expired: 0, totalSize: 0, ttlMs: this.ttlMs, cacheDir: this.cacheDir, repository: this.repository };
        }
    }
}

module.exports = BitbucketCache;
