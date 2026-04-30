import React from "react";
import Svg, { Rect, Line, Text as SvgText } from "react-native-svg";
import { IChartDataPoint } from "@/interfaces/metrics";
import { CHART_HEIGHT, CHART_WIDTH, PADDING } from "@/utils/metrics";

export const BarChart = ({ data, color, colors }: { data: IChartDataPoint[]; color: string; colors: any }) => {
    const maxValue = Math.max(...data.map((d) => d.value), 0.01);
    const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
    const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
    const barWidth = (innerWidth / data.length) * 0.6;
    const barGap = (innerWidth / data.length) * 0.4;

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
                                {labelValue >= 100 ? Math.round(labelValue) : labelValue.toFixed(1)}
                            </SvgText>
                        )}
                    </React.Fragment>
                );
            })}

            {data.map((point, i) => {
                const barHeight = maxValue > 0 ? (point.value / maxValue) * innerHeight : 0;
                const x = PADDING.left + i * (innerWidth / data.length) + barGap / 2;
                const y = PADDING.top + innerHeight - barHeight;
                return (
                    <React.Fragment key={i}>
                        <Rect
                            x={x} y={y} width={barWidth} height={barHeight} rx={4}
                            fill={point.value > 0 ? color : colors.border}
                            opacity={point.value > 0 ? 1 : 0.4}
                        />
                        <SvgText
                            x={x + barWidth / 2} y={PADDING.top + innerHeight + 18}
                            textAnchor="middle" fontSize={11} fill={colors.muted}
                        >
                            {point.label}
                        </SvgText>
                    </React.Fragment>
                );
            })}
        </Svg>
    );
}
