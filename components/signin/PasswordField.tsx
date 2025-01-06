import { Eye, EyeClosed } from 'lucide-react';
import { useState } from 'react';

export const PasswordField = ({
	label,
	id,
	input,
	error,
	handleInputChange,
}: {
	label: string;
	id: string;
	input: string;
	error: boolean;
	handleInputChange: (el: string, value: string) => void;
}) => {
	const [visible, setVisible] = useState(false);

	const handleInput = (e: any) => {
		const { value, id } = e.target;
		handleInputChange(id, value);
	};

	const handleVisibility = (e: any) => {
		e.preventDefault();
		setVisible(!visible);
	};

	return (
		<div className='grid'>
			<label
				htmlFor={id}
				className={error ? 'text-red-500 font-semibold' : 'text-black'}>
				{label}
			</label>
			<div className='flex items-center'>
				<input
					type={visible ? 'text' : 'password'}
					id={id}
					placeholder={label}
					required
					value={input}
					onChange={handleInput}
					className={`border px-2 py-1 w-full ${error ? 'border-red-500 text-red-500' : 'border-black '}`}
				/>
				<button
					className='w-fit h-full px-1 border border-black border-l-0 hover:bg-gunmetal/15'
					onClick={handleVisibility}>
					{visible ? <Eye /> : <EyeClosed />}
				</button>
			</div>
		</div>
	);
};
