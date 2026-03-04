import { GoogleGenAI } from "@google/genai";
import { Customer, PortfolioStatus } from "../types";

export const generateReengagementMessage = async (
  customer: Customer,
  status: PortfolioStatus,
  daysSincePurchase: number
): Promise<string> => {
  
  // 1. Tenta pegar do .env (Desenvolvimento)
  let apiKey = process.env.API_KEY;

  // 2. Se não achar, tenta pegar do LocalStorage (Produção/Cliente Final)
  if (!apiKey || apiKey === "undefined") {
    apiKey = localStorage.getItem('wholesale_crm_api_key') || undefined;
  }

  if (!apiKey) {
    console.error("API Key not found");
    return "⚠️ CONFIGURAÇÃO NECESSÁRIA\n\nPara usar a Inteligência Artificial, você precisa configurar sua Chave de API.\n\nClique no ícone de engrenagem (⚙️) no topo da tela e cole sua chave.";
  }

  try {
    // Inicializa a IA apenas quando solicitado
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    let context = "";
    
    if (status === PortfolioStatus.PROSPECTING) {
      context = `O cliente já saiu da minha carteira pois faz ${daysSincePurchase} dias que não compra. Preciso tentar reativá-lo urgentemente. O tom deve ser de saudade e oportunidade.`;
    } else if (status === PortfolioStatus.AT_RISK) {
      context = `O cliente está prestes a sair da minha carteira. Faz ${daysSincePurchase} dias que não compra. Faltam poucos dias para atingir o limite de retenção. Preciso que ele compre logo para manter o relacionamento ativo.`;
    } else {
      context = `O cliente está ativo, faz ${daysSincePurchase} dias que não compra. É um contato de manutenção de relacionamento.`;
    }

    const prompt = `
      Aja como um vendedor de atacado experiente e amigável.
      Escreva uma mensagem curta para WhatsApp para o cliente abaixo.
      
      Dados do Cliente:
      Nome: ${customer.name}
      Empresa: ${customer.companyName || "N/A"}
      Dias sem comprar: ${daysSincePurchase}
      
      Objetivo: ${context}
      
      A mensagem deve:
      1. Ser informal mas profissional (estilo WhatsApp).
      2. Incluir uma saudação personalizada usando o nome do cliente.
      3. Perguntar se precisam de reposição de estoque ou apresentar alguma novidade/condição especial (não invente produtos específicos, fale de forma genérica sobre "novidades" ou "condições").
      4. Não use hashtags. Não use aspas na resposta. Apenas o texto da mensagem.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar a mensagem no momento.";
  } catch (error) {
    console.error("Erro ao gerar mensagem:", error);
    return "Erro ao conectar com a IA. Verifique nas configurações (⚙️) se sua chave de API está correta e ativa.";
  }
};