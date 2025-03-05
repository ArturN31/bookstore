'use client';

import { useRouter } from 'next/navigation';

export const Home = () => {
	const router = useRouter();

	const handleClick = () => {
		router.push('/');
	};

	return (
		<button
			onClick={() => {
				handleClick();
			}}
			className='hover:cursor-pointer hover:underline border-x border-gunmetal font-semibold py-2 px-6'>
			Home
		</button>
	);
};
