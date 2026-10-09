import { Link } from "react-router-dom";
import { useAuth } from "../auth";

export default function Header() {
  const { user, logout } = useAuth();
  const initial = (user?.name || "?").trim().charAt(0).toUpperCase();

  return (
    <header className="bg-surface-container-low sticky top-0 z-50">
      <div className="w-full max-w-[1100px] mx-auto px-4 md:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary-container">
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              radar
            </span>
          </div>
          <span className="text-[20px] font-bold tracking-tight text-on-surface">
            Opportunity Hunter
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/40">
            <div className="w-6 h-6 rounded-full bg-primary-container/20 text-primary flex items-center justify-center font-bold text-[12px] border border-primary/30">
              {initial}
            </div>
            <span className="text-[12px] font-semibold text-on-surface hidden sm:inline">
              {user?.name}
            </span>
          </div>
          <button
            onClick={logout}
            className="text-[12px] font-semibold text-outline hover:text-on-surface hover:bg-surface-container-high px-2.5 py-1.5 rounded-lg transition-all active:scale-[0.98] bg-transparent border-0 cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
