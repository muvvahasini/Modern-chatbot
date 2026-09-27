import { useState } from 'react';

export default function ChecklistBlock({ block }) {
  const [checked, setChecked] = useState({});
  const [expanded, setExpanded] = useState(null); // index of expanded item

  const toggle = (i) => setChecked((prev) => ({ ...prev, [i]: !prev[i] }));

  const toggleExpand = (i) => setExpanded((prev) => (prev === i ? null : i));

  const doneCount = Object.values(checked).filter(Boolean).length;
  const total = block.items?.length || 0;

  // Support both old string[] format and new {text, detail}[] format
  const normalize = (item) =>
    typeof item === 'string' ? { text: item, detail: null } : item;

  return (
    <div className="block-card checklist-block">
      <div className="block-type-badge">Checklist</div>
      <h3 className="block-title">{block.title}</h3>
      <div className="checklist-progress-bar">
        <div
          className="checklist-progress-fill"
          style={{ width: total ? `${(doneCount / total) * 100}%` : '0%' }}
        />
      </div>
      <p className="checklist-count">{doneCount} / {total} completed</p>

      <ul className="checklist-items">
        {block.items?.map((raw, i) => {
          const item = normalize(raw);
          const isExpanded = expanded === i;

          return (
            <li key={i} className={`checklist-item ${checked[i] ? 'checked' : ''}`}>
              <div className="checklist-item-row">
                {/* Checkbox */}
                <button
                  type="button"
                  className="checklist-checkbox"
                  onClick={() => toggle(i)}
                  aria-label={checked[i] ? `Uncheck: ${item.text}` : `Check: ${item.text}`}
                  aria-pressed={!!checked[i]}
                >
                  {checked[i] ? '✓' : ''}
                </button>

                {/* Label — click to expand detail */}
                <button
                  type="button"
                  className="checklist-label-btn"
                  onClick={() => item.detail && toggleExpand(i)}
                  aria-expanded={isExpanded}
                  title={item.detail ? 'Click for more info' : undefined}
                >
                  <span className="checklist-label-text">{item.text}</span>
                  {item.detail && (
                    <span className={`checklist-expand-icon ${isExpanded ? 'open' : ''}`}>ℹ</span>
                  )}
                </button>
              </div>

              {/* Expandable detail panel */}
              {item.detail && isExpanded && (
                <div className="checklist-detail" role="region" aria-label={`Details for ${item.text}`}>
                  <p>{item.detail}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
