export const HomepageHero = ({ booksAmount }: { booksAmount: number }) => {
    return (
        <header className="1080p:pb-8 4k:pb-16 mx-auto flex flex-col justify-between gap-4 border-b border-b-slate-100 pb-4 lg:flex-row lg:items-center">
            <div className="1080p:max-w-4xl 4k:max-w-7xl max-w-xl">
                <h1 className="xs:text-3xl 1080p:text-5xl 1440p:text-7xl 4k:text-9xl text-2xl font-[1000] tracking-tight text-slate-900 sm:text-4xl lg:text-5xl xl:text-6xl">
                    Discover Books.
                </h1>
                <p className="1080p:text-xl 1440p:text-2xl 4k:text-3xl mt-1 text-xs text-slate-500 sm:text-base">
                    The world&apos;s most influential stories, curated for the modern reader.
                </p>
            </div>

            <div className="1080p:gap-16 4k:gap-32 flex items-center gap-6 border-t border-slate-50 pt-4 lg:border-t-0 lg:pt-0">
                <div className="flex flex-col items-center">
                    <dd className="1080p:text-4xl 4k:text-7xl text-lg font-black text-slate-900 lg:text-xl">
                        {booksAmount}
                    </dd>
                    <dt className="1080p:text-xs 4k:text-xl text-[7px] font-bold tracking-widest text-indigo-500 uppercase lg:text-[8px]">
                        Available
                    </dt>
                </div>

                <div
                    className="1080p:h-12 4k:h-24 h-5 w-px bg-slate-200 lg:h-6"
                    aria-hidden="true"
                />

                <div className="flex flex-col items-center">
                    <dd className="1080p:text-4xl 4k:text-7xl text-lg font-black text-slate-900 lg:text-xl">
                        24h
                    </dd>
                    <dt className="1080p:text-xs 4k:text-xl text-[7px] font-bold tracking-widest text-indigo-500 uppercase lg:text-[8px]">
                        Dispatch
                    </dt>
                </div>

                <div
                    className="1080p:h-12 4k:h-24 h-5 w-px bg-slate-200 lg:h-6"
                    aria-hidden="true"
                />

                <div className="flex flex-col items-center">
                    <dd className="1080p:text-4xl 4k:text-7xl text-lg font-black text-slate-900 lg:text-xl">
                        Free
                    </dd>
                    <dt className="1080p:text-xs 4k:text-xl text-[7px] font-bold tracking-widest text-indigo-500 uppercase lg:text-[8px]">
                        Returns
                    </dt>
                </div>
            </div>
        </header>
    );
};
