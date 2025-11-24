export default function SettingsFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="fab"
      aria-label="Otevřít nastavení"
      title="Nastavení"
      onClick={onClick}
    >
      <span style={{ fontSize: 22, lineHeight: 1 }}>⚙️</span>
    </button>
  );
}
