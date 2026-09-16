# Alternativas de Cache Sem Google Cloud Console

## ? Google Drive Limitação

**Infelizmente não é possível usar Google Drive API sem o Google Cloud Console** porque:

- ? Não existe "Personal Access Token" como GitHub
- ? Não existe API Key sem OAuth para Drive  
- ? Sempre requer autenticação via Google Cloud
- ? Service Account obrigatório para acesso programático

## ? Alternativas Disponíveis

### **1. Cache Local (Padrão Atual)**
```javascript
// Já implementado em file-cache.js
const FileCache = require('./file-cache');
const cache = new FileCache({ ttlMs: 7200000 });
```

**Prós:**
- ? Sem configuração externa
- ? Rápido e confiável
- ? Funciona offline

**Contras:**
- ? Não compartilhado entre servidores
- ? Perdido se servidor for reiniciado

### **2. Cache em Memória com Redis**
```bash
npm install redis
```

```javascript
const redis = require('redis');
const client = redis.createClient();

class RedisCache {
    async get(key) {
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
    }
    
    async set(key, data, ttl) {
        await client.setex(key, ttl / 1000, JSON.stringify(data));
    }
}
```

**Prós:**
- ? Rápido (memória)
- ? Compartilhado entre processos
- ? TTL automático

**Contras:**
- ? Requer servidor Redis
- ? Dados perdidos se Redis reiniciar

### **3. Cache em Database (SQLite)**
```bash
npm install sqlite3
```

```javascript
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./cache.db');

class SQLiteCache {
    async get(key) {
        return new Promise((resolve) => {
            db.get('SELECT data FROM cache WHERE key = ? AND expires > ?', 
                [key, Date.now()], (err, row) => {
                resolve(row ? JSON.parse(row.data) : null);
            });
        });
    }
    
    async set(key, data, ttl) {
        await db.run('INSERT OR REPLACE INTO cache VALUES (?, ?, ?)', 
            [key, JSON.stringify(data), Date.now() + ttl]);
    }
}
```

**Prós:**
- ? Persistente
- ? Sem dependências externas
- ? Consultas SQL poderosas

**Contras:**
- ? Mais lento que Redis
- ? Requer migração de dados

### **4. Cache em Arquivos (Simplificado)**
```javascript
// Já criado: simple-drive-cache.js
const SimpleDriveCache = require('./simple-drive-cache');
const cache = new SimpleDriveCache({ ttlMs: 7200000 });
```

**Prós:**
- ? Sem dependências
- ? Fácil implementar
- ? Persistente

**Contras:**
- ? Lento para muitos arquivos
- ? Não compartilhado

### **5. Cache em Nuvem (AWS S3)**
```bash
npm install @aws-sdk/client-s3
```

```javascript
const { S3Client, PutObject, GetObject } = require('@aws-sdk/client-s3');

class S3Cache {
    constructor() {
        this.s3 = new S3Client({ region: 'us-east-1' });
        this.bucket = 'meu-cache-bucket';
    }
    
    async get(key) {
        try {
            const result = await this.s3.send(new GetObject({
                Bucket: this.bucket,
                Key: key
            }));
            return JSON.parse(await result.Body.transformToString());
        } catch {
            return null;
        }
    }
    
    async set(key, data) {
        await this.s3.send(new PutObject({
            Bucket: this.bucket,
            Key: key,
            Body: JSON.stringify(data)
        }));
    }
}
```

**Prós:**
- ? Altamente disponível
- ? Escalável
- ? Compartilhado globalmente

**Contras:**
- ? Requer AWS account
- ? Custos por uso

### **6. Cache em Nuvem (Firebase)**
```bash
npm install firebase-admin
```

```javascript
const admin = require('firebase-admin');

class FirebaseCache {
    constructor() {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        this.db = admin.firestore();
    }
    
    async get(key) {
        const doc = await this.db.collection('cache').doc(key).get();
        return doc.exists ? doc.data() : null;
    }
    
    async set(key, data, ttl) {
        await this.db.collection('cache').doc(key).set({
            ...data,
            expires: Date.now() + ttl
        });
    }
}
```

**Prós:**
- ? Real-time
- ? Fácil configurar
- ? Free tier generoso

**Contras:**
- ? Requer Firebase project
- ? Limites de uso

## ? Recomendação

### **Para Desenvolvimento:**
```javascript
// Use o cache local existente
const FileCache = require('./file-cache');
```

### **Para Produção Pequena:**
```javascript
// Use SQLite para persistência simples
const SQLiteCache = require('./sqlite-cache');
```

### **Para Produção Grande:**
```javascript
// Use Redis para performance
const RedisCache = require('./redis-cache');
```

## ? Como Mudar de Cache

### **1. Atualizar constants/const.ts**
```typescript
export const CACHE_CONFIG = {
  TTL_MS: parseInt(process.env.CACHE_TTL_MS) || 7200000,
  TYPE: process.env.CACHE_TYPE || 'local', // 'local', 'redis', 'sqlite', 's3'
};
```

### **2. Modificar arquivos que usam cache**
```javascript
// Em cliente-anime-fire.js, extract-video.js, list-episodios-animes.js
const { TYPE } = require('../../../constants/const').CACHE_CONFIG;

let CacheClass;
switch (TYPE) {
  case 'redis':
    CacheClass = require('./redis-cache');
    break;
  case 'sqlite':
    CacheClass = require('./sqlite-cache');
    break;
  case 's3':
    CacheClass = require('./s3-cache');
    break;
  default:
    CacheClass = require('./file-cache');
}

this.fileCache = new CacheClass({ ttlMs: TTL_MS });
```

### **3. Configurar .env**
```env
CACHE_TYPE=local
# CACHE_TYPE=redis
# CACHE_TYPE=sqlite
# CACHE_TYPE=s3
```

## ? Comparação de Performance

| Tipo | Leitura | Escrita | Setup | Custo | Complexidade |
|------|---------|---------|-------|-------|--------------|
| Local | ~1ms | ~1ms | ? | ? | ? |
| Redis | ~0.5ms | ~0.5ms | ?? | ? | ?? |
| SQLite | ~5ms | ~10ms | ?? | ? | ?? |
| S3 | ~100ms | ~200ms | ??? | ?? | ??? |
| Firebase | ~50ms | ~100ms | ?? | ? | ?? |

## ? Implementação Imediata

**Para começar sem complicações:**

1. **Use o cache local existente** (já funcionando)
2. **Considere SQLite** se precisar de persistência
3. **Migre para Redis** quando tiver alto tráfego

**O cache atual (`file-cache.js`) já é robusto e suficiente para maioria dos casos!** ?
