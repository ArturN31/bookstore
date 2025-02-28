import Image from 'next/image';

export const BookImg = ({ image, title }: { image: string; title: string }) => {
	return (
		<div className='grid justify-center bg-black rounded-md shadow-[0px_2px_6px_-2px_#000]'>
			<Image
				width='0'
				height='0'
				sizes='100vw'
				style={{ width: '100%', height: 'auto' }}
				src={image}
				alt={`Placeholed image for ${title}`}
			/>
		</div>
	);
};
