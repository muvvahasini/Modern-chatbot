import FlashcardBlock from './FlashcardBlock';
import ChecklistBlock from './ChecklistBlock';
import StatBlock from './StatBlock';

export default function BlockRenderer({ block }) {
  switch (block.type) {
    case 'flashcard': return <FlashcardBlock block={block} />;
    case 'checklist': return <ChecklistBlock block={block} />;
    case 'stat':      return <StatBlock block={block} />;
    default:
      return (
        <div className="block-card unknown-block">
          <div className="block-type-badge">{block.type}</div>
          <pre>{JSON.stringify(block, null, 2)}</pre>
        </div>
      );
  }
}
