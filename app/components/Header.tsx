"use client";
import Image from "next/image";
import Link from "next/link";

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-20 border-b border-[var(--border)] bg-[var(--bg-deep)]/80 backdrop-blur">
      <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* <div className="h-11 w-11 rounded-sm border border-[var(--border)] bg-[var(--bg-surface)] flex items-center justify-center font-display text-accent text-lg shadow-[0_0_0_1px_var(--border)]">
            MX
          </div> */}
          <div>
            <Link href="/" className="flex items-center py-3">
              <Image src="/logo.png" alt="Maxxit" width={100} height={100} className="w-full" />
            </Link>

          </div>
        </div>

        {/* <nav className="hidden md:flex items-center gap-6 text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">
          <Link href="/admin" className="hover:text-[var(--text-primary)]">
            Overview
          </Link>
          <Link href="/admin#agents" className="hover:text-[var(--text-primary)]">
            Agents
          </Link>
          <Link href="/admin#wallets" className="hover:text-[var(--text-primary)]">
            Wallets
          </Link>
          <Link href="/admin#activity" className="hover:text-[var(--text-primary)]">
            Activity
          </Link>
        </nav> */}

        <div className="flex items-center gap-3">
          <span className="status-live text-xs uppercase">Live</span>
          <p className="text-sm text-[var(--text-muted)] font-mono">
            Admin Control Panel
          </p>
          {/* <Link
            href="/"
            className="px-3 py-2 text-xs border border-[var(--border)] hover:border-accent hover:text-accent transition-colors font-mono"
          >
            Go Home
          </Link> */}
        </div>
      </div>
    </header>
  );
}

export default Header;