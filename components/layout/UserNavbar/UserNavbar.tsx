import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { UserBtn } from './UserBtn';

export const UserNavbar = () => {
	return (
		<div className='flex gap-3'>
			<div className='flex items-center relative'>
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
			</div>

			<div className='shadow-md rounded-full w-12 h-12 place-items-center grid bg-yellow hover:bg-yellow/[0.8] hover:border hover:border-black hover:cursor-pointer'>
				<ShoppingCartOutlinedIcon />
			</div>
			<UserBtn />
		</div>
	);
};
