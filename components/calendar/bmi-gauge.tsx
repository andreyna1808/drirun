import { Dimensions } from "react-native";
import { Circle, Path, Svg } from "react-native-svg";

const { width } = Dimensions.get("window");

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