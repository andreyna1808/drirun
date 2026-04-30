import { IBMICategory, IBMICategoryData } from "@/interfaces/calendar/bmi.interface";
import { Dimensions } from "react-native";
import { Circle, Path, Svg } from "react-native-svg";

const { width } = Dimensions.get("window");

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

export const BMIGauge = ({ bmi, color }: { bmi: number; color: string }) => {
    const size = width * 0.55;
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.38;
    const strokeWidth = size * 0.08;

    const minBMI = 10;
    const maxBMI = 45;
    const clampedBMI = Math.max(minBMI, Math.min(maxBMI, bmi));
    const angle = -150 + ((clampedBMI - minBMI) / (maxBMI - minBMI)) * 300;
    const angleRad = (angle * Math.PI) / 180;

    const needleX = cx + r * Math.cos(angleRad);
    const needleY = cy + r * Math.sin(angleRad);

    const arcStart = -150;
    const arcEnd = 150;
    const startRad = (arcStart * Math.PI) / 180;
    const endRad = (arcEnd * Math.PI) / 180;
    const arcPath = `M ${cx + r * Math.cos(startRad)} ${cy + r * Math.sin(startRad)} A ${r} ${r} 0 1 1 ${cx + r * Math.cos(endRad)} ${cy + r * Math.sin(endRad)}`;

    const progressEndRad = (angle * Math.PI) / 180;
    const progressPath = `M ${cx + r * Math.cos(startRad)} ${cy + r * Math.sin(startRad)} A ${r} ${r} 0 ${angle - arcStart > 180 ? 1 : 0} 1 ${cx + r * Math.cos(progressEndRad)} ${cy + r * Math.sin(progressEndRad)}`;

    return (
        <Svg width={size} height={size * 0.75}>
            <Path d={arcPath} stroke="#E5E7EB" strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
            <Path d={progressPath} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
            <Path d={`M ${cx} ${cy} L ${needleX} ${needleY}`} stroke={color} strokeWidth={3} strokeLinecap="round" />
            <Circle cx={cx} cy={cy} r={6} fill={color} />
        </Svg>
    );
}