const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <p className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-fg-subtle sm:px-6">
        © {CURRENT_YEAR} MiniAula · Ingeniería Web 2
      </p>
    </footer>
  );
}
