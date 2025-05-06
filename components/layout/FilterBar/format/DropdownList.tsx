'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

export const DropdownList = ({ formats, message }: { formats: string[] | undefined; message: string | undefined }) => {
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
		router.push(`/books/format/${choice}`);
	};

	return (
		<>
			<button
				className={`hover:cursor-pointer hover:underline font-semibold py-2 px-6 ${open ? 'underline' : ''}`}
				onClick={() => {
					setOpen(!open);
				}}
				onBlur={handleBlur}>
				Format
			</button>
			{open ? (
				<div
					className='absolute border border-gray-300 rounded-md shadow-md bg-white z-40 mt-1 min-w-[150px] max-h-[250px] overflow-y-auto'
					ref={dropdownRef}
					tabIndex={-1}>
					{formats?.sort().map((format) => {
						return (
							<button
								className='block w-full text-left text-gray-700 px-4 py-2 hover:bg-gray-100 focus:outline-none'
								key={format}
								onClick={(e) => {
									handleChoice(e);
									setOpen(!open);
								}}>
								{format}
							</button>
						);
					})}
					{message ? <p>{message}</p> : ''}
				</div>
			) : (
				''
			)}
		</>
	);
};
