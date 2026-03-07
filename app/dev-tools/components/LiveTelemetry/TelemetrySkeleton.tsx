export const TelemetrySkeleton = () => {
    return (
        <div className="grid grid-cols-1 gap-px border-2 border-slate-900 bg-slate-900 sm:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
                <div
                    key={i}
                    className="relative h-32 overflow-hidden bg-white p-4"
                >
                    <div className="mb-4 h-2 w-16 animate-pulse bg-slate-100" />

                    <div className="mb-4 h-8 w-24 animate-pulse bg-slate-200" />

                    <div className="absolute bottom-0 left-0 h-1 w-full bg-slate-50">
                        <div className="h-full w-1/3 animate-pulse bg-slate-200" />
                    </div>

                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-linear-to-r from-transparent via-slate-50/50 to-transparent" />
                </div>
            ))}
        </div>
    );
};
