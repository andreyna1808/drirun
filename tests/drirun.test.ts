/**
 * drirun.test.ts
 * Testes unitários para as funções principais do DriRun.
 * Testa lógica de negócio: cálculos de corrida, estado do pet e IMC.
 */
import { describe, it, expect } from "vitest";

// ─── Funções de cálculo (copiadas dos módulos) ────────────────────────────────

/** Calcula distância em metros entre dois pontos GPS (Haversine) */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Estima calorias: MET × peso(kg) × tempo(h) */
function estimateCalories(weightKg: number, durationSeconds: number, met = 8.0): number {
  const hours = durationSeconds / 3600;
  return Math.round(met * weightKg * hours);
}

/** Formata segundos em MM:SS */
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Calcula IMC */
function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/** Retorna categoria de IMC */
function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return "Abaixo do peso";
  if (bmi < 25) return "Peso normal";
  if (bmi < 30) return "Sobrepeso";
  if (bmi < 35) return "Obesidade Grau I";
  if (bmi < 40) return "Obesidade Grau II";
  return "Obesidade Grau III";
}

// ─── Lógica do Pet ────────────────────────────────────────────────────────────

type PetState = "egg" | "hatchling" | "young" | "adult" | "free" | "sad" | "depressed" | "dead" | "reborn";

interface PetData {
  name: string;
  state: PetState;
  daysSinceLastRun: number;
  totalDaysCompleted: number;
}

function calculatePetState(pet: PetData, goalDays: number): PetData {
  const { daysSinceLastRun, totalDaysCompleted } = pet;
  if (pet.state === "dead" && daysSinceLastRun === 0) return { ...pet, state: "reborn" };
  if (daysSinceLastRun >= 7) return { ...pet, state: "dead" };
  if (daysSinceLastRun >= 3) return { ...pet, state: "depressed" };
  if (daysSinceLastRun >= 1) return { ...pet, state: "sad" };
  if (totalDaysCompleted >= goalDays) return { ...pet, state: "free" };
  if (totalDaysCompleted >= 21) return { ...pet, state: "adult" };
  if (totalDaysCompleted >= 8) return { ...pet, state: "young" };
  if (totalDaysCompleted >= 1) return { ...pet, state: "hatchling" };
  return { ...pet, state: "egg" };
}

