import PersonRoundedIcon from '@mui/icons-material/PersonRounded';

export const UsernameInput = ({ username }: { username: string | null }) => {
	return (
		<div className='relative grid place-self-center w-full max-w-md'>
			<label
				htmlFor='username'
				className='inline-block text-gray-700 font-medium text-sm rounded-sm transition-colors duration-200 focus-within:bg-blue-100 focus-within:text-blue-700 px-1'>
				New Username
			</label>
			<div className='relative'>
				<div className='absolute top-2 pl-3 flex items-center pointer-events-none text-gray-400'>
					<PersonRoundedIcon aria-hidden='true' />
				</div>
				<input
					autoComplete='off'
					required
					type='text'
					id='username'
					name='username'
					placeholder='Enter your new username'
					defaultValue={username ? username : ''}
					className='block w-full pl-10 border border-gray-300 rounded-md py-2 focus:outline-none focus:border-blue-500 text-sm'
					aria-describedby='username-helper'
				/>
			</div>
			<p
				id='username-helper'
				className='text-gray-500 text-xs'>
				This will be your public display name.
			</p>
		</div>
	);
};
