import { useEffect } from "react";
import SettingsCard from "./SettingsCard";
import type { Thresholds } from "../../common/api";

type Props = {
  open: boolean;
  onClose: () => void;
  thresholds: Thresholds | null;
  onChange: (t: Thresholds) => void;
};

export default function SettingsModal({
  open,
  onClose,
  thresholds,
  onChange,
}: Props) {
  // zavření na Escape
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modalBackdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Nastavení"
    >
      <div className="modalPanel" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h3 style={{ margin: 0 }}>Nastavení</h3>
          <button
            type="button"
            className="iconButton"
            aria-label="Zavřít"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <SettingsCard thresholds={thresholds} onChange={onChange} />
      </div>
    </div>
  );
}
