export const DateOfBirthInput = ({ dob }: { dob: string }) => {
	return (
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
				defaultValue={dob ?? ''}
				className='block w-full pl-1 border border-gray-300 rounded-md py-2 focus:outline-none focus:border-blue-500 text-sm text-gray-500'
				style={{ textAlign: 'left' }}
			/>
		</div>
	);
};
