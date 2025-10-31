'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const Home = () => {
	const pathname = usePathname();
	const isActive = pathname === '/';

	return (
		<Link
			href='/'
			data-testid='filterbar-home'
			role='menuitem'
			aria-current={isActive ? 'page' : undefined}
			className={`
                hover:cursor-pointer 
                hover:underline 
                font-semibold 
                py-2 
                px-6 
                ${isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700'}
            `}>
			Home
		</Link>
	);
};
