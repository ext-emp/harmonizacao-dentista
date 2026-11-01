// Monta, a partir de src/dados/doutor.js, os valores prontos que o HTML usa
// (nome completo, linha do CRO, link do WhatsApp, link do mapa etc.).
import { PENDENTE } from './util.js';

// Endereço completo numa linha só, sem os trechos ainda pendentes.
function enderecoEmLinha(e) {
  return [e.logradouro, e.complemento, e.bairro, `${e.cidade}/${e.uf}`, e.cep]
    .filter((parte) => parte && !parte.includes(PENDENTE))
    .join(', ');
}

export function montarContexto(doutor) {
  const nomeCompleto = `${doutor.tratamento} ${doutor.nome}`;
  const cro = `CRO-${doutor.cro.uf} nº ${doutor.cro.numero}`;
  const texto = encodeURIComponent(doutor.whatsapp.mensagem);
  const numero = String(doutor.whatsapp.numero || '').replace(/\D/g, '');
  const linkWhatsapp = numero ? `https://wa.me/${numero}?text=${texto}` : `https://wa.me/?text=${texto}`;
  const e = doutor.endereco;
  const busca = enderecoEmLinha(e) || `${e.cidade}, ${e.uf}`;
  const mapa = e.mapa || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(busca)}`;
  const siteUrl = (doutor.site.url || '').replace(/\/$/, '');

  return {
    doutor,
    nomeCompleto,
    cro,
    // Assinatura do rodapé, exigida pelo CFO.
    assinatura: `${nomeCompleto} · ${doutor.profissao} · ${cro}`,
    // Marca discreta sobre as fotos de antes e depois.
    marcaFoto: `${nomeCompleto} · ${cro}`,
    whatsapp: {
      link: linkWhatsapp,
      exibicao: doutor.whatsapp.exibicao,
      temNumero: Boolean(numero),
    },
    endereco: {
      ...e,
      linha1: [e.logradouro, e.complemento].filter(Boolean).join(', '),
      linha2: `${e.bairro} · ${e.cidade}/${e.uf}`,
      cidadeUf: `${e.cidade}/${e.uf}`,
      mapa,
    },
    instagram: {
      usuario: doutor.instagram.usuario,
      arroba: `@${doutor.instagram.usuario}`,
      url: `https://www.instagram.com/${doutor.instagram.usuario}/`,
    },
    horarios: doutor.horarios,
    site: { url: siteUrl, temUrl: Boolean(siteUrl) },
    ano: new Date().getFullYear(),
  };
}
