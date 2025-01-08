export const TextField = ({
	placeholder,
	label,
	id,
	input,
	handleInputChange,
}: {
	placeholder: string;
	label: string;
	id: string;
	input: string;
	handleInputChange: (el: string, value: string) => void;
}) => {
	const handleInput = (e: any) => {
		const { value, id } = e.target;
		handleInputChange(id, value);
	};

	return (
		<div className='grid'>
			<label htmlFor={id}>{label}</label>
			<input
				type='text'
				id={id}
				placeholder={placeholder}
				value={input}
				onChange={handleInput}
				className='border border-black px-2 py-1'
			/>
		</div>
	);
};
