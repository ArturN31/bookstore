'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const Home = () => {
    const pathname = usePathname();
    const isActive = pathname === '/';

    return (
        <Link
            href="/"
            data-testid="filterbar-home"
            aria-current={isActive ? 'page' : undefined}
            className={`inline-block px-6 py-2 font-semibold transition-colors hover:underline ${isActive ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-700 hover:text-blue-600'} `}
        >
            Home
        </Link>
    );
};
