/**
 * Teste Simples da AnimeFire API
 */

const BASE_URL = 'http://localhost:3002';

async function testAnimeFireAPI() {
  console.log('? Testando AnimeFire API...\n');
  
  try {
    // 1. Testar conexão
    console.log('1?? Testando conexão...');
    const response = await fetch(`${BASE_URL}/filter-service/stats`);
    
    if (response.ok) {
      console.log('   ? API está online');
      const stats = await response.json();
      console.log(`   Cache size: ${stats.cache?.size || 0}`);
    } else {
      console.log('   ? API offline');
      return;
    }
    
    // 2. Testar busca de animes
    console.log('\n2?? Buscando animes em lançamento...');
    const airingResponse = await fetch(`${BASE_URL}/em-lancamento`);
    const airingData = await airingResponse.json();
    
    console.log(`   Encontrados: ${airingData.results?.length || 0} animes`);
    
    if (airingData.results?.length > 0) {
      const anime = airingData.results[0];
      console.log(`   Exemplo: ${anime.title}`);
      console.log(`   Link: ${anime.link}`);
      
      // 3. Testar extração de vídeo
      console.log('\n3?? Testando extração de vídeo...');
      try {
        const videoResponse = await fetch(`${BASE_URL}/extract-video`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ episodeUrl: anime.link })
        });
        
        const videoData = await videoResponse.json();
        
        if (videoData.success) {
          console.log('   ? Vídeo extraído com sucesso!');
          console.log(`   Método: ${videoData.method}`);
          console.log(`   Qualidades: ${videoData.allQualities?.length || 0}`);
        } else {
          console.log('   ? Falha na extração de vídeo');
        }
      } catch (error) {
        console.log(`   ? Erro: ${error.message}`);
      }
    }
    
    // 4. Testar busca
    console.log('\n4?? Testando busca por "naruto"...');
    const searchResponse = await fetch(`${BASE_URL}/pesquisar/naruto`);
    const searchData = await searchResponse.json();
    console.log(`   Resultados: ${searchData.results?.length || 0}`);
    
    console.log('\n? Teste concluído!');
    
  } catch (error) {
    console.error('\n? Erro:', error.message);
  }
}

testAnimeFireAPI();
