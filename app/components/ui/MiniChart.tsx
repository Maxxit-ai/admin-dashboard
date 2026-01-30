interface MiniChartProps {
    data: number[];
    height?: number;
    color?: string;
    showTooltip?: boolean;
}

export function MiniChart({
    data,
    height = 60,
    color = "var(--accent)",
    showTooltip = true,
}: MiniChartProps) {
    if (data.length === 0) return null;

    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;

    return (
        <div className="flex items-end gap-1" style={{ height }}>
            {data.map((value, i) => {
                const heightPercent = Math.max(((value - min) / range) * 100, 5);
                return (
                    <div
                        key={i}
                        className="flex-1 rounded-t transition-all duration-200 hover:opacity-80 cursor-pointer group relative"
                        style={{
                            height: `${heightPercent}%`,
                            backgroundColor: `color-mix(in srgb, ${color} 40%, transparent)`,
                        }}
                        onMouseEnter={(e) => {
                            if (showTooltip) {
                                e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${color} 60%, transparent)`;
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${color} 40%, transparent)`;
                        }}
                    >
                        {/* Tooltip */}
                        {showTooltip && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                {value}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

interface AreaChartProps {
    data: { label: string; value: number }[];
    height?: number;
    showLabels?: boolean;
}

export function AreaChart({
    data,
    height = 120,
    showLabels = true,
}: AreaChartProps) {
    if (data.length === 0) return null;

    const values = data.map((d) => d.value);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    // Create SVG path
    const points = values.map((value, i) => {
        const x = (i / (values.length - 1)) * 100;
        const y = 100 - ((value - min) / range) * 100;
        return { x, y };
    });

    const linePath = points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
        .join(" ");

    const areaPath = `${linePath} L 100 100 L 0 100 Z`;

    return (
        <div>
            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{ height }}
                className="w-full overflow-visible"
            >
                {/* Gradient */}
                <defs>
                    <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Area */}
                <path d={areaPath} fill="url(#areaGradient)" />

                {/* Line */}
                <path
                    d={linePath}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="0.5"
                    vectorEffect="non-scaling-stroke"
                />

                {/* Points */}
                {points.map((p, i) => (
                    <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r="0.8"
                        fill="var(--accent)"
                        className="opacity-0 hover:opacity-100 transition-opacity"
                    />
                ))}
            </svg>

            {/* Labels */}
            {showLabels && data.length > 0 && (
                <div className="flex justify-between mt-2 text-xs text-[var(--text-muted)]">
                    <span>{data[0]?.label}</span>
                    <span>{data[data.length - 1]?.label}</span>
                </div>
            )}
        </div>
    );
}
