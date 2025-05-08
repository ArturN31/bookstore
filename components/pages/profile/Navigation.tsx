import EditLocationOutlinedIcon from '@mui/icons-material/EditLocationOutlined';
import LockPersonOutlinedIcon from '@mui/icons-material/LockPersonOutlined';
import Link from 'next/link';

export const Navigation = () => {
	return (
		<div className='bg-white shadow-md rounded-lg p-6 w-fit'>
			<h2 className='text-lg font-semibold text-gray-800 mb-4'>Quick Actions</h2>
			<div className='flex flex-col gap-3'>
				<Link
					href={'/user/auth/change_password'}
					className='bg-gray-50 rounded-md p-3 flex items-center gap-3 hover:bg-slate-100 transition duration-150'>
					<div className='text-indigo-500'>
						<LockPersonOutlinedIcon />
					</div>
					<p className='font-semibold text-gray-700'>Change Password</p>
				</Link>
				<Link
					href={'/user/profile/change_address'}
					className='bg-gray-50 rounded-md p-3 flex items-center gap-3 hover:bg-slate-100 transition duration-150'>
					<div className='text-green-500'>
						<EditLocationOutlinedIcon />
					</div>
					<p className='font-semibold text-gray-700'>Change Address</p>
				</Link>
			</div>
		</div>
	);
};
