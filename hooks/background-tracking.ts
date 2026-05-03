import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import { showRunNotification } from "./run-notification";

export const BACKGROUND_LOCATION_TASK = "DRIRUN_BACKGROUND_LOCATION";

// Callback para comunicar localização com a tela ativa
let onLocationUpdate: ((coords: { latitude: number; longitude: number }) => void) | null = null;

// ── Controle de tempo no nível do módulo ───────────────────────────────────
// Precisa ficar aqui (fora do React) porque a background task roda no mesmo
// runtime JS, mas não tem acesso a refs/state de componentes.
let runStartTime: number = 0;
let totalPausedMs: number = 0;
let pauseStartTime: number = 0;
let isBgPaused: boolean = false;
let bgDistanceMeters: number = 0;

export function setLocationUpdateCallback(
    cb: ((coords: { latitude: number; longitude: number }) => void) | null
) {
    onLocationUpdate = cb;
}

/** Chame ao iniciar a corrida — zera todos os contadores. */
export function initRunTimer() {
    runStartTime = Date.now();
    totalPausedMs = 0;
    pauseStartTime = 0;
    isBgPaused = false;
    bgDistanceMeters = 0;
}

/** Chame ao pausar — registra o instante de início da pausa. */
export function pauseRunTimer() {
    if (!isBgPaused) {
        isBgPaused = true;
        pauseStartTime = Date.now();
    }
}

/** Chame ao retomar — acumula o tempo pausado e limpa o marcador. */
export function resumeRunTimer() {
    if (isBgPaused && pauseStartTime > 0) {
        totalPausedMs += Date.now() - pauseStartTime;
        pauseStartTime = 0;
        isBgPaused = false;
    }
}

/** Mantém a distância sincronizada para a notificação de background poder usá-la. */
export function updateBgDistance(meters: number) {
    bgDistanceMeters = meters;
}

/**
 * Retorna os segundos decorridos desde o início, descontando pausas.
 * Funciona em qualquer contexto — foreground, background, ou dentro da task.
 */
export function getElapsedSeconds(): number {
    if (runStartTime === 0) return 0;
    const pausedSoFar = isBgPaused
        ? totalPausedMs + (Date.now() - pauseStartTime)
        : totalPausedMs;
    return Math.max(0, Math.floor((Date.now() - runStartTime - pausedSoFar) / 1000));
}

// ── Background Task ────────────────────────────────────────────────────────
// Define a task no nível raiz (fora de componentes) — obrigatório pelo expo-task-manager.
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: { data: any; error: any }) => {
    if (error) {
        console.error("[BG Task] Erro:", error);
        return;
    }
    if (!data) return;

    const { locations } = data as { locations: Location.LocationObject[] };
    const loc = locations[0];
    if (!loc) return;

    const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
    };

    // Avisa a tela ativa (quando estiver em foreground) sobre a nova posição
    if (onLocationUpdate) {
        onLocationUpdate(coords);
    }

    // Atualiza a notificação diretamente da task — isso é o que mantém o
    // cronômetro e a distância atualizados com a tela apagada.
    if (runStartTime > 0) {
        await showRunNotification({
            durationSeconds: getElapsedSeconds(),
            distanceMeters: bgDistanceMeters,
            isPaused: isBgPaused,
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
