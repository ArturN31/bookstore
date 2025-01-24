import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export const PasswordField = ({
	id,
	placeholder,
	defaultValue,
}: {
	id: string;
	placeholder: string;
	defaultValue: string;
}) => {
	const [visible, setVisible] = useState(false);

	const handleVisibility = (e: any) => {
		e.preventDefault();
		setVisible(!visible);
	};

	return (
		<div className='grid'>
			<label
				htmlFor={id}
				className='text-black'>
				{placeholder}
			</label>
			<div className='flex items-center'>
				<input
					required
					type={visible ? 'text' : 'password'}
					id={id}
					name={id}
					placeholder={placeholder}
					defaultValue={defaultValue}
					className='border border-black px-2 py-1 w-full'
				/>
				<button
					className='w-fit h-full px-1 border border-black border-l-0 hover:bg-gunmetal/15'
					onClick={handleVisibility}>
					{!visible ? <Eye /> : <EyeOff />}
				</button>
			</div>
		</div>
	);
};
