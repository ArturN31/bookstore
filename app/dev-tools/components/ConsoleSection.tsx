export const ConsoleSection = ({ title, subtitle, children, variant = 'default' }: any) => (
    <section className="space-y-4">
        <div className="flex items-center gap-4">
            <h2
                className={`px-3 py-1 text-xs font-black tracking-[0.3em] uppercase ${
                    variant === 'danger' ? 'bg-yellow text-gunmetal' : 'bg-gunmetal text-white'
                }`}
            >
                {title} {subtitle && <span className="ml-2 opacity-50">// {subtitle}</span>}
            </h2>
            <div
                className={`h-0.5 flex-1 ${variant === 'danger' ? 'bg-yellow/30' : 'bg-gunmetal/10'}`}
            />
        </div>
        {children}
    </section>
);
