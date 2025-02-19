export const BookDescription = ({ description }: { description: string }) => {
	return (
		<div>
			<p className='text-lg font-semibold'>Description</p>
			<p className='text-justify'>{description}</p>
		</div>
	);
};
