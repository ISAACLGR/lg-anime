/**
 * Teste de Integração Jikan + AnimeFire API
 * Script para testar a integração completa
 */

// Teste direto via HTTP requests
const BASE_URL = 'http://localhost:3002';

async function testAnimeFireIntegration() {
  console.log('? Testando AnimeFire API Integration...\n');
  
  try {
    // 1. Health Check
    console.log('1?? Health Check...');
    const isHealthy = await animeFireClient.healthCheck();
    console.log(`   Status: ${isHealthy ? '? Online' : '? Offline'}\n`);
    
    if (!isHealthy) {
      console.log('? AnimeFire API não está respondendo');
      return;
    }
    
    // 2. Testar busca de animes em lançamento
    console.log('2?? Buscando animes em lançamento...');
    const airingAnimes = await animeFireClient.getAiringAnimes(1);
    console.log(`   Encontrados: ${airingAnimes.results.length} animes`);
    
    if (airingAnimes.results.length > 0) {
      const firstAnime = airingAnimes.results[0];
      console.log(`   Primeiro: ${firstAnime.title}`);
      console.log(`   Link: ${firstAnime.link}\n`);
      
      // 3. Testar extração de vídeo
      console.log('3?? Testando extração de vídeo...');
      try {
        const videoResult = await animeFireClient.extractVideoUrl(firstAnime.link);
        if (videoResult.success) {
          console.log(`   ? Vídeo encontrado!`);
          console.log(`   Método: ${videoResult.method}`);
          console.log(`   Qualidades: ${videoResult.allQualities?.length || 0}`);
          if (videoResult.allQualities?.length > 0) {
            console.log(`   Qualidade principal: ${videoResult.allQualities[0].label}`);
          }
        } else {
          console.log(`   ? Vídeo não encontrado`);
          if (videoResult.errors) {
            console.log(`   Erros: ${videoResult.errors.join(', ')}`);
          }
        }
      } catch (error) {
        console.log(`   ? Erro na extração: ${error.message}`);
      }
    }
    
    // 4. Testar busca
    console.log('\n4?? Testando busca...');
    const searchResults = await animeFireClient.searchAnimes('naruto');
    console.log(`   Resultados para "naruto": ${searchResults.results.length}`);
    
    // 5. Testar estatísticas do cache
    console.log('\n5?? Estatísticas do cache...');
    const cacheStats = await animeFireClient.makeRequest('/filter-service/stats');
    console.log(`   Cache size: ${cacheStats.cache?.size || 0}`);
    console.log(`   Timeout: ${cacheStats.cache?.timeout || 0}s`);
    
    console.log('\n? Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('\n? Erro no teste:', error.message);
  }
}

// Executar teste
testAnimeFireIntegration();
