export const ActionSection = ({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) => (
    <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-lg font-semibold text-gray-800">{title}</h3>
        {description && <p className="mb-4 text-sm text-gray-600">{description}</p>}
        <div className="flex flex-col gap-3">{children}</div>
    </div>
);
