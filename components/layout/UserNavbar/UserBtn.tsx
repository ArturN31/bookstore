import { User } from 'lucide-react';
import { useRef, useState } from 'react';
import { Dropdown } from './Dropdown';

export const UserBtn = () => {
	const [open, setOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement | null>(null);

	const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
		if (dropdownRef.current && !dropdownRef.current.contains(e.relatedTarget as Node)) {
			setOpen(false);
		}
	};

	return (
		<div>
			<button
				className={`shadow-md rounded-full w-12 h-12 place-items-center grid bg-yellow hover:bg-yellow/[0.8] hover:border hover:border-black hover:cursor-pointer ${
					open ? 'bg-yellow/[0.8] border border-black' : ''
				}`}
				onClick={() => {
					setOpen(!open);
				}}
				onBlur={handleBlur}>
				<User />
			</button>
			{/* Dropdown */}
			{open ? <Dropdown dropdownRef={dropdownRef} /> : ''}
		</div>
	);
};
