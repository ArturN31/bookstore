import { KeyRound, MapPinHouse } from 'lucide-react';
import Link from 'next/link';

export const Navigation = () => {
	return (
		<>
			<Link
				href={'/user/auth/change_password'}
				className='flex w-fit rounded-md bg-slate-100 hover:bg-slate-200 shadow-[-0px_2px_4px_-2px_#000] hover:shadow-[0px_0px_4px_-2px_#000]'>
				<div className='border border-black rounded-l-md px-2 py-1 text-lg'>Change Password</div>
				<div className='border-y border-r border-black rounded-r-md  px-2 py-1'>
					<KeyRound />
				</div>
			</Link>
			<Link
				href={'/user/profile/change_address'}
				className='flex w-fit rounded-md bg-slate-100 hover:bg-slate-200 shadow-[-0px_2px_4px_-2px_#000] hover:shadow-[0px_0px_4px_-2px_#000]'>
				<div className='border border-black rounded-l-md px-2 py-1 text-lg'>Change Address</div>
				<div className='border-y border-r border-black rounded-r-md  px-2 py-1'>
					<MapPinHouse />
				</div>
			</Link>
		</>
	);
};
