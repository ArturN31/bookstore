import Image from 'next/image';
import logo from './../../public/logo.jpg';
import { UserNavbar } from './UserNavbar/UserNavbar';
import Link from 'next/link';
import { FilterBar } from './FilterBar/FilterBar';

export const Header = () => {
	return (
		<nav>
			<div className='lg:flex grid lg:gap-0 gap-8 lg:justify-between justify-center bg-gunmetal select-none'>
				<div className='md:flex grid items-center md:gap-5 gap-0 px-5'>
					<Link
						className='rounded-full hover:cursor-pointer'
						href='/'>
						<Image
							className='m-auto rounded-full'
							src={logo}
							width={150}
							alt='Books 4 You Logo'
						/>
					</Link>
					<div className='text-3xl text-white text-center'>
						<p>Easy Reading,</p>
						<p>Endless Possibilities.</p>
					</div>
				</div>
				<div className='grid items-center px-8 lg:pb-0 pb-8'>
					<UserNavbar />
				</div>
			</div>
			<div className='bg-moonstone'>
				<FilterBar />
			</div>
		</nav>
	);
};
