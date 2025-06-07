import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';

export const EmailField = ({ email }: { email: string }) => {
	return (
		<div className='relative grid place-self-center w-full max-w-md'>
			<label
				htmlFor='email'
				className='inline-block text-gray-700 font-medium text-sm rounded-sm transition-colors duration-200 focus-within:bg-blue-100 focus-within:text-blue-700 px-1'>
				Email
			</label>

			<div className='relative'>
				<div className='absolute top-2 pl-3 flex items-center pointer-events-none text-gray-400'>
					<AlternateEmailIcon aria-hidden='true' />
				</div>
				<input
					required
					type='email'
					id='email'
					name='email'
					placeholder='Email'
					defaultValue={email}
					className='block w-full pl-10 border border-gray-300 rounded-md py-2 focus:outline-none focus:border-blue-500 text-sm'
				/>
			</div>
		</div>
	);
};
