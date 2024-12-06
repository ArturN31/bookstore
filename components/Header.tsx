import Image from 'next/image';
import logo from './../public/logo.jpg';

export const Header = () => {
	return (
		<div className='border border-black'>
			<div className='md:flex md:gap-5 grid items-center bg-[#20272F]'>
				<Image
					className='rounded-full md:mx-2 m-auto'
					src={logo}
					width={150}
					alt='Books 4 You Logo'
				/>
				<div className='grid w-full justify-center'>
					<p className='text-3xl text-center text-white'>Easy Reading, Endless Possibilities.</p>
				</div>
				<div className='min-w-[100px] min-h-[30px]'></div>
			</div>
		</div>
	);
};
