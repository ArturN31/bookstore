import { Edit } from '@mui/icons-material';
import EditLocationOutlinedIcon from '@mui/icons-material/EditLocationOutlined';
import LockPersonOutlinedIcon from '@mui/icons-material/LockPersonOutlined';
import Link from 'next/link';

export const QuickActions = () => {
	return (
		<div className='bg-white shadow-md rounded-lg p-6 w-fit'>
			<h2 className='text-lg font-semibold text-gray-800 mb-4'>Quick Actions</h2>
			<div className='flex flex-col gap-3'>
				<Link
					href={'/user/auth/change_password'}
					className='bg-gray-50 rounded-md p-3 flex items-center gap-3 hover:bg-slate-100 transition duration-150'>
					<LockPersonOutlinedIcon className='text-indigo-500' />
					<p className='font-semibold text-gray-700'>Change Password</p>
				</Link>
				<Link
					href={'/user/profile/change_address'}
					className='bg-gray-50 rounded-md p-3 flex items-center gap-3 hover:bg-slate-100 transition duration-150'>
					<EditLocationOutlinedIcon className='text-green-500' />
					<p className='font-semibold text-gray-700'>Change Address</p>
				</Link>
				<Link
					href={'/user/profile/change_username'}
					className='bg-gray-50 rounded-md p-3 flex items-center gap-3 hover:bg-slate-100 transition duration-150'
					aria-label='Change Username'
					title='Change Username'>
					<Edit className='text-gray-700' />
					<p className='font-semibold text-gray-700'>Change Username</p>
				</Link>
			</div>
		</div>
	);
};
