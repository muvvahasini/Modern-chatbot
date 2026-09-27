export default function StatBlock({ block }) {
  return (
    <div className="block-card stat-block">
      <div className="block-type-badge">Key Stat</div>
      <p className="stat-label">{block.label}</p>
      <p className="stat-value">{block.value}</p>
      {block.note && <p className="stat-note">{block.note}</p>}
    </div>
  );
}
