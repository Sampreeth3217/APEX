import { Link } from 'react-router-dom';

const CH = 300; const PAD = 34;
const col = { top_pick: '#4338CA', thin_evidence: '#D97706', proven_weak_fit: '#0D9488', skip: '#A8A29E' };

// Fit × Trust quadrant, plain SVG. Positions only; no numbers are shown to owners.
export function QuadrantChart({ points, fitT = 0.55, trustT = 0.30 }) {
  const x = (t) => PAD + t * (CH - PAD * 1.4);
  const y = (f) => CH - PAD - f * (CH - PAD * 1.6);
  const picked = points.filter((p) => p.picked);
  return (
    <figure className="if-card p-5" data-testid="quadrant-chart">
      <figcaption className="mb-3">
        <p className="font-display font-bold">How the tools compare</p>
        <p className="text-sm text-[var(--ink-2)]">Higher means a better match for you. Further right means better proven.</p>
      </figcaption>
      <svg viewBox={`0 0 ${CH} ${CH}`} className="w-full" role="img" aria-label={`Chart of ${points.length} tools. Your picks: ${picked.map((p) => p.name).join(', ') || 'none'}.`}>
        <rect x={x(trustT)} y={PAD * 0.6} width={x(1) - x(trustT)} height={y(fitT) - PAD * 0.6} fill="#EEF2FF" rx="8" />
        <rect x={x(0)} y={PAD * 0.6} width={x(trustT) - x(0)} height={y(fitT) - PAD * 0.6} fill="#FEF3C7" opacity=".55" rx="8" />
        <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(0)} stroke="#D6D3D1" />
        <line x1={x(0)} y1={y(0)} x2={x(0)} y2={y(1)} stroke="#D6D3D1" />
        <text x={x(1) - 4} y={PAD * 0.6 + 14} textAnchor="end" fontSize="10" fill="#3730A3" fontWeight="700">Great match</text>
        <text x={x(0) + 6} y={PAD * 0.6 + 14} fontSize="10" fill="#B45309" fontWeight="700">Promising, few reviews</text>
        <text x={(x(0) + x(1)) / 2} y={CH - 8} textAnchor="middle" fontSize="10" fill="#78716C">How well proven →</text>
        <text x={10} y={(y(0) + y(1)) / 2} textAnchor="middle" fontSize="10" fill="#78716C" transform={`rotate(-90 10 ${(y(0) + y(1)) / 2})`}>How well it matches you →</text>
        {points.filter((p) => !p.picked).map((p) => (
          <circle key={p.slug} cx={x(p.trust)} cy={y(p.fit)} r="4.5" fill={col[p.quadrant]} opacity={p.gated ? 0.25 : 0.45}><title>{p.name}</title></circle>
        ))}
        {picked.map((p, i) => (
          <g key={p.slug}>
            <circle cx={x(p.trust)} cy={y(p.fit)} r="10" fill="#4338CA" stroke="white" strokeWidth="2.5" />
            <text x={x(p.trust)} y={y(p.fit) + 3.5} textAnchor="middle" fontSize="10" fontWeight="800" fill="white">{i + 1}</text>
          </g>
        ))}
      </svg>
      <ul className="mt-3 space-y-1 text-sm">
        {picked.map((p, i) => (
          <li key={p.slug}><span className="mr-2 inline-grid h-5 w-5 place-items-center rounded-full bg-[var(--brand)] text-[11px] font-bold text-white">{i + 1}</span><Link className="underline-offset-2 hover:underline" to={`/tools/${p.slug}`}>{p.name}</Link></li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-[var(--ink-3)]">Faded dots are other tools we checked. Very faint ones were left out for budget or size.</p>
    </figure>
  );
}
