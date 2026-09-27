import { useState, useRef, useLayoutEffect } from 'react';

export default function FlashcardBlock({ block }) {
  const [flipped, setFlipped] = useState(false);
  const innerRef = useRef(null);
  const frontRef = useRef(null);
  const backRef = useRef(null);

  useLayoutEffect(() => {
    const inner = innerRef.current;
    const front = frontRef.current;
    const back = backRef.current;
    if (!inner || !front || !back) return;

    const apply = () => {
      const target = Math.max(front.scrollHeight, back.scrollHeight);
      const current = Math.round(inner.clientHeight);
      if (current !== target) {
        inner.style.height = `${target}px`;
      }
    };
    apply();

    const ro = new ResizeObserver(() => apply());
    ro.observe(front);
    ro.observe(back);

    return () => {
      ro.disconnect();
      inner.style.height = '';
    };
  }, [block.question, block.answer]);

  const toggle = () => setFlipped((f) => !f);

  return (
    <div
      className={`block-card flashcard-block ${flipped ? 'flipped' : ''}`}
      onClick={toggle}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle()}
      role="button"
      tabIndex={0}
      aria-label={flipped ? 'Click to see question' : 'Click to reveal answer'}
    >
      <div className="block-type-badge">Flashcard</div>
      <div className="flashcard-inner" ref={innerRef}>
        <div className="flashcard-face flashcard-front" ref={frontRef}>
          <span className="flashcard-label">Q</span>
          <p>{block.question}</p>
        </div>
        <div className="flashcard-face flashcard-back" ref={backRef}>
          <span className="flashcard-label">A</span>
          <p>{block.answer}</p>
        </div>
      </div>
      <p className="flashcard-hint">{flipped ? 'Click to flip back' : 'Click to reveal answer'}</p>
    </div>
  );
}
