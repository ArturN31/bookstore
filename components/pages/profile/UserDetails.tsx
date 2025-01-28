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
		<>
			<div className='border border-black text-center flex flex-col gap-3 justify-center p-5 rounded-md shadow-[0px_2px_6px_-2px_#000] w-[250px]'>
				<p className='text-2xl'>
					{first_name} {last_name}
				</p>

				<div>
					<p className='font-semibold'>Date of Birth:</p>
					<p>{new Date(date_of_birth).toDateString()}</p>
				</div>
			</div>

			<div className='border border-black text-center flex flex-col justify-center p-5 rounded-md shadow-[0px_2px_6px_-2px_#000] w-[250px]'>
				<p className='font-semibold'>Address:</p>
				<p>{street_address}</p>
				<p>{postcode}</p>
				<p>
					{city}, {country}
				</p>
			</div>

			<div className='border border-black text-center flex flex-col justify-center p-5 rounded-md shadow-[0px_2px_6px_-2px_#000] w-[250px]'>
				<p className='font-semibold'>Contact details:</p>
				<p>{phone_number}</p>
				<p>{userEmail}</p>
			</div>
		</>
	);
};
