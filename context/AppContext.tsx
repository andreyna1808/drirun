/**
 * AppContext.tsx
 * Contexto global do DriRun — gerencia perfil, corridas, meta, pet, gemas e shop.
 * Todos os dados sao persistidos localmente via AsyncStorage.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Tipos ─────────────────────────────────────────────────────────────────────

/** Perfil do usuario coletado no onboarding */
export interface UserProfile {
  name: string;
  age: number;
  weight: number; // kg
  height: number; // cm
  sex: "male" | "female" | "other";
}

/** Dados de uma corrida/caminhada concluida */
export interface RunRecord {
  id: string;
  date: string;       // ISO date string (YYYY-MM-DD)
  duration: number;   // segundos
  distance: number;   // metros
  pace: number;       // segundos por km
  calories: number;   // kcal estimadas
  route: Array<{ latitude: number; longitude: number }>;
}

/** Estado do pet Fenix */
export type PetState =
  | "egg"        // ainda nao comecou a correr
  | "hatchling"  // dias 1-7 concluidos
  | "young"      // dias 8-20 concluidos
  | "adult"      // dias 21-meta concluidos
  | "free"       // meta completa — Fenix livre!
  | "sad"        // 1-2 dias sem correr
  | "depressed"  // 3-6 dias sem correr
  | "dead"       // 7+ dias sem correr
  | "reborn";    // acabou de renascer das cinzas

/** Item da loja adquirido pelo usuario */
export interface OwnedShopItem {
  id: string;
  equipped: boolean;
}

/** Dados do pet Fenix */
export interface PetData {
  name: string;
  state: PetState;
  daysSinceLastRun: number;    // dias sem correr
  totalDaysCompleted: number;  // total de dias com corrida feita
  ownedItems: OwnedShopItem[]; // itens comprados na loja
}

/** Configuracoes de notificacao */
export interface NotificationSettings {
  enabled: boolean;
  hour: string | null; // "HH:MM" ou null
}

/** Estado global do app */
export interface AppState {
  isOnboarded: boolean;
  profile: UserProfile | null;
  goalDays: number;           // meta em dias (1-365)
  goalStartDate: string | null;
  runs: RunRecord[];
  pet: PetData;
  hasRemovedAds: boolean;
  gems: number;               // moeda virtual
  notifications: NotificationSettings;
}

// ── Estado inicial ────────────────────────────────────────────────────────────

const DEFAULT_PET: PetData = {
  name: "Meu Pet",
  state: "egg",
  daysSinceLastRun: 0,
  totalDaysCompleted: 0,
  ownedItems: [],
};

const INITIAL_STATE: AppState = {
  isOnboarded: false,
  profile: null,
  goalDays: 30,
  goalStartDate: null,
  runs: [],
  pet: DEFAULT_PET,
  hasRemovedAds: false,
  gems: 0,
  notifications: { enabled: false, hour: null },
};

// ── Actions ───────────────────────────────────────────────────────────────────

type Action =
  | { type: "LOAD_STATE"; payload: AppState }
  | {
      type: "COMPLETE_ONBOARDING";
      payload: {
        profile: UserProfile;
        goalDays: number;
        notificationsEnabled: boolean;
        notificationHour: string | null;
      };
    }
  | { type: "ADD_RUN"; payload: RunRecord }
  | { type: "UPDATE_PET"; payload: Partial<PetData> }
  | { type: "RENAME_PET"; payload: string }
  | { type: "BUY_SHOP_ITEM"; payload: { itemId: string; cost: number } }
  | { type: "EQUIP_SHOP_ITEM"; payload: { itemId: string; equip: boolean } }
  | { type: "REMOVE_ADS" }
  | { type: "ADD_GEMS"; payload: number }
  | { type: "SPEND_GEMS"; payload: number }
  | { type: "UPDATE_GOAL"; payload: { goalDays: number } }
  | { type: "UPDATE_PROFILE"; payload: UserProfile }
  | { type: "UPDATE_NOTIFICATIONS"; payload: NotificationSettings }
  | { type: "RESET_ALL" };

