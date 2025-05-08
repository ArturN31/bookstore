import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CakeIcon from '@mui/icons-material/Cake';
import HomeIcon from '@mui/icons-material/Home';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';

export const UserDetails = ({
	userData,
	userEmail,
}: {
	userData: {
		first_name: string;
		last_name: string;
		street_address: string;
		postcode: string;
		city: string;
		country: string;
		phone_number: string;
		date_of_birth: string;
	};
	userEmail: string;
}) => {
	const { first_name, last_name, street_address, postcode, city, country, phone_number, date_of_birth } = userData;
	return (
		<div className='bg-white shadow-md rounded-lg p-6 md:col-span-2 lg:col-span-2 flex flex-col gap-5'>
			<h2 className='text-xl font-semibold text-gray-800 mb-4'>User Details</h2>
			<div className='bg-gray-50 rounded-md p-4 flex gap-4'>
				<PersonOutlineIcon className='text-indigo-500 h-6 w-6 shrink-0' />
				<div className='flex flex-col'>
					<p className='font-semibold text-gray-700 text-sm'>Name:</p>
					<p className='text-gray-600'>
						{first_name} {last_name}
					</p>
				</div>
			</div>
			<div className='bg-gray-50 rounded-md p-4 flex gap-4'>
				<CakeIcon className='text-green-500 h-6 w-6 shrink-0' />
				<div className='flex flex-col'>
					<p className='font-semibold text-gray-700 text-sm'>Born:</p>
					<p className='text-gray-600'>{new Date(date_of_birth).toLocaleDateString()}</p>
				</div>
			</div>
			<div className='bg-gray-50 rounded-md p-4 flex gap-4'>
				<HomeIcon className='text-blue-500 h-6 w-6 shrink-0' />
				<div className='flex flex-col'>
					<p className='font-semibold text-gray-700 text-sm'>Address:</p>
					<p className='text-gray-600'>
						{street_address}, {city}, {country}
					</p>
				</div>
			</div>
			<div
				className='bg-gray-50 rounded-md p-4 flex gap-4'
				aria-labelledby='addressHeading'>
				<PhoneIcon
					className='h-5 w-5 text-indigo-500 shrink-0'
					aria-hidden='true'
				/>
				<div className='flex flex-col'>
					<p className='font-semibold text-gray-700 text-sm'>Phone:</p>
					<p className='text-gray-600'>{phone_number}</p>
				</div>
			</div>
			<div className='bg-gray-50 rounded-md p-4 flex gap-4'>
				<EmailIcon className='h-5 w-5 text-green-500 shrink-0' />
				<div className='flex flex-col'>
					<p className='font-semibold text-gray-700 text-sm'>Email:</p>
					<p className='text-gray-600'>{userEmail}</p>
				</div>
			</div>
		</div>
	);
};
