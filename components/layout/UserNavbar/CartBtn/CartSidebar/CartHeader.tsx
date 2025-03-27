import CloseIcon from '@mui/icons-material/Close';

export const CartHeader = ({ handleCloseCart }: { handleCloseCart: () => void }) => {
	return (
		<div className='flex items-center justify-between bg-gunmetal border-b border-gray-700 p-4 shadow-md'>
			<h2 className='text-xl font-semibold text-white'>Your Cart</h2>
			<button
				className='hover:bg-gray-700 text-gray-300 rounded-full p-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer'
				onClick={handleCloseCart}
				aria-label='Close cart'>
				<CloseIcon className='text-gray-300' />
			</button>
		</div>
	);
};
