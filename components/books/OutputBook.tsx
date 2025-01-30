import Image from 'next/image';

export const OutputBook = ({ book }: { book: Book }) => {
	return (
		<div className='border w-[200px]'>
			<div className='bg-black'>
				<Image
					className='m-auto'
					src={book.image_url}
					alt=''
					width={200}
					height={200}></Image>
			</div>
			<div className='text-center grid-5 p-2'>
				<p>{book.title}</p>
				<p>{book.price}</p>
			</div>
		</div>
	);
};