/** Validação de meta de dias */
function validateGoalDays(value: number): number {
  if (isNaN(value) || value < 1) return 30;
  if (value > 365) return 365;
  return value;
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("Cálculos de corrida", () => {
  it("calcula distância Haversine corretamente entre dois pontos próximos", () => {
    // Dois pontos em Natal/RN separados por ~1km
    const dist = haversineDistance(-5.795, -35.209, -5.804, -35.209);
    expect(dist).toBeGreaterThan(900);
    expect(dist).toBeLessThan(1100);
  });

  it("retorna 0 para pontos idênticos", () => {
    const dist = haversineDistance(-5.795, -35.209, -5.795, -35.209);
    expect(dist).toBe(0);
  });

  it("estima calorias corretamente para 30 min de corrida com 70kg", () => {
    // MET 8.0 × 70kg × 0.5h = 280 kcal
    const kcal = estimateCalories(70, 1800, 8.0);
    expect(kcal).toBe(280);
  });

  it("formata duração corretamente", () => {
    expect(formatDuration(90)).toBe("01:30");
    expect(formatDuration(3661)).toBe("1:01:01");
    expect(formatDuration(0)).toBe("00:00");
  });
});

describe("Cálculo de IMC", () => {
  it("calcula IMC corretamente", () => {
    const bmi = calculateBMI(70, 175);
    expect(bmi).toBeCloseTo(22.86, 1);
  });

  it("classifica IMC corretamente", () => {
    expect(getBMICategory(17.0)).toBe("Abaixo do peso");
    expect(getBMICategory(22.0)).toBe("Peso normal");
    expect(getBMICategory(27.0)).toBe("Sobrepeso");
    expect(getBMICategory(32.0)).toBe("Obesidade Grau I");
    expect(getBMICategory(37.0)).toBe("Obesidade Grau II");
    expect(getBMICategory(42.0)).toBe("Obesidade Grau III");
  });
});

describe("Estado do Pet Fênix", () => {
  const basePet: PetData = {
    name: "Fênix",
    state: "egg",
    daysSinceLastRun: 0,
    totalDaysCompleted: 0,
  };

  it("começa como ovo sem dias concluídos", () => {
    const result = calculatePetState(basePet, 30);
    expect(result.state).toBe("egg");
  });

  it("evolui para filhote após 1 dia concluído", () => {
    const result = calculatePetState({ ...basePet, totalDaysCompleted: 1 }, 30);
    expect(result.state).toBe("hatchling");
  });

  it("evolui para jovem após 8 dias concluídos", () => {
    const result = calculatePetState({ ...basePet, totalDaysCompleted: 8 }, 30);
    expect(result.state).toBe("young");
  });

  it("evolui para adulto após 21 dias concluídos", () => {
    const result = calculatePetState({ ...basePet, totalDaysCompleted: 21 }, 30);
    expect(result.state).toBe("adult");
  });

  it("fica livre quando meta é atingida", () => {
    const result = calculatePetState({ ...basePet, totalDaysCompleted: 30 }, 30);
    expect(result.state).toBe("free");
  });

  it("fica triste após 1 dia sem correr", () => {
    const result = calculatePetState({ ...basePet, daysSinceLastRun: 1, totalDaysCompleted: 5 }, 30);
    expect(result.state).toBe("sad");
  });

  it("fica deprimido após 3 dias sem correr", () => {
    const result = calculatePetState({ ...basePet, daysSinceLastRun: 3, totalDaysCompleted: 5 }, 30);
    expect(result.state).toBe("depressed");
  });

  it("morre após 7 dias sem correr", () => {
    const result = calculatePetState({ ...basePet, daysSinceLastRun: 7, totalDaysCompleted: 5 }, 30);
    expect(result.state).toBe("dead");
  });

  it("renasce das cinzas quando volta a correr após morte", () => {
    const deadPet: PetData = { ...basePet, state: "dead", daysSinceLastRun: 0, totalDaysCompleted: 5 };
    const result = calculatePetState(deadPet, 30);
    expect(result.state).toBe("reborn");
  });
});

describe("Validação de meta de dias", () => {
  it("retorna 30 como padrão para valores inválidos", () => {
    expect(validateGoalDays(NaN)).toBe(30);
    expect(validateGoalDays(0)).toBe(30);
    expect(validateGoalDays(-5)).toBe(30);
  });

  it("limita ao máximo de 365 dias", () => {
    expect(validateGoalDays(400)).toBe(365);
    expect(validateGoalDays(365)).toBe(365);
  });

  it("aceita valores válidos entre 1 e 365", () => {
    expect(validateGoalDays(30)).toBe(30);
    expect(validateGoalDays(1)).toBe(1);
    expect(validateGoalDays(100)).toBe(100);
  });
});

// ── Testes v2.0: Sistema de Gemas ────────────────────────────────────────────

function gemsPerRun(watchedAd: boolean): number {
  return watchedAd ? 25 + 50 : 25;
}

function canBuyItem(gems: number, cost: number, alreadyOwned: boolean): boolean {
  return !alreadyOwned && gems >= cost;
}

describe("Sistema de Gemas", () => {
  it("deve dar 25 gemas por corrida sem anúncio", () => {
    expect(gemsPerRun(false)).toBe(25);
  });
  it("deve dar 75 gemas por corrida com anúncio assistido", () => {
    expect(gemsPerRun(true)).toBe(75);
  });
  it("deve permitir compra com gemas suficientes", () => {
    expect(canBuyItem(100, 70, false)).toBe(true);
  });
  it("deve bloquear compra com gemas insuficientes", () => {
    expect(canBuyItem(50, 70, false)).toBe(false);
  });
  it("deve bloquear compra de item já possuído", () => {
    expect(canBuyItem(500, 70, true)).toBe(false);
  });
  it("deve permitir compra exata com saldo igual ao custo", () => {
    expect(canBuyItem(70, 70, false)).toBe(true);
  });
});
