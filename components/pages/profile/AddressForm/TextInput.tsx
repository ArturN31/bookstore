export const TextInput = ({ id, label, defaultValue }: { id: string; label: string; defaultValue: string }) => {
	return (
		<div className='relative grid place-self-center w-full max-w-md'>
			<label
				htmlFor={id}
				className='inline-block text-gray-700 font-medium text-sm rounded-sm transition-colors duration-200 focus-within:bg-blue-100 focus-within:text-blue-700 px-1'>
				{label}
			</label>
			<input
				autoComplete='off'
				required
				type='text'
				id={id}
				name={id}
				placeholder={label}
				defaultValue={defaultValue}
				className={`block w-full pl-1 border border-gray-300 rounded-md py-2 focus:outline-none focus:border-blue-500 text-sm ${
					id === 'postcode' ? 'uppercase placeholder:normal-case' : ''
				}`}
			/>
		</div>
	);
};
