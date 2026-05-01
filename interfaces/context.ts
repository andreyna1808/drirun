export interface UserProfile {
    name: string;
    age: number;
    weight: number; // kg
    height: number; // cm
    sex: "male" | "female";
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
