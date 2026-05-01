import { AppState, PetData } from "@/interfaces/context";

export const DEFAULT_PET: PetData = {
    name: "Seu Pet",
    state: "egg",
    daysSinceLastRun: 0,
    totalDaysCompleted: 0,
    ownedItems: [],
};

export const INITIAL_STATE: AppState = {
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