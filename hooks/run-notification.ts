import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const NOTIFICATION_ID = "run-active";

// Categorias = grupos de botões de ação que aparecem na notificação.
// O Android/iOS usam o categoryIdentifier pra saber quais botões mostrar.
export const CATEGORY_RUNNING = "drirun-running";
export const CATEGORY_PAUSED = "drirun-paused";

// IDs das ações — o tracking.tsx escuta esses pra reagir aos cliques.
export const ACTION_PAUSE = "PAUSE";
export const ACTION_RESUME = "RESUME";
export const ACTION_FINISH = "FINISH";

let categoriesRegistered = false;

async function ensureCategories() {
    if (categoriesRegistered || Platform.OS === "web") return;

    try {
        await Notifications.setNotificationCategoryAsync(CATEGORY_RUNNING, [
            {
                identifier: ACTION_PAUSE,
                buttonTitle: "⏸ Pausar",
                options: { opensAppToForeground: false },
            },
            {
                identifier: ACTION_FINISH,
                buttonTitle: "🏁 Finalizar",
                options: { opensAppToForeground: true },
            },
        ]);

        await Notifications.setNotificationCategoryAsync(CATEGORY_PAUSED, [
            {
                identifier: ACTION_RESUME,
                buttonTitle: "▶ Continuar",
                options: { opensAppToForeground: false },
            },
            {
                identifier: ACTION_FINISH,
                buttonTitle: "🏁 Finalizar",
                options: { opensAppToForeground: true },
            },
        ]);

        categoriesRegistered = true;
    } catch (e) {
        console.warn("[Notif] Falha ao registrar categorias:", e);
    }
}

export interface RunNotificationPayload {
    durationSeconds: number;
    distanceMeters: number;
    isPaused: boolean;
}

function formatDuration(totalSeconds: number) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

export async function showRunNotification(payload: RunNotificationPayload) {
    if (Platform.OS === "web") return;

    await ensureCategories();

    const time = formatDuration(payload.durationSeconds);
    const km = (payload.distanceMeters / 1000).toFixed(2);

    const title = payload.isPaused
        ? "⏸ DriRun — Pausado"
        : "🏃 DriRun — Corrida ativa";
    const body = `${km} km · ${time}`;

    try {
        await Notifications.scheduleNotificationAsync({
            identifier: NOTIFICATION_ID,
            content: {
                title,
                body,
                // Sticky só faz sentido enquanto está rodando — quando pausa, deixa o usuário
                // poder limpar se quiser.
                sticky: !payload.isPaused,
                autoDismiss: false,
                // Sem som a cada update — senão buzina o tempo todo.
                sound: false,
                categoryIdentifier: payload.isPaused ? CATEGORY_PAUSED : CATEGORY_RUNNING,
                // Mantém a notificação como "ongoing" no Android — não pode ser dispensada
                // arrastando. Combina com sticky.
                priority: Notifications.AndroidNotificationPriority?.HIGH,
            },
            trigger: null, // dispara imediatamente
        });
    } catch (e) {
        console.warn("[Notif] Falha ao agendar notificação:", e);
    }
}

export async function dismissRunNotification() {
    if (Platform.OS === "web") return;

    try {
        await Notifications.dismissNotificationAsync(NOTIFICATION_ID);
    } catch (e) {
        // Se a notificação não foi apresentada, dismiss falha silenciosamente — ignoramos.
    }
}
