'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

export const DropdownList = ({ genres, message }: { genres: string[] | undefined; message: string | undefined }) => {
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
				className={`hover:cursor-pointer hover:underline font-semibold py-2 px-4 ${open ? 'underline' : ''}`}
				onClick={() => setOpen(!open)}
				onBlur={handleBlur}>
				Genre
			</button>
			{open && (
				<div
					className='absolute border border-gray-300 rounded-md shadow-md bg-white z-40 mt-1 min-w-[150px] max-h-[250px] overflow-y-auto'
					ref={dropdownRef}
					tabIndex={-1}>
					{genres?.sort().map((genre) => (
						<button
							className='block w-full text-left text-gray-700 px-4 py-2 hover:bg-gray-100 focus:outline-none'
							key={genre}
							onClick={handleChoice}>
							{genre}
						</button>
					))}
					{message && <p className='px-4 py-2 text-sm text-gray-500'>{message}</p>}
				</div>
			)}
		</>
	);
};
