'use client';
import { useEffect, useRef, useId } from 'react';
export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDialogElement>(null),
    outside = useRef(false);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  function isOutside(event: React.MouseEvent | React.PointerEvent) {
    const r = ref.current!.getBoundingClientRect();
    return (
      event.target === ref.current &&
      (event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom)
    );
  }
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={'admin-modal ' + (wide ? 'wide' : '')}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onPointerDown={(e) => {
        outside.current = isOutside(e);
      }}
      onClick={(e) => {
        if (outside.current && isOutside(e)) onClose();
        outside.current = false;
      }}
    >
      <header className="flex items-center justify-between gap-4 border-b border-gray-200 px-6 py-5">
        <h2 id={titleId} className="text-xl font-semibold">
          {title}
        </h2>
        <button className="admin-icon-button" onClick={onClose} aria-label="Fechar">
          ✕
        </button>
      </header>
      <div className="p-6">{children}</div>
    </dialog>
  );
}
