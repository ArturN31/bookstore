import { User } from 'lucide-react';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export const UserBtn = () => {
	const [open, setOpen] = useState(false);
	const router = useRouter();
	const dropdownRef = useRef<HTMLDivElement | null>(null);

	const handleClick = () => {
		router.push('/user/auth/signin');
	};

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
			{open ? (
				<div
					className='my-2 p-1 bg-white border border-black text-center absolute w-[200px] lg:translate-x-[-150px] translate-x-[-150px] sm:translate-x-[-76px] rounded-md'
					ref={dropdownRef}
					tabIndex={-1}>
					<button
						className='w-full hover:bg-slate-200 hover:font-semibold hover:rounded-sm'
						onClick={() => {
							handleClick();
						}}>
						Sign In
					</button>
				</div>
			) : (
				''
			)}
		</div>
	);
};
