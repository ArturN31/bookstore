export const EmailField = ({
	input,
	handleInputChange,
}: {
	input: string;
	handleInputChange: (el: string, value: string) => void;
}) => {
	const handleInput = (e: any) => {
		const { value, id } = e.target;
		handleInputChange(id, value);
	};

	return (
		<div className='grid'>
			<label htmlFor='email'>Email</label>
			<input
				type='email'
				id='email'
				placeholder='Email'
				required
				value={input}
				onChange={handleInput}
				className='border border-black px-2 py-1'
			/>
		</div>
	);
};
