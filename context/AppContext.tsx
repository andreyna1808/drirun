import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, NotificationSettings, PetData, RunRecord, UserProfile } from "@/interfaces/context";
import { DEFAULT_PET, INITIAL_STATE } from "@/utils/context";
import { getLocalDateString } from "@/utils/tracking";

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

// ── Validação de profile ─────────────────────────────────────────────────────
// Garante que NUNCA marcamos isOnboarded: true com perfil corrompido (NaN no
// AsyncStorage vira null/string, e parseFloat("") vira NaN — tudo isso volta aqui).
export function isProfileValid(
  profile: UserProfile | null | undefined
): profile is UserProfile {
  if (!profile) return false;
  if (typeof profile.name !== "string" || !profile.name.trim()) return false;
  if (typeof profile.age !== "number" || !Number.isFinite(profile.age) || profile.age < 1) return false;
  if (typeof profile.height !== "number" || !Number.isFinite(profile.height) || profile.height < 1) return false;
  if (typeof profile.weight !== "number" || !Number.isFinite(profile.weight) || profile.weight < 1) return false;
  if (profile.sex !== "male" && profile.sex !== "female") return false;
  return true;
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function appReducer(state: AppState, action: Action): AppState {
  console.log("[Reducer] Action:", action.type);
  switch (action.type) {
    case "LOAD_STATE": {
      // Mesmo que o storage diga isOnboarded: true, se o profile gravado está
      // corrompido a gente *desfaz* o flag — o usuário cai no onboarding de novo.
      const profileOk = isProfileValid(action.payload.profile ?? null);
      const onboardedFromPayload = action.payload.isOnboarded ?? false;
      if (onboardedFromPayload && !profileOk) {
        console.warn(
          "[Reducer] LOAD_STATE com isOnboarded:true mas profile inválido — voltando pro onboarding.",
          action.payload.profile
        );
      }
      return {
        ...INITIAL_STATE,
        ...action.payload,
        isOnboarded: onboardedFromPayload && profileOk,
        profile: profileOk ? action.payload.profile! : null,
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
    }

    case "COMPLETE_ONBOARDING": {
      // Bloqueia onboarding com lixo. O onboarding screen tem validação por step,
      // mas o botão "Próximo" do rodapé pode chamar handleFinish sem passar por ela.
      if (!isProfileValid(action.payload.profile)) {
        console.warn(
          "[Reducer] COMPLETE_ONBOARDING ignorado — profile inválido:",
          action.payload.profile
        );
        return state; // mantém estado atual; usuário continua no onboarding
      }

      console.log("[Reducer] Onboarding concluído!");
      return {
        ...state,
        isOnboarded: true,
        profile: action.payload.profile,
        goalDays: action.payload.goalDays,
        goalStartDate: getLocalDateString(),
        notifications: {
          enabled: action.payload.notificationsEnabled,
          hour: action.payload.notificationHour,
        },
      };
    }

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
  const today = getLocalDateString();
  return runs.some((r) => r.date === today);
}

export function getTodayRun(runs: RunRecord[]): RunRecord | null {
  const today = getLocalDateString();
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

          // Só considera válido se o onboarding foi concluído E o perfil é íntegro.
          // isProfileValid checa NaN, strings vazias, sex em branco, etc.
          if (parsed.isOnboarded && isProfileValid(parsed.profile)) {
            console.log("[AppContext] Estado válido, carregando...");
            dispatch({ type: "LOAD_STATE", payload: parsed });
          } else {
            console.log("[AppContext] Estado inválido ou perfil corrompido, resetando para INITIAL_STATE.", parsed.profile);
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