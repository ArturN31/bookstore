export const TextInput = ({ id, label, defaultValue }: { id: string; label: string; defaultValue: string }) => {
	return (
		<div
			className='grid'
			key={id}>
			<label htmlFor={id}>{label}</label>
			<input
				required
				type='text'
				id={id}
				name={id}
				placeholder={label}
				defaultValue={defaultValue}
				className={`border border-black px-2 py-1 ${id === 'postcode' ? 'uppercase placeholder:normal-case' : ''}`}
			/>
		</div>
	);
};