// ── Reducer ───────────────────────────────────────────────────────────────────

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "LOAD_STATE":
      // Garante compatibilidade com versoes antigas do estado salvo
      return {
        ...INITIAL_STATE,
        ...action.payload,
        pet: {
          ...DEFAULT_PET,
          ...(action.payload.pet ?? {}),
          ownedItems: action.payload.pet?.ownedItems ?? [],
        },
        notifications: action.payload.notifications ?? { enabled: false, hour: null },
      };

    case "COMPLETE_ONBOARDING":
      return {
        ...state,
        isOnboarded: true,
        profile: action.payload.profile,
        goalDays: action.payload.goalDays,
        goalStartDate: new Date().toISOString().split("T")[0],
        notifications: {
          enabled: action.payload.notificationsEnabled,
          hour: action.payload.notificationHour,
        },
      };

    case "ADD_RUN": {
      const newRuns = [...state.runs, action.payload];
      // Recalcula o estado do pet apos adicionar corrida
      const newPet = calculatePetState(
        {
          ...state.pet,
          daysSinceLastRun: 0,
          totalDaysCompleted: state.pet.totalDaysCompleted + 1,
        },
        state.goalDays
      );
      return { ...state, runs: newRuns, pet: newPet };
    }

    case "UPDATE_PET":
      return { ...state, pet: { ...state.pet, ...action.payload } };

    case "RENAME_PET":
      return { ...state, pet: { ...state.pet, name: action.payload } };

    case "BUY_SHOP_ITEM": {
      // Verifica se tem gemas suficientes e adiciona o item
      if (state.gems < action.payload.cost) return state;
      const alreadyOwned = state.pet.ownedItems.some((i) => i.id === action.payload.itemId);
      if (alreadyOwned) return state;
      return {
        ...state,
        gems: state.gems - action.payload.cost,
        pet: {
          ...state.pet,
          ownedItems: [...state.pet.ownedItems, { id: action.payload.itemId, equipped: false }],
        },
      };
    }

    case "EQUIP_SHOP_ITEM": {
      // Equipa ou desequipa um item do pet
      return {
        ...state,
        pet: {
          ...state.pet,
          ownedItems: state.pet.ownedItems.map((item) =>
            item.id === action.payload.itemId
              ? { ...item, equipped: action.payload.equip }
              : item
          ),
        },
      };
    }

    case "REMOVE_ADS":
      return { ...state, hasRemovedAds: true };

    case "ADD_GEMS":
      return { ...state, gems: state.gems + action.payload };

    case "SPEND_GEMS":
      return { ...state, gems: Math.max(0, state.gems - action.payload) };

    case "UPDATE_GOAL":
      return { ...state, goalDays: action.payload.goalDays };

    case "UPDATE_PROFILE":
      return { ...state, profile: action.payload };

    case "UPDATE_NOTIFICATIONS":
      return { ...state, notifications: action.payload };

    case "RESET_ALL":
      // Reseta todo o progresso mas mantem o perfil e idioma
      return {
        ...INITIAL_STATE,
        isOnboarded: true,
        profile: state.profile,
        notifications: state.notifications,
      };

    default:
      return state;
  }
}

// ── Logica do Pet ─────────────────────────────────────────────────────────────

/**
 * Calcula o estado visual da Fenix baseado nos dias concluidos e dias sem correr.
 * Esta e a unica funcao que determina o estado do pet — nao pode ser burlada.
 */
export function calculatePetState(pet: PetData, goalDays: number): PetData {
  const { daysSinceLastRun, totalDaysCompleted } = pet;

  // Se o pet estava morto e voltou a correr, ele renasce
  if (pet.state === "dead" && daysSinceLastRun === 0) {
    return { ...pet, state: "reborn" };
  }

  // Estados de tristeza/morte por inatividade
  if (daysSinceLastRun >= 7) return { ...pet, state: "dead" };
  if (daysSinceLastRun >= 3) return { ...pet, state: "depressed" };
  if (daysSinceLastRun >= 1) return { ...pet, state: "sad" };

  // Meta completa — Fenix livre!
  if (totalDaysCompleted >= goalDays) return { ...pet, state: "free" };

  // Evolucao por dias concluidos
  if (totalDaysCompleted >= 21) return { ...pet, state: "adult" };
  if (totalDaysCompleted >= 8)  return { ...pet, state: "young" };
  if (totalDaysCompleted >= 1)  return { ...pet, state: "hatchling" };

  return { ...pet, state: "egg" };
}

/** Verifica se o usuario ja correu hoje */
export function hasRunToday(runs: RunRecord[]): boolean {
  const today = new Date().toISOString().split("T")[0];
  return runs.some((r) => r.date === today);
}

/** Retorna a corrida de hoje, se existir */
export function getTodayRun(runs: RunRecord[]): RunRecord | null {
  const today = new Date().toISOString().split("T")[0];
  return runs.find((r) => r.date === today) ?? null;
}

/** Calcula quantos dias consecutivos sem correr */
export function calculateDaysSinceLastRun(runs: RunRecord[]): number {
  if (runs.length === 0) return 0;
  const today = new Date();
  const lastRun = runs.reduce((latest, r) => {
    const d = new Date(r.date);
    return d > latest ? d : latest;
  }, new Date(0));
  const diffMs = today.getTime() - lastRun.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// ── Context ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = "@drirun:state";

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  saveState: (newState: AppState) => Promise<void>;
  refreshPetState: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE);

  // Carrega o estado salvo ao iniciar o app
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: AppState = JSON.parse(stored);
          dispatch({ type: "LOAD_STATE", payload: parsed });
        }
      } catch (e) {
        console.error("Erro ao carregar estado:", e);
      }
    })();
  }, []);

  // Persiste o estado sempre que ele mudar
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((e) =>
      console.error("Erro ao salvar estado:", e)
    );
  }, [state]);

  /** Salva manualmente (util apos operacoes criticas) */
  const saveState = useCallback(async (newState: AppState) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  }, []);

  /** Atualiza o estado do pet baseado em quantos dias se passaram sem correr */
  const refreshPetState = useCallback(() => {
    const daysSince = calculateDaysSinceLastRun(state.runs);
    const updatedPet = calculatePetState(
      { ...state.pet, daysSinceLastRun: daysSince },
      state.goalDays
    );
    if (updatedPet.state !== state.pet.state || daysSince !== state.pet.daysSinceLastRun) {
      dispatch({ type: "UPDATE_PET", payload: updatedPet });
    }
  }, [state.runs, state.pet, state.goalDays]);

  return (
    <AppContext.Provider value={{ state, dispatch, saveState, refreshPetState }}>
      {children}
    </AppContext.Provider>
  );
}

/** Hook para acessar o contexto do app */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
