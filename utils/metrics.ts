import { RunRecord } from "@/interfaces/context";
import { FilterPeriod, IChartDataPoint } from "@/interfaces/metrics";
import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");
export const CHART_WIDTH = width - 48;
export const CHART_HEIGHT = 180;
export const PADDING = { top: 16, right: 16, bottom: 32, left: 48 };

export const formatPaceShort = (paceSecondsPerKm: number): string => {
    if (!paceSecondsPerKm || paceSecondsPerKm <= 0) return "--:--";
    const m = Math.floor(paceSecondsPerKm / 60);
    const s = Math.round(paceSecondsPerKm % 60);
    return `${m}:${s.toString().padStart(2, "0")}min /km`;
};

export const formatDurationShort = (totalSeconds: number): string => {
    if (!totalSeconds || totalSeconds <= 0) return "--:--";
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")} min`;
};

export const getLocale = (language: string): string => {
    switch (language) {
        case "pt": return "pt-BR";
        case "en": return "en-US";
        case "es": return "es-ES";
        default: return "pt-BR";
    }
}

export const getLastNDays = (n: number): string[] => {
    const days: string[] = [];
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split("T")[0]);
    }
    return days;
}

export const getDayLabel = (dateStr: string, locale: string): string => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString(locale, { weekday: "short" }).replace(".", "");
}

export const getWeekLabel = (weekIndex: number, t: (key: string) => string): string => {
    return t("metrics_week_prefix") + (weekIndex + 1);
}

export const getMonthLabel = (monthStr: string, locale: string): string => {
    const d = new Date(monthStr + "-01T12:00:00");
    return d.toLocaleDateString(locale, { month: "short" }).replace(".", "");
}

export const aggregateRuns = (
    runs: RunRecord[],
    period: FilterPeriod,
    metric: "distance" | "calories" | "pace" | "duration"
): IChartDataPoint[] => {
    if (period === "daily") {
        const days = getLastNDays(7);
        return days.map((day) => {
            const dayRuns = runs.filter((r) => r.date === day);
            let value = 0;
            if (dayRuns.length > 0) {
                if (metric === "distance") value = dayRuns.reduce((s, r) => s + r.distance / 1000, 0);
                else if (metric === "calories") value = dayRuns.reduce((s, r) => s + r.calories, 0);
                else if (metric === "pace") {
                    const validPaces = dayRuns.filter((r) => r.pace > 0).map((r) => r.pace / 60);
                    value = validPaces.length > 0 ? validPaces.reduce((a, b) => a + b) / validPaces.length : 0;
                }
                else if (metric === "duration") value = dayRuns.reduce((s, r) => s + r.duration / 60, 0);
            }
            return { label: "", value: Math.round(value * 100) / 100 };
        });
    }

    if (period === "weekly") {
        const weeks: IChartDataPoint[] = [];
        for (let w = 3; w >= 0; w--) {
            const weekRuns = runs.filter((r) => {
                const runDate = new Date(r.date + "T12:00:00");
                const today = new Date();
                today.setHours(12, 0, 0, 0);
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay() - w * 7);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                return runDate >= weekStart && runDate <= weekEnd;
            });
            let value = 0;
            if (weekRuns.length > 0) {
                if (metric === "distance") value = weekRuns.reduce((s, r) => s + r.distance / 1000, 0);
                else if (metric === "calories") value = weekRuns.reduce((s, r) => s + r.calories, 0);
                else if (metric === "pace") {
                    const validPaces = weekRuns.filter((r) => r.pace > 0).map((r) => r.pace / 60);
                    value = validPaces.length > 0 ? validPaces.reduce((a, b) => a + b) / validPaces.length : 0;
                }
                else if (metric === "duration") value = weekRuns.reduce((s, r) => s + r.duration / 60, 0);
            }
            weeks.push({ label: "", value: Math.round(value * 100) / 100 });
        }
        return weeks;
    }

    const months: IChartDataPoint[] = [];
    for (let m = 5; m >= 0; m--) {
        const d = new Date();
        d.setMonth(d.getMonth() - m);
        const monthStr = d.toISOString().substring(0, 7);
        const monthRuns = runs.filter((r) => r.date.startsWith(monthStr));
        let value = 0;
        if (monthRuns.length > 0) {
            if (metric === "distance") value = monthRuns.reduce((s, r) => s + r.distance / 1000, 0);
            else if (metric === "calories") value = monthRuns.reduce((s, r) => s + r.calories, 0);
            else if (metric === "pace") {
                const validPaces = monthRuns.filter((r) => r.pace > 0).map((r) => r.pace / 60);
                value = validPaces.length > 0 ? validPaces.reduce((a, b) => a + b) / validPaces.length : 0;
            }
            else if (metric === "duration") value = monthRuns.reduce((s, r) => s + r.duration / 60, 0);
        }
        months.push({ label: "", value: Math.round(value * 100) / 100 });
    }
    return months;
}
