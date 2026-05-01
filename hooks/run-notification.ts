import * as Notifications from "expo-notifications";

const NOTIFICATION_ID = "run-active";

export async function showRunNotification(durationSeconds: number) {
    const minutes = Math.floor(durationSeconds / 60).toString().padStart(2, "0");
    const seconds = (durationSeconds % 60).toString().padStart(2, "0");

    await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_ID,
        content: {
            title: "🏃 DriRun — Corrida ativa",
            body: `Tempo: ${minutes}:${seconds} — Continue assim!`,
            sticky: true,   // Android — não some ao deslizar
            autoDismiss: false,
            sound: true,
        },
        trigger: null, // dispara imediatamente
    });
}

export async function dismissRunNotification() {
    await Notifications.dismissNotificationAsync(NOTIFICATION_ID);
}