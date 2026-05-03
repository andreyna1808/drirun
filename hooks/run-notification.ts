import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import i18n from "@/lib/i18n";

const NOTIFICATION_ID      = "run-active";
const NOTIFICATION_CHANNEL = "run-tracking";

/**
 * Garante que o canal Android de baixa importância existe.
 * LOW = sem som, sem banner pop-up, mas aparece na gaveta e na tela de bloqueio.
 */
async function ensureChannel() {
    if (Platform.OS !== "android") return;
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL, {
        name: "Corrida ativa",
        importance: Notifications.AndroidImportance.LOW,
        sound: null,
        vibrationPattern: undefined,
        enableVibrate: false,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    }).catch((e) => console.warn("[Notif] canal run-tracking falhou:", e));
}

/**
 * Mostra (ou mantém visível) a notificação estática de corrida em andamento.
 * Não atualiza conteúdo dinamicamente — só avisa que a corrida está ativa.
 * Chame uma vez ao iniciar e novamente ao pausar/retomar para trocar o título.
 */
export async function showRunActiveNotification(isPaused = false) {
    if (Platform.OS === "web") return;
    await ensureChannel();
    try {
        await Notifications.scheduleNotificationAsync({
            identifier: NOTIFICATION_ID,
            content: {
                title: i18n.t(isPaused ? "run_tracking_paused_title" : "run_tracking_active_title"),
                body: i18n.t("run_tracking_body"),
                sound: false,
                autoDismiss: false,
                sticky: true,
                ...(Platform.OS === "android" ? { channelId: NOTIFICATION_CHANNEL } : {}),
            } as Notifications.NotificationContentInput,
            trigger: null,
        });
    } catch (e) {
        console.warn("[Notif] Falha ao mostrar notificação de corrida:", e);
    }
}

/** Remove a notificação de corrida ativa. */
export async function dismissRunActiveNotification() {
    if (Platform.OS === "web") return;
    try {
        await Notifications.dismissNotificationAsync(NOTIFICATION_ID);
    } catch (_) { /* silencioso */ }
}
