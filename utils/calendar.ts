import { IBMICategoryData, IBMICategory } from "@/interfaces/calendar/bmi";

export const BMI_CATEGORIES_DATA: IBMICategoryData[] = [
    { key: "bmi_underweight", range: "< 18.5", color: "#60A5FA", emoji: "⚠️", min: 0, max: 18.5 },
    { key: "bmi_normal", range: "18.5 – 24.9", color: "#22C55E", emoji: "✅", min: 18.5, max: 25 },
    { key: "bmi_overweight", range: "25.0 – 29.9", color: "#F59E0B", emoji: "⚡", min: 25, max: 30 },
    { key: "bmi_obese1", range: "30.0 – 34.9", color: "#F97316", emoji: "🔴", min: 30, max: 35 },
    { key: "bmi_obese2", range: "35.0 – 39.9", color: "#EF4444", emoji: "🔴", min: 35, max: 40 },
    { key: "bmi_obese3", range: "≥ 40.0", color: "#DC2626", emoji: "🚨", min: 40, max: 999 },
];

export const BMI_CATEGORIES: IBMICategory[] = [
    { key: "bmi_underweight", color: "#60A5FA", emoji: "📉", min: 0, max: 18.5 },
    { key: "bmi_normal", color: "#34D399", emoji: "✅", min: 18.5, max: 25 },
    { key: "bmi_overweight", color: "#FBBF24", emoji: "⚠️", min: 25, max: 30 },
    { key: "bmi_obese1", color: "#F97316", emoji: "🔶", min: 30, max: 35 },
    { key: "bmi_obese2", color: "#EF4444", emoji: "🔴", min: 35, max: 40 },
    { key: "bmi_obese3", color: "#991B1B", emoji: "🚨", min: 40, max: 999 },
];

export const getBMICategory = (bmi: number): IBMICategory => {
    return BMI_CATEGORIES.find((c) => bmi >= c.min && bmi < c.max) ?? BMI_CATEGORIES[0];
}

export const getBMICategoryData = (bmi: number): IBMICategoryData => {
    return BMI_CATEGORIES_DATA.find((c) => bmi >= c.min && bmi < c.max) ?? BMI_CATEGORIES_DATA[5];
}

export const calculateBMI = (weightKg: number, heightCm: number): number => {
    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
}

export const calculateIdealWeight = (heightCm: number): { min: number; max: number } => {
    const heightM = heightCm / 100;
    const minBMI = 18.5;
    const maxBMI = 24.9;
    return {
        min: Math.round(minBMI * heightM * heightM * 10) / 10,
        max: Math.round(maxBMI * heightM * heightM * 10) / 10,
    };
}

export const getAllDays = (state: any) => {
    const [y, m, d] = state.goalStartDate.split("-").map(Number);
    const startDate = new Date(y, m - 1, d);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < state.goalDays; i++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + i);
        dayDate.setHours(12, 0, 0, 0);

        const dateStr = dayDate.toISOString().split("T")[0];
        const hasRun = state.runs.some((r: any) => r.date === dateStr);

        const dayDateOnly = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
        const todayDateOnly = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());

        const isPast = dayDateOnly < todayDateOnly;
        const isToday = dayDateOnly.getTime() === todayDateOnly.getTime();

        let status: "done" | "missed" | "future" | "today";
        if (isToday) {
            status = hasRun ? "done" : "today";
        } else if (isPast) {
            status = hasRun ? "done" : "missed";
        } else {
            status = "future";
        }

        days.push({ dayNumber: i + 1, date: dateStr, status, hasRun });
    }
    return days;
}

export const getAllStatus = (calendarDays: any[]) => {
    const done = calendarDays.filter((d) => d.status === "done").length;
    const missed = calendarDays.filter((d) => d.status === "missed").length;
    const remaining = calendarDays.filter((d) => d.status === "future" || d.status === "today").length;
    const percent = calendarDays.length > 0 ? Math.round((done / calendarDays.length) * 100) : 0;
    return { done, missed, remaining, percent };
}