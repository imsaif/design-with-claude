import Link from "next/link";
import AdminNav from "./admin-nav";
import s from "./admin.module.css";

export const metadata = {
  title: "Admin · dwic",
  robots: "noindex, nofollow",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={s.shell}>
      <header className={s.topbar}>
        <Link href="/admin" className={s.brand}>
          <span className={s.brandMark} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
              <path d="M12 2 4 6v6c0 5 3.5 9.4 8 10 4.5-.6 8-5 8-10V6l-8-4Z" />
            </svg>
          </span>
          <span className={s.brandText}>
            dwic<span className={s.brandTextDim}> / admin</span>
          </span>
        </Link>

        <AdminNav />

        <div className={s.topbarRight}>
          <Link href="/" className={s.backLink}>
            ← Back to site
          </Link>
        </div>
      </header>

      <div className={s.content}>{children}</div>
    </div>
  );
}
