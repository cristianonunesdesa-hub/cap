import { PortfolioStatus } from "../types";

export interface MessageTemplate {
  id: string;
  text: string;
  category: 'active' | 'risk' | 'prospecting' | 'monitoring';
}

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  // --- EM RISCO (AT_RISK) ---
  {
    id: 'risk_1',
    category: 'risk',
    text: "Olá [Nome], tudo bem? Notei que faz um tempinho que não nos falamos. O estoque está em dia? Chegaram novidades que acho que têm a cara da sua loja!"
  },
  {
    id: 'risk_2',
    category: 'risk',
    text: "Oi [Nome]! Estava revisando minha carteira e vi que sua última compra foi há quase dois meses. Precisa de alguma reposição urgente?"
  },
  {
    id: 'risk_3',
    category: 'risk',
    text: "[Nome], bom dia! Tudo certo por aí? Estou fechando alguns pedidos hoje e lembrei de você. Quer aproveitar o envio?"
  },
  {
    id: 'risk_4',
    category: 'risk',
    text: "Fala [Nome]! Como estão as vendas? Faz um tempo que não renovamos seu mix. Vamos agendar uma reposição?"
  },
  {
    id: 'risk_5',
    category: 'risk',
    text: "Olá [Nome], sumiu! Tenho algumas condições especiais para clientes antigos essa semana. Me chama se precisar de algo."
  },
  {
    id: 'risk_6',
    category: 'risk',
    text: "Oi [Nome]! Não deixe seu estoque furar. Faz um tempo desde o último pedido. Posso te mandar o catálogo atualizado?"
  },
  {
    id: 'risk_7',
    category: 'risk',
    text: "[Nome], tudo bem? Estou organizando a rota de entregas da semana. Precisa de algo para aproveitar o frete?"
  },
  {
    id: 'risk_8',
    category: 'risk',
    text: "Ei [Nome], lembrei da sua loja hoje. Chegou aquele produto que costuma sair bem aí. Quer dar uma olhada?"
  },
  {
    id: 'risk_9',
    category: 'risk',
    text: "Bom dia [Nome]! Faz tempo que não conversamos. Como está o movimento? Se precisar repor algo, estou à disposição."
  },
  {
    id: 'risk_10',
    category: 'risk',
    text: "[Nome], atenção ao estoque! Vi aqui que faz um tempinho da última compra. Vamos garantir os produtos antes que acabem?"
  },

  // --- PROSPECÇÃO / RECUPERAÇÃO (PROSPECTING) ---
  {
    id: 'prosp_1',
    category: 'prospecting',
    text: "Olá [Nome], faz muito tempo! Senti sua falta por aqui. Estamos com uma coleção nova incrível. Topa dar uma olhada sem compromisso?"
  },
  {
    id: 'prosp_2',
    category: 'prospecting',
    text: "Oi [Nome], tudo bem? Faz tempo que não fechamos negócio. Tenho uma condição especial para reativar seu cadastro hoje. O que acha?"
  },
  {
    id: 'prosp_3',
    category: 'prospecting',
    text: "[Nome], a saudade bateu! rs. Como estão as coisas na loja? Vamos retomar nossa parceria? Tenho novidades."
  },
  {
    id: 'prosp_4',
    category: 'prospecting',
    text: "Olá [Nome]! Revisei nossos clientes antigos e vi que você não compra há um tempo. Aconteceu algo? Gostaria muito de te atender novamente."
  },
  {
    id: 'prosp_5',
    category: 'prospecting',
    text: "Oi [Nome], sei que a correria é grande, mas não esqueci de você. Chegaram produtos com margem ótima para revenda. Vamos conversar?"
  },
  {
    id: 'prosp_6',
    category: 'prospecting',
    text: "Fala [Nome]! O mercado mudou bastante desde nossa última conversa. Tenho produtos novos que estão girando muito rápido. Quer ver?"
  },
  {
    id: 'prosp_7',
    category: 'prospecting',
    text: "[Nome], bom dia! Estou com uma meta de reativar parceiros importantes e lembrei de você. Consigo um desconto legal no primeiro pedido de retorno."
  },
  {
    id: 'prosp_8',
    category: 'prospecting',
    text: "Olá [Nome]. Vi que seu cadastro está inativo há um tempo. Queria entender o que houve e como posso te ajudar a vender mais hoje."
  },
  {
    id: 'prosp_9',
    category: 'prospecting',
    text: "Oi [Nome]! Lembra de mim? Continuo por aqui no atacado. Se precisar de cotação, me avisa, cubro qualquer oferta para te ter de volta!"
  },
  {
    id: 'prosp_10',
    category: 'prospecting',
    text: "[Nome], não deixe a concorrência sair na frente. Vamos renovar essa vitrine? Me chama para ver as novidades."
  },

  // --- ATIVO / MANUTENÇÃO (ACTIVE) ---
  {
    id: 'active_1',
    category: 'active',
    text: "Olá [Nome]! Passando só para saber se chegou tudo certinho no último pedido e se precisa de mais alguma coisa."
  },
  {
    id: 'active_2',
    category: 'active',
    text: "Oi [Nome]! Tudo bem? Vi uma novidade aqui que é a cara da sua loja e lembrei de você na hora."
  },
  {
    id: 'active_3',
    category: 'active',
    text: "Fala [Nome]! Como estão as vendas da semana? Se precisar de reposição rápida, conta comigo."
  },
  {
    id: 'active_4',
    category: 'active',
    text: "[Nome], bom dia! Estou separando uns pedidos aqui. O seu estoque está tranquilo ou quer aproveitar para incluir algo?"
  },
  {
    id: 'active_5',
    category: 'active',
    text: "Oi [Nome]! Só para avisar que a tabela de preços vai atualizar em breve. Se quiser garantir o preço antigo, me avisa hoje!"
  },
  {
    id: 'active_6',
    category: 'active',
    text: "Olá [Nome], tudo certo? Passando para desejar ótimas vendas e me colocar à disposição!"
  },
  {
    id: 'active_7',
    category: 'active',
    text: "[Nome], chegou reposição daquele item que você gosta. Vou segurar para você?"
  },
  {
    id: 'active_8',
    category: 'active',
    text: "Oi [Nome]! Vi que você comprou o produto X mês passado. O que achou da saída dele? Tenho um similar em promoção."
  },
  
  // --- ACOMPANHAMENTO (Outros Vendedores / Monitoring) ---
  {
    id: 'mon_1',
    category: 'monitoring',
    text: "Olá [Nome], aqui é da [Sua Empresa]. Vi que você já é nosso cliente. Gostaria de me apresentar e me colocar à disposição caso precise de algo urgente."
  },
  {
    id: 'mon_2',
    category: 'monitoring',
    text: "Oi [Nome]! Tudo bem? Sou o novo consultor aqui na região. Quando puder, gostaria de entender melhor como podemos melhorar seu atendimento."
  }
];

export const getTemplatesByStatus = (status: PortfolioStatus, ownerType: 'me' | 'other'): MessageTemplate[] => {
  if (ownerType === 'other') {
    return MESSAGE_TEMPLATES.filter(t => t.category === 'monitoring');
  }

  switch (status) {
    case PortfolioStatus.AT_RISK:
      return MESSAGE_TEMPLATES.filter(t => t.category === 'risk');
    case PortfolioStatus.PROSPECTING:
      return MESSAGE_TEMPLATES.filter(t => t.category === 'prospecting');
    case PortfolioStatus.ACTIVE:
    default:
      return MESSAGE_TEMPLATES.filter(t => t.category === 'active');
  }
};