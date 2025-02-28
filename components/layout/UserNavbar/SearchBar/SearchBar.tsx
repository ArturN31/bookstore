import SearchIcon from '@mui/icons-material/Search';

export const SearchBar = () => {
	return (
		<div className='grid relative'>
			<form className='flex items-center relative'>
				<input
					className='w-[300px] bg-white h-12 px-3 py-2 rounded-md pr-14 focus:outline-yellow'
					type='text'
					placeholder='Search B4U'
					name=''
					id=''
				/>
				<div className='shadow-md h-full w-12 rounded-r-md place-items-center grid bg-yellow hover:bg hover:border hover:border-black hover:cursor-pointer absolute right-0 hover:bg-[#D9AF08]'>
					<SearchIcon />
				</div>
			</form>
			{/* <div className='bg-white rounded-md border px-3 py-1 absolute mt-12 w-full'>asd</div> */}
		</div>
	);
};
