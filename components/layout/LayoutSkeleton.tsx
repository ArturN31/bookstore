export const LayoutSkeleton = () => (
    <div className="mx-auto max-w-375 animate-pulse space-y-12 p-8">
        <div className="h-75 w-full rounded-xl bg-slate-200" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
                <div
                    key={i}
                    className="space-y-3"
                >
                    <div className="aspect-3/4 w-full rounded-lg bg-slate-200" />
                    <div className="h-4 w-3/4 rounded bg-slate-200" />
                </div>
            ))}
        </div>
    </div>
);
