export const HomepageHero = ({ booksAmount }: { booksAmount: number }) => {
    return (
        <header className="mx-auto flex flex-col justify-between gap-12 border-b border-b-gray-200 pb-4 lg:flex-row lg:items-end">
            <div className="max-w-xl space-y-4">
                <h1 className="text-5xl font-black tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
                    Discover <br className="hidden sm:block" /> Books.
                </h1>
                <p className="text-lg text-gray-600 sm:text-xl">
                    The world's most influential stories, <br className="hidden md:block" />
                    curated for the modern reader.
                </p>
            </div>

            <dl className="flex items-center justify-between border-t border-gray-100 pt-8 sm:justify-start sm:gap-12 md:border-t-0 md:pt-0">
                <div className="group text-center">
                    <dd className="text-3xl font-black text-slate-900 transition-transform group-hover:-translate-y-1">
                        {booksAmount}
                    </dd>
                    <dt className="text-[10px] font-bold tracking-[0.2em] text-indigo-600 uppercase">
                        Available
                    </dt>
                </div>

                <div
                    className="h-10 w-px bg-gray-200"
                    aria-hidden="true"
                />

                <div className="group text-center">
                    <dd className="text-3xl font-black text-slate-900 transition-transform group-hover:-translate-y-1">
                        24h
                    </dd>
                    <dt className="text-[10px] font-bold tracking-[0.2em] text-indigo-600 uppercase">
                        Dispatch
                    </dt>
                </div>

                <div
                    className="h-10 w-px bg-gray-200"
                    aria-hidden="true"
                />

                <div className="group text-center">
                    <dd className="text-3xl font-black text-slate-900 transition-transform group-hover:-translate-y-1">
                        Free
                    </dd>
                    <dt className="text-[10px] font-bold tracking-[0.2em] text-indigo-600 uppercase">
                        Returns
                    </dt>
                </div>
            </dl>
        </header>
    );
};
