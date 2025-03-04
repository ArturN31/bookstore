'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { AddToCartCardForm } from './AddToCartCardForm';
import { RemoveFromCartCardForm } from './RemoveFromCartCardForm';

export const BookCardBody = ({
	book,
	loggedIn,
	profileExists,
}: {
	book: Book;
	loggedIn: boolean;
	profileExists: boolean;
}) => {
	const [hovered, setHovered] = useState(false);

	const handleHover = () => {
		setHovered(!hovered);
	};

	return (
		<div
			className={`relative border grid ${hovered && 'min-h-[calc(100%+30px)]'}`}
			onMouseEnter={() => {
				handleHover();
			}}
			onMouseLeave={() => {
				handleHover();
			}}>
			<div>
				<Link
					href={`/book/${book.id}`}
					className={`hover:border hover:bg-black/[0.05] `}>
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
					</div>
				</Link>
			</div>
			<div className={hovered ? 'absolute w-full bottom-0' : 'w-full relative'}>
				{hovered && (
					<div className='grid justify-center gap-3 p-3 bg-gunmetal text-white'>
						<p className='text-xs font-light text-center'>{book.format}</p>
						{book.addedToCart ? (
							<RemoveFromCartCardForm
								bookID={book.id}
								loggedIn={loggedIn}
								profileExists={profileExists}
							/>
						) : (
							<AddToCartCardForm
								bookID={book.id}
								loggedIn={loggedIn}
								profileExists={profileExists}
							/>
						)}
					</div>
				)}
			</div>
		</div>
	);
};
