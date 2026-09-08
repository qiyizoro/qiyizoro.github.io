import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ArrowRight } from 'lucide-react';
import type { WorldKey } from './worldData';
import './accordionGallery.css';

type GalleryItem = { key: WorldKey; no: string; title: string; sub: string; symbol: string };

export default function AccordionGallery({ items, onSelect }: { items: GalleryItem[]; onSelect: (key: WorldKey) => void }) {
  const [active, setActive] = useState(1);
  const panels = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const mobile = matchMedia('(max-width: 620px)').matches;
    panels.current.forEach((panel, index) => {
      if (!panel) return;
      gsap.to(panel, {
        flexGrow: index === active ? 2.35 : 1,
        minHeight: mobile ? (index === active ? 260 : 92) : 440,
        rotateY: mobile ? 0 : index === active ? 0 : index < active ? 5 : -5,
        opacity: index === active ? 1 : .68,
        duration: .65,
        ease: 'power3.out'
      });
    });
  }, [active]);

  const choose = (index: number, key: WorldKey) => {
    if (active === index) onSelect(key);
    else setActive(index);
  };

  return <div className="world-accordion" role="list" aria-label="选择一个世界">
    {items.map((item, index) => <button
      type="button"
      role="listitem"
      key={item.key}
      ref={node => { panels.current[index] = node; }}
      className={`world-panel panel-${index + 1}${active === index ? ' is-active' : ''}`}
      onMouseEnter={() => setActive(index)}
      onFocus={() => setActive(index)}
      onClick={() => choose(index, item.key)}
      aria-label={`${item.title}，${item.sub}`}
    >
      <span className="world-panel__art" aria-hidden="true"/>
      <span className="world-panel__top"><b>{item.no}</b><i>{item.symbol}</i></span>
      <span className="world-panel__copy">
        <strong>{item.title}</strong><small>{item.sub}</small>
      </span>
      <span className="world-panel__arrow"><ArrowRight size={19}/></span>
    </button>)}
  </div>;
}
