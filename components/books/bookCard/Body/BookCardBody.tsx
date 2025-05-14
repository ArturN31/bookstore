'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { AddToCartCardForm } from './CartForm/AddToCartCardForm';
import { RemoveFromCartCardForm } from './CartForm/RemoveFromCartCardForm';

export const BookCardBody = ({
	book,
	profileExists,
	booksInCartAmount,
}: {
	book: Book;
	profileExists: boolean;
	booksInCartAmount: number;
}) => {
	const [hovered, setHovered] = useState(false);

	const { id, image_url, title, author, publisher, price, format, addedToCart } = book;

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
					href={`/book/${id}`}
					className={`hover:border hover:bg-black/[0.05] `}>
					<div className='bg-black'>
						<Image
							className='m-auto'
							src={image_url}
							alt={`The placeholder image for ${title}.`}
							width={200}
							height={200}></Image>
					</div>

					<div className='text-center grid gap-3 mb-8'>
						<p className='text-sm font-semibold'>{title}</p>
						<div className='grid gap-1'>
							<p className='text-xs font-light'>{author}</p>
							<p className='text-xs font-light'>{publisher}</p>
						</div>
						<p className='text-xl font-semibold'>{price}</p>
					</div>
				</Link>
			</div>
			<div className={hovered ? 'absolute w-full bottom-0' : 'w-full relative'}>
				{hovered && (
					<div className='grid justify-center gap-3 p-3 bg-gunmetal text-white'>
						<p className='text-xs font-light text-center'>{format}</p>
						{addedToCart ? (
							<RemoveFromCartCardForm
								bookID={id}
								profileExists={profileExists}
							/>
						) : (
							<AddToCartCardForm
								bookID={id}
								profileExists={profileExists}
								booksInCartAmount={booksInCartAmount}
							/>
						)}
					</div>
				)}
			</div>
		</div>
	);
};
