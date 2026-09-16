const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleDriveCache {
    constructor(options = {}) {
        this.ttlMs = options.ttlMs || 2 * 60 * 60 * 1000; // 2 horas padrão
        this.cacheFolder = options.cacheFolder || 'animefire-cache';
        this.credentialsPath = options.credentialsPath || path.join(process.cwd(), 'credentials.json');
        this.drive = null;
        this.folderId = null;
        this.init();
    }

    async init() {
        try {
            // Autenticar com Google Drive
            const auth = new google.auth.GoogleAuth({
                keyFile: this.credentialsPath,
                scopes: ['https://www.googleapis.com/auth/drive.file']
            });

            this.drive = google.drive({ version: 'v3', auth });

            // Criar/obter pasta de cache
            await this.ensureCacheFolder();
            
            console.log(`? GoogleDriveCache inicializado (TTL: ${this.ttlMs}ms, Folder: ${this.cacheFolder})`);
        } catch (error) {
            console.error('? Erro ao inicializar GoogleDriveCache:', error.message);
            // Fallback para cache local se Google Drive falhar
            console.log('? Usando fallback para cache local...');
            this.useFallback = true;
        }
    }

    async ensureCacheFolder() {
        try {
            // Buscar pasta existente
            const response = await this.drive.files.list({
                q: `name='${this.cacheFolder}' and mimeType='application/vnd.google-apps.folder'`,
                fields: 'files(id, name)'
            });

            if (response.data.files.length > 0) {
                this.folderId = response.data.files[0].id;
                console.log(`? Pasta de cache encontrada: ${this.cacheFolder} (${this.folderId})`);
            } else {
                // Criar nova pasta
                const fileMetadata = {
                    name: this.cacheFolder,
                    mimeType: 'application/vnd.google-apps.folder'
                };

                const folder = await this.drive.files.create({
                    requestBody: fileMetadata,
                    fields: 'id'
                });

                this.folderId = folder.data.id;
                console.log(`? Pasta de cache criada: ${this.cacheFolder} (${this.folderId})`);
            }
        } catch (error) {
            console.error('? Erro ao criar pasta de cache:', error.message);
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

    async get(scraperApiUrl) {
        if (this.useFallback) {
            return await this.fallbackGet(scraperApiUrl);
        }

        const { key, fileName } = this.generateKey(scraperApiUrl);
        
        try {
            const response = await this.drive.files.list({
                q: `name='${fileName}' and parents in '${this.folderId}'`,
                fields: 'files(id, name, modifiedTime)'
            });

            if (response.data.files.length === 0) {
                return null;
            }

            const file = response.data.files[0];
            const fileContent = await this.drive.files.get({
                fileId: file.id,
                alt: 'media'
            });

            const data = JSON.parse(fileContent.data);
            const now = Date.now();

            if (now > data.expires_at) {
                await this.drive.files.delete({ fileId: file.id });
                return null;
            }

            console.log(`? Cache HIT: ${key.substring(0, 80)}...`);
            return data;
        } catch (error) {
            console.error('? Erro ao ler cache do Google Drive:', error.message);
            return await this.fallbackGet(scraperApiUrl);
        }
    }

    async set(scraperApiUrl, data) {
        if (this.useFallback) {
            return await this.fallbackSet(scraperApiUrl, data);
        }

        const { key, fileName } = this.generateKey(scraperApiUrl);
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
            const fileMetadata = {
                name: fileName,
                parents: [this.folderId]
            };

            const media = {
                mimeType: 'application/json',
                body: JSON.stringify(cacheEntry)
            };

            const response = await this.drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: 'id'
            });

            console.log(`? Cache SET: ${key.substring(0, 80)}... (expira em ${new Date(cacheEntry.expires_at).toISOString()})`);
            return true;
        } catch (error) {
            console.error('? Erro ao salvar cache no Google Drive:', error.message);
            return await this.fallbackSet(scraperApiUrl, data);
        }
    }

    async has(scraperApiUrl) {
        if (this.useFallback) {
            return await this.fallbackHas(scraperApiUrl);
        }

        const { fileName } = this.generateKey(scraperApiUrl);
        
        try {
            const response = await this.drive.files.list({
                q: `name='${fileName}' and parents in '${this.folderId}'`,
                fields: 'files(id, name, modifiedTime)'
            });

            if (response.data.files.length === 0) {
                return false;
            }

            const file = response.data.files[0];
            const fileContent = await this.drive.files.get({
                fileId: file.id,
                alt: 'media'
            });

            const data = JSON.parse(fileContent.data);
            return Date.now() <= data.expires_at;
        } catch (error) {
            console.error('? Erro ao verificar cache no Google Drive:', error.message);
            return await this.fallbackHas(scraperApiUrl);
        }
    }

    async delete(scraperApiUrl) {
        if (this.useFallback) {
            return await this.fallbackDelete(scraperApiUrl);
        }

        const { fileName } = this.generateKey(scraperApiUrl);
        
        try {
            const response = await this.drive.files.list({
                q: `name='${fileName}' and parents in '${this.folderId}'`,
                fields: 'files(id, name)'
            });

            if (response.data.files.length > 0) {
                await this.drive.files.delete({ fileId: response.data.files[0].id });
                return true;
            }
            return false;
        } catch (error) {
            console.error('? Erro ao deletar cache do Google Drive:', error.message);
            return await this.fallbackDelete(scraperApiUrl);
        }
    }

    async cleanup() {
        if (this.useFallback) {
            return await this.fallbackCleanup();
        }

        try {
            const response = await this.drive.files.list({
                q: `parents in '${this.folderId}' and mimeType='application/json'`,
                fields: 'files(id, name, modifiedTime)'
            });

            const now = Date.now();
            let removed = 0;

            for (const file of response.data.files) {
                try {
                    const fileContent = await this.drive.files.get({
                        fileId: file.id,
                        alt: 'media'
                    });

                    const data = JSON.parse(fileContent.data);
                    if (now > data.expires_at) {
                        await this.drive.files.delete({ fileId: file.id });
                        removed++;
                    }
                } catch (error) {
                    // Arquivo corrompido, remove
                    await this.drive.files.delete({ fileId: file.id });
                    removed++;
                }
            }

            if (removed > 0) {
                console.log(`? GoogleDriveCache cleanup: ${removed} entradas removidas`);
            }
            return removed;
        } catch (error) {
            console.error('? Erro na limpeza do Google Drive:', error.message);
            return await this.fallbackCleanup();
        }
    }

    async clear() {
        if (this.useFallback) {
            return await this.fallbackClear();
        }

        try {
            const response = await this.drive.files.list({
                q: `parents in '${this.folderId}' and mimeType='application/json'`,
                fields: 'files(id, name)'
            });

            let removed = 0;

            for (const file of response.data.files) {
                await this.drive.files.delete({ fileId: file.id });
                removed++;
            }

            console.log(`? GoogleDriveCache clear: ${removed} entradas removidas`);
            return removed;
        } catch (error) {
            console.error('? Erro ao limpar cache do Google Drive:', error.message);
            return await this.fallbackClear();
        }
    }

    async stats() {
        if (this.useFallback) {
            return await this.fallbackStats();
        }

        try {
            const response = await this.drive.files.list({
                q: `parents in '${this.folderId}' and mimeType='application/json'`,
                fields: 'files(id, name, size, modifiedTime)'
            });

            const now = Date.now();
            let total = 0;
            let valid = 0;
            let expired = 0;
            let totalSize = 0;

            for (const file of response.data.files) {
                totalSize += parseInt(file.size || 0);
                total++;

                try {
                    const fileContent = await this.drive.files.get({
                        fileId: file.id,
                        alt: 'media'
                    });

                    const data = JSON.parse(fileContent.data);
                    if (now <= data.expires_at) {
                        valid++;
                    } else {
                        expired++;
                    }
                } catch (error) {
                    expired++;
                }
            }

            return {
                total,
                valid,
                expired,
                totalSize,
                ttlMs: this.ttlMs,
                cacheFolder: this.cacheFolder,
                folderId: this.folderId
            };
        } catch (error) {
            console.error('? Erro ao obter estatísticas do Google Drive:', error.message);
            return await this.fallbackStats();
        }
    }

    // Métodos de fallback para cache local
    async fallbackGet(scraperApiUrl) {
        const FileCache = require('./file-cache');
        if (!this.fallbackCache) {
            this.fallbackCache = new FileCache({ ttlMs: this.ttlMs });
        }
        return await this.fallbackCache.get(scraperApiUrl);
    }

    async fallbackSet(scraperApiUrl, data) {
        const FileCache = require('./file-cache');
        if (!this.fallbackCache) {
            this.fallbackCache = new FileCache({ ttlMs: this.ttlMs });
        }
        return await this.fallbackCache.set(scraperApiUrl, data);
    }

    async fallbackHas(scraperApiUrl) {
        const FileCache = require('./file-cache');
        if (!this.fallbackCache) {
            this.fallbackCache = new FileCache({ ttlMs: this.ttlMs });
        }
        return await this.fallbackCache.has(scraperApiUrl);
    }

    async fallbackDelete(scraperApiUrl) {
        const FileCache = require('./file-cache');
        if (!this.fallbackCache) {
            this.fallbackCache = new FileCache({ ttlMs: this.ttlMs });
        }
        return await this.fallbackCache.delete(scraperApiUrl);
    }

    async fallbackCleanup() {
        const FileCache = require('./file-cache');
        if (!this.fallbackCache) {
            this.fallbackCache = new FileCache({ ttlMs: this.ttlMs });
        }
        return await this.fallbackCache.cleanup();
    }

    async fallbackClear() {
        const FileCache = require('./file-cache');
        if (!this.fallbackCache) {
            this.fallbackCache = new FileCache({ ttlMs: this.ttlMs });
        }
        return await this.fallbackCache.clear();
    }

    async fallbackStats() {
        const FileCache = require('./file-cache');
        if (!this.fallbackCache) {
            this.fallbackCache = new FileCache({ ttlMs: this.ttlMs });
        }
        return await this.fallbackCache.stats();
    }
}

module.exports = GoogleDriveCache;
