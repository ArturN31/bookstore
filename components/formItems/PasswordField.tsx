import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { useState } from 'react';
import KeyIcon from '@mui/icons-material/Key';

export const PasswordField = ({
	id,
	label,
	placeholder,
	defaultValue,
}: {
	id: string;
	label: string;
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
				className='inline-block text-gray-700 font-medium text-sm rounded-sm transition-colors duration-200 focus-within:bg-blue-100 focus-within:text-blue-700 px-1'>
				{label}
			</label>
			<div className='relative flex items-center'>
				<div className='absolute top-2 pl-3 flex items-center pointer-events-none text-gray-400'>
					<KeyIcon aria-hidden='true' />
				</div>
				<input
					required
					type={visible ? 'text' : 'password'}
					id={id}
					name={id}
					placeholder={placeholder}
					defaultValue={defaultValue}
					className='block w-full h-full pl-10 border border-gray-300 rounded-l-md py-2 focus:outline-none focus:border-blue-500 text-sm'
					aria-describedby={`${id}-helper`}
				/>
				<button
					className='block w-fit px-1 border border-l-0 border-gray-300 rounded-r-md py-2 text-sm hover:cursor-pointer'
					onClick={handleVisibility}>
					{!visible ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
				</button>
			</div>
		</div>
	);
};
