'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Modal } from './modal';

const ConfirmationContext = createContext<(message: string) => Promise<boolean>>(() =>
  Promise.resolve(false),
);

export function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const pending = useRef<((value: boolean) => void) | null>(null);
  const confirm = useCallback(
    (text: string) =>
      new Promise<boolean>((resolve) => {
        pending.current?.(false);
        pending.current = resolve;
        setMessage(text);
      }),
    [],
  );
  const finish = useCallback((accepted: boolean) => {
    pending.current?.(accepted);
    pending.current = null;
    setMessage(null);
  }, []);
  useEffect(
    () => () => {
      pending.current?.(false);
    },
    [],
  );
  return (
    <ConfirmationContext.Provider value={confirm}>
      {children}
      {message !== null && (
        <Modal title="Confirmar ação" onClose={() => finish(false)}>
          <p className="mb-6 leading-relaxed">{message}</p>
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" className="admin-button" autoFocus onClick={() => finish(false)}>
              Cancelar
            </button>
            <button type="button" className="admin-primary" onClick={() => finish(true)}>
              Confirmar
            </button>
          </div>
        </Modal>
      )}
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  return useContext(ConfirmationContext);
}
