export const FormBtns = ({
	isTransitioningSubmit,
	isTransitioningReset,
	handleReset,
}: {
	isTransitioningSubmit: boolean;
	isTransitioningReset: boolean;
	handleReset: () => Promise<void>;
}) => {
	return (
		<div className='flex justify-end gap-3 pt-4'>
			<button
				type='submit'
				className='bg-yellow hover:bg-yellow-[0.8] text-black font-semibold rounded-md px-5 py-2 focus:outline-none focus:ring-2 duration-200 text-sm disabled:opacity-50 cursor-pointer'
				disabled={isTransitioningSubmit}>
				{isTransitioningSubmit ? 'Saving...' : 'Save'}
			</button>
			<button
				type='reset'
				onClick={handleReset}
				className='border border-gray-300 hover:bg-gray-100 text-black font-semibold rounded-md px-5 py-2 focus:outline-none focus:ring-2 focus-ring-gray-300 transition-colors duration-200 text-sm disabled:opacity-50 cursor-pointer'
				disabled={isTransitioningReset}>
				{isTransitioningReset ? 'Clearing...' : 'Clear'}
			</button>
		</div>
	);
};
