import * as Notifications from "expo-notifications";

export const scheduleNotification = async (petName: string, userName: string, hour: number, minute: number) => {
    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
        await Notifications.scheduleNotificationAsync({
            content: {
                title: `${petName} está com saudade! 🐾`,
                body: `Vamos correr hoje, ${userName}?`,
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
                channelId: "default",
            },
        });
    } catch (e) {
        console.warn("Erro ao agendar notificação:", e);
    }
}