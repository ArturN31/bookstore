import SearchIcon from '@mui/icons-material/Search';

export const SearchInput = ({ input, handleInput }: { input: string; handleInput: (e: any) => void }) => {
	return (
		<div className='flex items-center relative'>
			<input
				className='w-[300px] bg-white h-12 px-3 py-2 rounded-md pr-14 focus:outline-yellow'
				type='text'
				placeholder='Search B4U'
				value={input}
				onChange={(e) => handleInput(e)}
				name=''
				id=''
			/>
			{/* <div className='shadow-md h-full w-12 rounded-r-md place-items-center grid bg-yellow hover:bg hover:border hover:border-black hover:cursor-pointer absolute right-0 hover:bg-[#D9AF08]'>
				<SearchIcon />
			</div> */}
		</div>
	);
};
