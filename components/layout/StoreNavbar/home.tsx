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
			className='hover:cursor-pointer hover:underline border-x border-gunmetal font-semibold w-[170px] py-2'>
			Home
		</button>
	);
};
