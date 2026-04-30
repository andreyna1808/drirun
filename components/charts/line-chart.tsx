import React from "react";
import Svg, { Line, Text as SvgText, Path, Circle } from "react-native-svg";
import { IChartDataPoint } from "@/interfaces/metrics";
import { CHART_WIDTH, PADDING, CHART_HEIGHT } from "@/utils/metrics";

export const LineChart = ({ data, color, colors }: { data: IChartDataPoint[]; color: string; colors: any }) => {
    const maxValue = Math.max(...data.map((d) => d.value), 0.01);
    const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
    const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

    const points = data.map((point, i) => ({
        x: PADDING.left + (i / (data.length - 1)) * innerWidth,
        y: PADDING.top + innerHeight * (1 - (maxValue > 0 ? point.value / maxValue : 0)),
        value: point.value,
        label: point.label,
    }));

    const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

    return (
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = PADDING.top + innerHeight * (1 - ratio);
                const labelValue = maxValue * ratio;
                return (
                    <React.Fragment key={ratio}>
                        <Line
                            x1={PADDING.left} y1={y}
                            x2={PADDING.left + innerWidth} y2={y}
                            stroke={colors.border} strokeWidth={1}
                            strokeDasharray={ratio === 0 ? "0" : "4,4"}
                        />
                        {ratio > 0 && (
                            <SvgText
                                x={PADDING.left - 4} y={y + 4}
                                textAnchor="end" fontSize={10} fill={colors.muted}
                            >
                                {labelValue.toFixed(1)}
                            </SvgText>
                        )}
                    </React.Fragment>
                );
            })}

            {data.some((d) => d.value > 0) && (
                <Path d={pathD} stroke={color} strokeWidth={2.5} fill="none" />
            )}

            {points.map((p, i) => (
                <React.Fragment key={i}>
                    {p.value > 0 && <Circle cx={p.x} cy={p.y} r={4} fill={color} />}
                    <SvgText
                        x={p.x} y={PADDING.top + innerHeight + 18}
                        textAnchor="middle" fontSize={11} fill={colors.muted}
                    >
                        {p.label}
                    </SvgText>
                </React.Fragment>
            ))}
        </Svg>
    );
}
