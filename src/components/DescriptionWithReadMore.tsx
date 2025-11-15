"use client";

import { useState } from 'react';

interface Props {
  children: React.ReactNode;
  previewMaxHeight?: string; // Tailwind max-h- class like 'max-h-24'
}

export default function DescriptionWithReadMore({ children, previewMaxHeight = 'max-h-24' }: Props) {
  const [expanded, setExpanded] = useState(false);

  const toggle = (e: React.MouseEvent) => {
    // prevent click bubbling to parent (which opens the edit modal)
    e.stopPropagation();
    setExpanded((s) => !s);
  };

  return (
    <div className="w-full">
      <div className={`${expanded ? '' : `${previewMaxHeight} overflow-hidden`} text-sm`}>{children}</div>
      <div className="mt-2">
        <button
          type="button"
          onClick={toggle}
          className="text-xs text-blue-100 bg-cyan-900 hover:bg-cyan-950 p-1 shadow-md hover:scale-105 rounded"
          aria-expanded={expanded}
        >
          {expanded ? 'ver menos' : 'ver mais'}
        </button>
      </div>
    </div>
  );
}
