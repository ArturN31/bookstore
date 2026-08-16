import Link from 'next/link';

export const ActionLink = ({
    href,
    icon: Icon,
    label,
    color = 'indigo',
}: {
    href: string;
    icon: React.ElementType;
    label: string;
    color?: string;
}) => {
    const colorMap: Record<string, string> = {
        indigo: 'text-indigo-600',
        green: 'text-green-600',
        gray: 'text-gray-700',
        orange: 'text-orange-600',
        blue: 'text-blue-600',
    };

    return (
        <Link
            href={href}
            className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-linear-to-r from-gray-50 to-white p-4 transition-all duration-200 hover:border-gray-300 hover:from-indigo-50 hover:shadow-md"
        >
            <Icon
                className={`${colorMap[color]} text-xl transition-transform duration-200 group-hover:scale-110`}
            />
            <span className="font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
        </Link>
    );
};
