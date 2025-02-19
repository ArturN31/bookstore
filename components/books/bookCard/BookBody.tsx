'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export const BookBody = ({ book }: { book: Book }) => {
	const [hovered, setHovered] = useState(false);

	const handleHover = () => {
		setHovered(!hovered);
	};

	return (
		<div
			className='relative w-full'
			style={{ paddingBottom: hovered ? '100%' : 0 }}>
			<Link
				onMouseEnter={() => {
					handleHover();
				}}
				onMouseLeave={() => {
					handleHover();
				}}
				href={`/book/${book.id}`}
				className={`hover:border hover:bg-black/[0.05] ${hovered ? `absolute w-full` : ''}`}>
				<div className='bg-black'>
					<Image
						className='m-auto'
						src={book.image_url}
						alt={`The placeholder image for ${book.title}.`}
						width={200}
						height={200}></Image>
				</div>

				<div className='text-center grid gap-3 mb-8'>
					<p className='text-sm font-semibold'>{book.title}</p>
					<div className='grid gap-1'>
						<p className='text-xs font-light'>{book.author}</p>
						<p className='text-xs font-light'>{book.publisher}</p>
					</div>
					<p className='text-xl font-semibold'>{book.price}</p>

					{hovered ? (
						<div className='grid justify-center gap-3 p-3 bg-gunmetal text-white'>
							<p className='text-xs font-light text-center'>{book.format}</p>
							<button className='border px-2 py-1 cursor-pointer'>Add to cart</button>
						</div>
					) : (
						''
					)}
				</div>
			</Link>
		</div>
	);
};
