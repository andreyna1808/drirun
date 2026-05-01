import * as Notifications from "expo-notifications";

export const cancelAllNotifications = async () => {
    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
        console.warn("Erro ao cancelar notificações:", e);
    }
}
