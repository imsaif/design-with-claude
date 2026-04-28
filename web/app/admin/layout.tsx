import Link from "next/link";

export const metadata = {
  title: "Admin · dwic",
  robots: "noindex, nofollow",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold tracking-tight">dwic admin</span>
            <Link
              href="/admin"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Signups
            </Link>
          </div>
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            ← Back to site
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}
