interface Props {
  shells: number[];
  symbol: string;
  number: number;
  color: string;
}

export function BohrDiagram({ shells, symbol, number, color }: Props) {
  const cx = 110;
  const cy = 110;
  const shellRadii = shells.map((_, i) => 22 + i * 16);
  const maxR = shellRadii.length ? shellRadii[shellRadii.length - 1] : 22;
  const vbSize = Math.max(220, (maxR + 18) * 2);
  const offset = vbSize / 2;

  return (
    <svg viewBox={`0 0 ${vbSize} ${vbSize}`} className="w-full h-full">
      {/* shell rings */}
      {shellRadii.map((r, i) => (
        <circle
          key={`r-${i}`}
          cx={offset}
          cy={offset}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.25}
          strokeWidth={0.8}
          strokeDasharray="3 3"
        />
      ))}

      {/* electrons */}
      {shells.map((count, shellIdx) => {
        if (!count) return null;
        const r = shellRadii[shellIdx];
        // counter-rotating shells, slower for outer shells
        const duration = 8 + shellIdx * 4;
        const direction = shellIdx % 2 === 0 ? 1 : -1;
        return (
          <g key={`s-${shellIdx}`}>
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from={`0 ${offset} ${offset}`}
              to={`${360 * direction} ${offset} ${offset}`}
              dur={`${duration}s`}
              repeatCount="indefinite"
            />
            {Array.from({ length: count }, (_, i) => {
              const a = (i / count) * Math.PI * 2;
              const ex = offset + r * Math.cos(a);
              const ey = offset + r * Math.sin(a);
              return (
                <g key={`e-${shellIdx}-${i}`}>
                  <circle cx={ex} cy={ey} r={3.6} className={color} fill="currentColor" />
                  <circle cx={ex} cy={ey} r={3.6} fill="none" stroke="currentColor" strokeOpacity={0.5} strokeWidth={0.6} />
                </g>
              );
            })}
          </g>
        );
      })}

      {/* nucleus */}
      <circle cx={offset} cy={offset} r={16} className={color} fill="currentColor" fillOpacity={0.25} />
      <circle cx={offset} cy={offset} r={16} className={color} fill="none" stroke="currentColor" strokeWidth={1.2} />
      <text x={offset} y={offset - 1} textAnchor="middle" dominantBaseline="middle" className="font-bold" fill="currentColor" style={{ fontSize: 11 }}>{symbol}</text>
      <text x={offset} y={offset + 10} textAnchor="middle" dominantBaseline="middle" fill="currentColor" fillOpacity={0.7} style={{ fontSize: 6 }}>{number}</text>
    </svg>
  );
}
