import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";

export const BACKGROUND_LOCATION_TASK = "DRIRUN_BACKGROUND_LOCATION";

// Callback para entregar coordenadas à tela ativa
let onLocationUpdate: ((coords: { latitude: number; longitude: number }) => void) | null = null;

export function setLocationUpdateCallback(
    cb: ((coords: { latitude: number; longitude: number }) => void) | null
) {
    onLocationUpdate = cb;
}

// ── Background Task ────────────────────────────────────────────────────────
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: { data: any; error: any }) => {
    if (error) { console.error("[BG Task] Erro:", error); return; }
    if (!data) return;

    const { locations } = data as { locations: Location.LocationObject[] };
    const loc = locations[0];
    if (!loc) return;

    if (onLocationUpdate) {
        onLocationUpdate({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
        });
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
        timeInterval: 1000,
        distanceInterval: 1,
        foregroundService: {
            notificationTitle: "DriRun está ativo 🏃",
            notificationBody: "Sua corrida está sendo rastreada.",
            notificationColor: "#0b044b",
        },
        showsBackgroundLocationIndicator: true,
    });

    return true;
}

export async function stopBackgroundLocation() {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    if (isRegistered) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
}
