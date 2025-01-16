'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

export const DropdownList = ({ genres }: { genres: { genres: string[] } }) => {
	const [open, setOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement | null>(null);
	const router = useRouter();

	const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
		if (dropdownRef.current && !dropdownRef.current.contains(e.relatedTarget as Node)) {
			setOpen(false);
		}
	};

	const handleChoice = (e: React.MouseEvent<HTMLButtonElement>) => {
		const choice = e.currentTarget.innerText;
		router.push(`/books/genre/${choice}`);
	};

	return (
		<>
			<button
				className={`hover:cursor-pointer hover:underline border-x border-gunmetal font-semibold w-[170px] py-2 ${
					open ? 'underline' : ''
				}`}
				onClick={() => {
					setOpen(!open);
				}}
				onBlur={handleBlur}>
				Genre
			</button>
			{/* Dropdown list */}
			{open ? (
				<div
					className='absolute border grid grid-flow-row-dense grid-cols-3 border-black text-center bg-white p-1 rounded-b-md'
					ref={dropdownRef}
					tabIndex={-1}>
					{/* list choices */}
					{genres?.genres.sort().map((genre) => {
						return (
							<button
								className=' hover:bg-slate-200 hover:cursor-pointer rounded-sm w-full px-4'
								key={genre}
								onClick={(e) => {
									handleChoice(e);
									setOpen(!open);
								}}>
								{genre}
							</button>
						);
					})}
				</div>
			) : (
				''
			)}
		</>
	);
};
