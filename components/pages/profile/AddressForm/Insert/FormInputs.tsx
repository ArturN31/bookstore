import { TextInput } from '../TextInput';

export const FormInputs = ({
	firstName,
	lastName,
	dob,
	phoneNumber,
	streetAddress,
	postcode,
	city,
	country,
}: {
	firstName: string;
	lastName: string;
	dob: string;
	phoneNumber: string;
	streetAddress: string;
	postcode: string;
	city: string;
	country: string;
}) => {
	return (
		<>
			<div className='flex justify-between gap-3'>
				{[
					{
						label: 'First Name',
						id: 'firstName',
						defaultValue: firstName,
					},
					{
						label: 'Last Name',
						id: 'lastName',
						defaultValue: lastName,
					},
				].map((el) => (
					<TextInput
						key={el.id}
						label={el.label}
						id={el.id}
						defaultValue={el.defaultValue}
					/>
				))}
			</div>

			<div className='flex justify-between gap-3'>
				<div className='relative grid place-self-center w-full max-w-md'>
					<label
						htmlFor='dob'
						className='inline-block text-gray-700 font-medium text-sm rounded-sm transition-colors duration-200 focus-within:bg-blue-100 focus-within:text-blue-700 px-1'>
						Date of Birth
					</label>

					<input
						autoComplete='off'
						required
						type='date'
						id='dob'
						name='dob'
						defaultValue={dob}
						className='block w-full pl-1 border border-gray-300 rounded-md py-2 focus:outline-none focus:border-blue-500 text-sm text-gray-500'
						style={{ textAlign: 'left' }}
					/>
				</div>
				<TextInput
					key='phoneNumber'
					label='Phone Number'
					id='phoneNumber'
					defaultValue={phoneNumber}
				/>
			</div>

			<div className='flex justify-between gap-3'>
				{[
					{
						label: 'Street Address',
						id: 'streetAddress',
						defaultValue: streetAddress,
					},
					{
						label: 'Postcode',
						id: 'postcode',
						defaultValue: postcode,
					},
				].map((el) => (
					<TextInput
						key={el.id}
						label={el.label}
						id={el.id}
						defaultValue={el.defaultValue}
					/>
				))}
			</div>

			<div className='flex justify-between gap-3'>
				{[
					{
						label: 'City',
						id: 'city',
						defaultValue: city,
					},
					{
						label: 'Country',
						id: 'country',
						defaultValue: country,
					},
				].map((el) => (
					<TextInput
						key={el.id}
						label={el.label}
						id={el.id}
						defaultValue={el.defaultValue}
					/>
				))}
			</div>
		</>
	);
};
