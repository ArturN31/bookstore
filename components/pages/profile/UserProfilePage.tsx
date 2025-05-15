'use client';

import { useUserState } from '@/providers/UserProvider';
import { QuickActions } from './QuickActions';
import { UserDetails } from './UserDetails';
import Link from 'next/link';

import { Edit } from '@mui/icons-material';

export const UserProfilePage = ({ userData, userEmail }: { userData: User; userEmail: string }) => {
	const { username } = useUserState();

	return (
		<div className='bg-gray-100 py-10'>
			<div className='px-8 space-y-8'>
				<div className='w-fit flex flex-col gap-8 place-self-center'>
					<div className='flex gap-8'>
						<div className='bg-white rounded-lg shadow-md p-6 flex flex-col justify-center'>
							<p className='text-lg text-gray-700 font-semibold mb-1'>Welcome back,</p>
							<p className='text-xl text-indigo-600 font-bold'>{username}!</p>
						</div>
						<QuickActions />
					</div>
					<UserDetails
						userData={userData}
						userEmail={userEmail}
					/>
				</div>
			</div>
		</div>
	);
};
