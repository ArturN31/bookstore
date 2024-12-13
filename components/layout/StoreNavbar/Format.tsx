'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export const Format = () => {
	const [formats, setFormats] = useState<{ formats: string[] }>();
	const [open, setOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement | null>(null);
	const router = useRouter();

	const getGenres = async () => {
		const formatsResponse = await axios.get('http://localhost:3000/api/formats');
		setFormats(formatsResponse.data);
	};

	useEffect(() => {
		getGenres();
	}, []);

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
		<div className='w-fit'>
			<button
				className={`hover:cursor-pointer hover:underline border-x border-gunmetal font-semibold w-[170px] py-2 ${
					open ? 'underline' : ''
				}`}
				onClick={() => {
					setOpen(!open);
				}}
				onBlur={handleBlur}>
				Format
			</button>
			{/* Dropdown list */}
			{open ? (
				<div
					className='absolute border grid grid-flow-row-dense grid-cols-2 border-black text-center bg-white p-1 rounded-b-md'
					ref={dropdownRef}
					tabIndex={-1}>
					{/* list choices */}
					{formats?.formats.sort().map((format) => {
						return (
							<button
								className=' hover:bg-slate-200 hover:cursor-pointer rounded-sm w-full px-4'
								key={format}
								onClick={(e) => {
									handleChoice(e);
									setOpen(!open);
								}}>
								{format}
							</button>
						);
					})}
				</div>
			) : (
				''
			)}
		</div>
	);
};
