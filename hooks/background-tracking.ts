import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";

export const BACKGROUND_LOCATION_TASK = "DRIRUN_BACKGROUND_LOCATION";

// Armazena callbacks para comunicar com a tela ativa
let onLocationUpdate: ((coords: { latitude: number; longitude: number }) => void) | null = null;

export function setLocationUpdateCallback(
    cb: ((coords: { latitude: number; longitude: number }) => void) | null
) {
    onLocationUpdate = cb;
}

// Define a task — deve ser chamada no nível raiz do app (fora de componentes)
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: { data: any; error: any }) => {
    if (error) {
        console.error("[BG Task] Erro:", error);
        return;
    }
    if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        const loc = locations[0];
        if (loc && onLocationUpdate) {
            onLocationUpdate({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            });
        }
    }
});

export async function startBackgroundLocation() {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== "granted") {
        console.warn("[BG] Permissão de background negada");
        return false;
    }

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 5,
        foregroundService: {
            notificationTitle: "DriRun está ativo 🏃",
            notificationBody: "Sua corrida está sendo rastreada.",
            notificationColor: "#3B82F6",
        },
        showsBackgroundLocationIndicator: true, // iOS — bolinha azul
    });

    return true;
}

export async function stopBackgroundLocation() {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    if (isRegistered) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
}