import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Tipos (mantidos) ──────────────────────────────────────────────────────────

export interface UserProfile {
  name: string;
  age: number;
  weight: number; // kg
  height: number; // cm
  sex: "male" | "female" | "other";
}

export interface RunRecord {
  id: string;
  date: string;
  duration: number;
  distance: number;
  pace: number;
  calories: number;
  route: Array<{ latitude: number; longitude: number }>;
}

export type PetState =
  | "egg"
  | "hatchling"
  | "young"
  | "adult"
  | "free"
  | "sad"
  | "depressed"
  | "dead"
  | "reborn";

export interface OwnedShopItem {
  id: string;
  equipped: boolean;
}

export interface PetData {
  name: string;
  state: PetState;
  daysSinceLastRun: number;
  totalDaysCompleted: number;
  ownedItems: OwnedShopItem[];
}

export interface NotificationSettings {
  enabled: boolean;
  hour: string | null;
}

export interface AppState {
  isOnboarded: boolean;
  profile: UserProfile | null;
  goalDays: number;
  goalStartDate: string | null;
  runs: RunRecord[];
  pet: PetData;
  hasRemovedAds: boolean;
  gems: number;
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
  console.log("[Reducer] Action:", action.type);
  switch (action.type) {
    case "LOAD_STATE":
      return {
        ...INITIAL_STATE,
        ...action.payload,
        isOnboarded: action.payload.isOnboarded ?? false,
        profile: action.payload.profile ?? null,
        goalDays: action.payload.goalDays ?? INITIAL_STATE.goalDays,
        goalStartDate: action.payload.goalStartDate ?? null,
        runs: action.payload.runs ?? [],
        pet: {
          ...DEFAULT_PET,
          ...(action.payload.pet ?? {}),
          ownedItems: action.payload.pet?.ownedItems ?? [],
        },
        notifications: action.payload.notifications ?? { enabled: false, hour: null },
      };

    case "COMPLETE_ONBOARDING":
      console.log("[Reducer] Onboarding concluído!");
      console.log({
        ...state,
        isOnboarded: true,
        profile: action.payload.profile,
        goalDays: action.payload.goalDays,
        goalStartDate: new Date().toISOString().split("T")[0],
        notifications: {
          enabled: action.payload.notificationsEnabled,
          hour: action.payload.notificationHour,
        },
      })
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

    case "EQUIP_SHOP_ITEM":
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

// ── Lógica do Pet ─────────────────────────────────────────────────────────────

export function calculatePetState(pet: PetData, goalDays: number): PetData {
  const { daysSinceLastRun, totalDaysCompleted } = pet;

  if (daysSinceLastRun >= 7) return { ...pet, state: "dead" };
  if (daysSinceLastRun >= 3) return { ...pet, state: "depressed" };
  if (daysSinceLastRun >= 1) return { ...pet, state: "sad" };

  if (pet.state === "dead" && daysSinceLastRun === 0) {
    return { ...pet, state: "reborn" };
  }

  if (totalDaysCompleted >= goalDays) return { ...pet, state: "adult" };
  if (totalDaysCompleted >= 8) return { ...pet, state: "young" };
  if (totalDaysCompleted >= 1) return { ...pet, state: "hatchling" };

  return { ...pet, state: "egg" };
}

export function hasRunToday(runs: RunRecord[]): boolean {
  const today = new Date().toISOString().split("T")[0];
  return runs.some((r) => r.date === today);
}

export function getTodayRun(runs: RunRecord[]): RunRecord | null {
  const today = new Date().toISOString().split("T")[0];
  return runs.find((r) => r.date === today) ?? null;
}

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
  isLoading: boolean;
  dispatch: React.Dispatch<Action>;
  saveState: (newState: AppState) => Promise<void>;
  refreshPetState: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);

  const saveStateToStorage = useCallback(async (stateToSave: AppState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      console.log("[AppContext] Estado salvo. isOnboarded:", stateToSave.isOnboarded);
    } catch (e) {
      console.error("[AppContext] Erro ao salvar estado:", e);
    }
  }, []);

  // Carrega o estado salvo
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);

        if (stored) {
          const parsed: AppState = JSON.parse(stored || "null");
          console.log("[AppContext] Dados parseados. isOnboarded:", parsed.isOnboarded, "profile:", !!parsed.profile);

          // Só considera válido se o onboarding foi concluído e o perfil existe
          if (parsed.isOnboarded && parsed.profile) {
            console.log("[AppContext] Estado válido, carregando...");
            dispatch({ type: "LOAD_STATE", payload: parsed });
          } else {
            console.log("[AppContext] Estado inválido ou incompleto, resetando para INITIAL_STATE.");
            // Se existiam dados mas não são válidos, sobrescreve com o estado inicial
            saveStateToStorage(INITIAL_STATE);
            dispatch({ type: "LOAD_STATE", payload: INITIAL_STATE });
          }
        } else {
          // Nenhum dado salvo → persiste o estado inicial
          console.log("[AppContext] Nenhum estado salvo. Persistindo INITIAL_STATE.");
          saveStateToStorage(INITIAL_STATE);
          dispatch({ type: "LOAD_STATE", payload: INITIAL_STATE });
        }
      } catch (e) {
        console.error("[AppContext] Erro ao carregar estado:", e);
        saveStateToStorage(INITIAL_STATE);
        dispatch({ type: "LOAD_STATE", payload: INITIAL_STATE });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Persiste sempre que o estado muda (após carregamento inicial)
  useEffect(() => {
    if (!isLoading) {
      saveStateToStorage(state);
    }
  }, [state, isLoading, saveStateToStorage]);

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
    <AppContext.Provider
      value={{ state, dispatch, saveState: saveStateToStorage, refreshPetState, isLoading }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}