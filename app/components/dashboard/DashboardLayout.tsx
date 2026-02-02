"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

// SVG Icon components
function IconOverview({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
    );
}

function IconAgents({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="6" y="2" width="12" height="8" rx="2" />
            <circle cx="9" cy="6" r="1" fill="currentColor" />
            <circle cx="15" cy="6" r="1" fill="currentColor" />
            <path d="M12 10v3" />
            <rect x="4" y="15" width="16" height="7" rx="2" />
            <path d="M8 18h2M14 18h2" />
        </svg>
    );
}

function IconWallets({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z" />
            <path d="M16 12h4" />
            <circle cx="17" cy="12" r="1.5" fill="currentColor" />
            <path d="M2 7l7-3h6l7 3" />
        </svg>
    );
}

function IconActivity({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    );
}

function IconChevronLeft({ className = "w-4 h-4" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
        </svg>
    );
}

function IconChevronRight({ className = "w-4 h-4" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
        </svg>
    );
}

interface NavItem {
    label: string;
    value: string;
    icon: ReactNode;
}

interface DashboardLayoutProps {
    children: ReactNode;
    activeTab?: string;
    onTabChange?: (tab: string) => void;
}

const navItems: NavItem[] = [
    { label: "Overview", value: "overview", icon: <IconOverview /> },
    { label: "Agents", value: "agents", icon: <IconAgents /> },
    { label: "Wallets", value: "wallets", icon: <IconWallets /> },
    { label: "Activity", value: "activity", icon: <IconActivity /> },
];

export function DashboardLayout({
    children,
    activeTab = "overview",
    onTabChange,
}: DashboardLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [currentTime, setCurrentTime] = useState("");

    useEffect(() => {
        const updateTime = () => {
            setCurrentTime(
                new Date().toLocaleTimeString("en-US", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                })
            );
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-[var(--bg-deep)] text-[var(--text-primary)] flex">
            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 h-screen bg-[var(--bg-surface)] border-r border-[var(--border)] transition-all duration-300 z-30 flex flex-col ${sidebarCollapsed ? "w-16" : "w-56"
                    }`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-3 border-b border-[var(--border)]">
                    {!sidebarCollapsed && (
                        <Link href="/" className="flex items-center mx-auto">
                            <Image
                                src="/logo.png"
                                alt="Maxxit"
                                width={90}
                                height={28}
                                className="h-6 w-30"
                            />
                        </Link>
                    )}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="p-2 hover:bg-[var(--bg-elevated)] rounded transition-colors text-[var(--text-muted)] hover:text-accent"
                        title={sidebarCollapsed ? "Expand" : "Collapse"}
                    >
                        {sidebarCollapsed ? <IconChevronRight /> : <IconChevronLeft />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6">
                    <ul className="space-y-1 px-2">
                        {navItems.map((item) => (
                            <li key={item.value}>
                                <button
                                    onClick={() => onTabChange?.(item.value)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all group ${activeTab === item.value
                                        ? "bg-accent/10 text-accent"
                                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                                        }`}
                                    title={sidebarCollapsed ? item.label : undefined}
                                >
                                    <span className={`flex-shrink-0 ${activeTab === item.value ? "text-accent" : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"}`}>
                                        {item.icon}
                                    </span>
                                    {!sidebarCollapsed && (
                                        <span className="text-sm tracking-wide">
                                            {item.label}
                                        </span>
                                    )}
                                    {activeTab === item.value && !sidebarCollapsed && (
                                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-[var(--border)]">
                    {!sidebarCollapsed ? (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                                <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">System Online</span>
                            </div>
                            <p
                                className="text-xs text-[var(--text-muted)] font-mono tabular-nums"
                                suppressHydrationWarning
                            >
                                {currentTime}
                            </p>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main
                className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-56"
                    }`}
            >
                {/* Top Bar */}
                <header className="h-14 border-b border-[var(--border)] bg-[var(--bg-deep)]/80 backdrop-blur sticky top-0 z-20 flex items-center justify-between px-6">
                    <div>
                        <h1 className="font-display text-lg tracking-wide">
                            ADMIN <span className="text-accent">DASHBOARD</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wider">Control Panel</span>
                    </div>
                </header>

                {/* Content Area */}
                <div className="p-6">{children}</div>

                {/* Footer */}
                <footer className="border-t border-[var(--border)] py-4 px-6">
                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                        <span className="font-mono">MAXXIT</span>
                        <span>© 2025</span>
                    </div>
                </footer>
            </main>
        </div>
    );
}
