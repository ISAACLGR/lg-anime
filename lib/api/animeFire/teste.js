
const ApiFireAnime = require('./api-fire-anime');
const apiFireAnime = new ApiFireAnime();


// apiFireAnime.pesquisar({busca: 'a', page: '3'}).then(resultado => {
//     console.log(resultado);
// }).catch(error => {
//     console.error('Erro:', error);
// });


apiFireAnime.emLancamento().then(resultado => {
    console.log(resultado);
}).catch(error => {
    console.error('Erro:', error);
});

// apiFireAnime.animesAtualizados().then(resultado => {
//     console.log(resultado);
// }).catch(error => {
//     console.error('Erro:', error);
// });

// apiFireAnime.topAnimes().then(resultado => {
//     console.log(resultado);
// }).catch(error => {
//     console.error('Erro:', error);
// });

// apiFireAnime.getEpisodio({anime_link: 'https://animefire.io/animes/kill-ao-todos-os-episodios'}).then(resultado => {
//     console.log(resultado.episodes[0]);
// }).catch(error => {
//     console.error('Erro:', error);
// });

// apiFireAnime.extractVideo({url:'https://animefire.io/animes/kill-ao/1'} ).then(resultado => {
//     console.log(resultado);
// }).catch(error => {
//     console.error('Erro:', error);
// });


//

