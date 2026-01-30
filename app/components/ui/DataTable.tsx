import { ReactNode, useState, useMemo } from "react";

interface Column<T> {
    key: string;
    label: string;
    sortable?: boolean;
    align?: "left" | "center" | "right";
    render?: (item: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    isLoading?: boolean;
    emptyMessage?: string;
    initialSortBy?: string;
    initialSortDir?: "asc" | "desc";
}

export function DataTable<T extends Record<string, any>>({
    data,
    columns,
    isLoading = false,
    emptyMessage = "No data found",
    initialSortBy,
    initialSortDir = "desc",
}: DataTableProps<T>) {
    const [sortBy, setSortBy] = useState(initialSortBy);
    const [sortDir, setSortDir] = useState<"asc" | "desc">(initialSortDir);

    const sortedData = useMemo(() => {
        if (!sortBy) return data;

        return [...data].sort((a, b) => {
            const aVal = a[sortBy];
            const bVal = b[sortBy];

            if (aVal === bVal) return 0;
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            const comparison =
                typeof aVal === "string"
                    ? aVal.localeCompare(bVal)
                    : (aVal as number) - (bVal as number);

            return sortDir === "asc" ? comparison : -comparison;
        });
    }, [data, sortBy, sortDir]);

    const handleSort = (key: string) => {
        if (sortBy === key) {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
            setSortBy(key);
            setSortDir("desc");
        }
    };

    if (isLoading) {
        return (
            <div className="border border-[var(--border)] overflow-hidden">
                <div className="bg-[var(--bg-elevated)] border-b border-[var(--border)] p-4">
                    <div className="h-4 w-32 bg-[var(--border)] rounded animate-pulse" />
                </div>
                <div className="divide-y divide-[var(--border)]">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="p-4 animate-pulse">
                            <div className="flex gap-4">
                                <div className="h-4 w-24 bg-[var(--border)] rounded" />
                                <div className="h-4 w-32 bg-[var(--border)] rounded" />
                                <div className="h-4 w-20 bg-[var(--border)] rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="border border-[var(--border)] p-12 text-center">
                <p className="text-[var(--text-muted)]">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="border border-[var(--border)] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border)]">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`px-4 py-3 font-mono text-xs text-[var(--text-muted)] uppercase ${col.align === "right"
                                            ? "text-right"
                                            : col.align === "center"
                                                ? "text-center"
                                                : "text-left"
                                        } ${col.sortable ? "cursor-pointer hover:text-accent transition-colors select-none" : ""}`}
                                    onClick={() => col.sortable && handleSort(col.key)}
                                >
                                    <span className="inline-flex items-center gap-1">
                                        {col.label}
                                        {col.sortable && sortBy === col.key && (
                                            <span className="text-accent">
                                                {sortDir === "asc" ? "↑" : "↓"}
                                            </span>
                                        )}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                        {sortedData.map((item, idx) => (
                            <tr
                                key={idx}
                                className="hover:bg-[var(--bg-surface)] transition-colors"
                            >
                                {columns.map((col) => (
                                    <td
                                        key={col.key}
                                        className={`px-4 py-4 ${col.align === "right"
                                                ? "text-right"
                                                : col.align === "center"
                                                    ? "text-center"
                                                    : "text-left"
                                            }`}
                                    >
                                        {col.render
                                            ? col.render(item, idx)
                                            : String(item[col.key] ?? "—")}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
