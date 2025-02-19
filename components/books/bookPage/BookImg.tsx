import Image from 'next/image';

export const BookImg = ({ image, title }: { image: string; title: string }) => {
	return (
		<div className='grid justify-center bg-black'>
			<Image
				width={300}
				height={400}
				src={image}
				alt={`Placeholed image for ${title}`}
			/>
		</div>
	);
};
