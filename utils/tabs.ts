export const MOTIVATIONAL_PHRASE_KEYS = [
    "home_motivational_1",
    "home_motivational_2",
    "home_motivational_3",
    "home_motivational_4",
    "home_motivational_5",
    "home_motivational_6",
    "home_motivational_7",
    "home_motivational_8",
    "home_motivational_9",
    "home_motivational_10",
];

export const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}min`;
    if (m > 0) return `${m}min ${String(s).padStart(2, "0")}s`;
    return `${s}s`;
}

export const formatPace = (paceSecondsPerKm: number): string => {
    if (!isFinite(paceSecondsPerKm) || paceSecondsPerKm <= 0) return "--:--";
    const m = Math.floor(paceSecondsPerKm / 60);
    const s = Math.round(paceSecondsPerKm % 60);
    return `${m}'${String(s).padStart(2, "0")}s`;
}

export const calculateStreak = (runs: Array<{ date: string }>): number => {
    if (runs.length === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    const checkDate = new Date(today);
    while (true) {
        const dateStr = checkDate.toISOString().split("T")[0];
        const hasRun = runs.some((r) => r.date === dateStr);
        if (!hasRun) break;
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
}