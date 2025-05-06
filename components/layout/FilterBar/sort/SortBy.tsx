'use client';

import { useBookFilter } from '@/providers/BookFilterProvider';
import { useRef, useState } from 'react';

export const SortBy = () => {
	const { filterType, toggleFilter } = useBookFilter();
	const [open, setOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement | null>(null);

	const SortChoices = [
		'Title: A-Z',
		'Title: Z-A',
		'Price: Low to High',
		'Price: High to Low',
		'Release Date: Newest to Oldest',
		'Release Date: Oldest to Newest',
		'Highest Avg. customer rating',
		'Lowest Avg. customer rating',
		'Best Sellers',
	] as const;

	const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
		if (dropdownRef.current && !dropdownRef.current.contains(e.relatedTarget as Node)) {
			setOpen(false);
		}
	};
	return (
		<>
			<button
				className={`hover:cursor-pointer hover:underline font-semibold py-2 px-6 ${open ? 'underline' : ''}`}
				onClick={() => {
					setOpen(!open);
				}}
				onBlur={handleBlur}>
				Sort By {filterType}
			</button>
			{open ? (
				<div
					className='absolute border border-gray-300 rounded-md shadow-md bg-white z-40 mt-1 min-w-[150px] max-h-[250px] overflow-y-auto'
					ref={dropdownRef}
					tabIndex={-1}>
					{SortChoices.map((choice) => (
						<button
							key={choice}
							className='block w-full text-left text-gray-700 px-4 py-2 hover:bg-gray-100 focus:outline-none'
							onClick={() => {
								toggleFilter(choice);
								setOpen(false);
							}}>
							{choice}
						</button>
					))}
				</div>
			) : (
				''
			)}
		</>
	);
};
