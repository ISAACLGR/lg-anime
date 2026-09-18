const ClienteAnimeFire = require('./cliente-anime-fire');
const clientAnimeFire = new ClienteAnimeFire();

class ApiFireAnime {
    // buildRequest(req) {
    //     const { busca, page = '1', letra, ano, score, classificacao } = params;
    //     const req = {
    //         params: {},
    //         query: {}
    //     };
    //     if (busca !== undefined) req.params.busca = busca;
    //     if (page !== undefined) req.params.page = page;
    //     if (letra) req.query.letra = letra;
    //     if (ano) req.query.ano = ano;
    //     if (score !== undefined) req.query.score = score;
    //     if (classificacao) req.query.classificacao = classificacao;
    //     return req;
    // }

    async pesquisar( req) {
        return await clientAnimeFire.resolveLinkAndFilter('pesquisar', req);
    }

    // async emLancamento(req) {
    //     const req = this.buildRequest(params);
    //     return await clientAnimeFire.resolveLinkAndFilter('em-lancamento', req);
    // }

    async emLancamento(req) {
        //const req = this.buildRequest(params);
        return await clientAnimeFire.resolveLinkAndFilter('em-lancamento', req);
    }


    async animesAtualizados(req) {
        return await clientAnimeFire.resolveLinkAndFilter('animes-atualizados', req);
    }

    async listaDeAnimesLegendados(req) {
        return await clientAnimeFire.resolveLinkAndFilter('lista-de-animes-legendados', req);
    }

    async listaDeAnimesDublados(req) {
        return await clientAnimeFire.resolveLinkAndFilter('lista-de-animes-dublados', req);
    }

    async getEpisodio(req) {
        return await clientAnimeFire.getEpisodio(req);
    }

    async extractVideo(req) {
        return await clientAnimeFire.extractVideo(req);
    }
    async prox(req) {
        return await clientAnimeFire.extractVideo(req);
    }

}

module.exports = ApiFireAnime;
