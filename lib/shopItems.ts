/**
 * shopItems.ts
 * Catalogo de itens disponiveis na loja do Pet Shop do DriRun.
 * Cada item tem um preco em gemas, categoria e emoji representativo.
 */

export type ShopCategory = "outfit" | "accessory" | "background" | "furniture" | "color";

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  emoji: string;           // emoji representativo do item
  category: ShopCategory;
  cost: number;            // preco em gemas
  rarity: "common" | "rare" | "epic" | "legendary";
}

/** Todos os itens disponíveis na loja */
export const SHOP_ITEMS: ShopItem[] = [
  // ── Roupas / Outfits ────────────────────────────────────────────────────────
  {
    id: "outfit_runner",
    name: "Roupa de Corredor",
    description: "Um look esportivo perfeito para treinos!",
    emoji: "👟",
    category: "outfit",
    cost: 70,
    rarity: "common",
  },
  {
    id: "outfit_ninja",
    name: "Roupa Ninja",
    description: "Corra nas sombras com estilo.",
    emoji: "🥷",
    category: "outfit",
    cost: 150,
    rarity: "rare",
  },
  {
    id: "outfit_superhero",
    name: "Capa de Super-Herói",
    description: "Voe mais rápido do que o vento!",
    emoji: "🦸",
    category: "outfit",
    cost: 280,
    rarity: "epic",
  },
  {
    id: "outfit_golden",
    name: "Armadura Dourada",
    description: "Digna de uma Fênix lendária.",
    emoji: "🏆",
    category: "outfit",
    cost: 500,
    rarity: "legendary",
  },

  // ── Acessórios ──────────────────────────────────────────────────────────────
  {
    id: "acc_crown",
    name: "Coroa",
    description: "Seja a realeza das corridas.",
    emoji: "👑",
    category: "accessory",
    cost: 120,
    rarity: "rare",
  },
  {
    id: "acc_glasses",
    name: "Óculos Estilosos",
    description: "Proteja os olhos com muito estilo.",
    emoji: "🕶️",
    category: "accessory",
    cost: 80,
    rarity: "common",
  },
  {
    id: "acc_hat",
    name: "Chapéu de Aventureiro",
    description: "Para explorar novos caminhos.",
    emoji: "🎩",
    category: "accessory",
    cost: 100,
    rarity: "common",
  },
  {
    id: "acc_medal",
    name: "Medalha de Ouro",
    description: "Mostre suas conquistas!",
    emoji: "🥇",
    category: "accessory",
    cost: 200,
    rarity: "epic",
  },
  {
    id: "acc_wings",
    name: "Asas de Fênix",
    description: "Asas douradas que brilham no sol.",
    emoji: "🪽",
    category: "accessory",
    cost: 450,
    rarity: "legendary",
  },

  // ── Fundos / Backgrounds ────────────────────────────────────────────────────
  {
    id: "bg_forest",
    name: "Floresta Encantada",
    description: "Corra entre as árvores mágicas.",
    emoji: "🌲",
    category: "background",
    cost: 90,
    rarity: "common",
  },
  {
    id: "bg_beach",
    name: "Praia ao Pôr do Sol",
    description: "Areia, mar e muito treino.",
    emoji: "🏖️",
    category: "background",
    cost: 90,
    rarity: "common",
  },
  {
    id: "bg_mountain",
    name: "Pico da Montanha",
    description: "Vista incrível do topo.",
    emoji: "🏔️",
    category: "background",
    cost: 130,
    rarity: "rare",
  },
  {
    id: "bg_space",
    name: "Galáxia Infinita",
    description: "Corra entre as estrelas.",
    emoji: "🌌",
    category: "background",
    cost: 350,
    rarity: "epic",
  },
  {
    id: "bg_volcano",
    name: "Vulcão da Fênix",
    description: "O lar original da Fênix.",
    emoji: "🌋",
    category: "background",
    cost: 480,
    rarity: "legendary",
  },

  // ── Mobília / Furniture ─────────────────────────────────────────────────────
  {
    id: "fur_bed",
    name: "Caminha Confortável",
    description: "Para descansar após os treinos.",
    emoji: "🛏️",
    category: "furniture",
    cost: 100,
    rarity: "common",
  },
  {
    id: "fur_bowl",
    name: "Tigela Especial",
    description: "Alimentação de campeão.",
    emoji: "🍜",
    category: "furniture",
    cost: 80,
    rarity: "common",
  },
  {
    id: "fur_trophy",
    name: "Prateleira de Troféus",
    description: "Exiba suas conquistas.",
    emoji: "🏅",
    category: "furniture",
    cost: 160,
    rarity: "rare",
  },
  {
    id: "fur_fountain",
    name: "Fonte de Cristal",
    description: "Água pura para a Fênix.",
    emoji: "⛲",
    category: "furniture",
    cost: 240,
    rarity: "epic",
  },

  // ── Cores / Pintura ─────────────────────────────────────────────────────────
  {
    id: "color_blue",
    name: "Fênix Azul",
    description: "Chamas azuis de gelo.",
    emoji: "💙",
    category: "color",
    cost: 200,
    rarity: "rare",
  },
  {
    id: "color_purple",
    name: "Fênix Roxa",
    description: "Chamas místicas violetas.",
    emoji: "💜",
    category: "color",
    cost: 200,
    rarity: "rare",
  },
  {
    id: "color_green",
    name: "Fênix Esmeralda",
    description: "Chamas da natureza.",
    emoji: "💚",
    category: "color",
    cost: 250,
    rarity: "epic",
  },
  {
    id: "color_rainbow",
    name: "Fênix Arco-Íris",
    description: "Todas as cores do universo.",
    emoji: "🌈",
    category: "color",
    cost: 500,
    rarity: "legendary",
  },
];

/** Retorna a cor do badge de raridade */
export function getRarityColor(rarity: ShopItem["rarity"]): string {
  switch (rarity) {
    case "common":    return "#9CA3AF";
    case "rare":      return "#3B82F6";
    case "epic":      return "#8B5CF6";
    case "legendary": return "#F59E0B";
  }
}

/** Retorna o label de raridade em PT */
export function getRarityLabel(rarity: ShopItem["rarity"]): string {
  switch (rarity) {
    case "common":    return "Comum";
    case "rare":      return "Raro";
    case "epic":      return "Épico";
    case "legendary": return "Lendário";
  }
}
