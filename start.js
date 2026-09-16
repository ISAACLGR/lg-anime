#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Verificar se o .env existe
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.log('Criando arquivo .env...');
    const envContent = `# OAuth Configuration
OAUTH_SERVER_URL=http://localhost:3001

# Database
DATABASE_URL=mysql://user:password@localhost:3306/animefire

# Expo
EXPO_PORT=8082
EXPO_PUBLIC_API_URL=http://localhost:3000
`;
    fs.writeFileSync(envPath, envContent);
    console.log('Arquivo .env criado!');
}

// Definir porta do Expo para evitar conflito
const expoPort = '8082';

console.log('Iniciando AnimeFire API Cliente...');
console.log('');
console.log(`Backend: http://localhost:3000`);
console.log(`Frontend: http://localhost:${expoPort}`);
console.log('');
console.log('Pressione Ctrl+C para parar todos os serviços');
console.log('');

// Iniciar servidor backend
const serverProcess = spawn('pnpm', ['dev:server'], {
    stdio: 'inherit',
    shell: true,
    env: process.env
});

// Esperar um pouco e iniciar frontend
setTimeout(() => {
    const metroProcess = spawn('npx', ['expo', 'start', '--web', '--port', expoPort], {
        stdio: 'inherit',
        shell: true,
        env: { 
            ...process.env, 
            EXPO_USE_METRO_WORKSPACE_ROOT: '1'
        }
    });

    // Tratar encerramento do frontend
    metroProcess.on('close', (code) => {
        console.log(`Frontend finalizado com código ${code}`);
        serverProcess.kill('SIGINT');
        process.exit(code);
    });
}, 2000);

// Tratar encerramento
process.on('SIGINT', () => {
    console.log('\nEncerrando todos os serviços...');
    serverProcess.kill('SIGINT');
    process.exit(0);
});

serverProcess.on('close', (code) => {
    console.log(`Backend finalizado com código ${code}`);
    process.exit(code);
});
