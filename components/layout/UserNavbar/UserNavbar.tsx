import { SearchBar } from './SearchBar/SearchBar';
import { UserBtn } from './UserBtn';
import { CartBtn } from './CartBtn';

export const UserNavbar = () => {
	return (
		<div className='grid gap-3 sm:auto-cols-auto sm:grid-flow-col grid-cols-1'>
			<SearchBar />
			<div className='flex gap-3 justify-center'>
				<CartBtn />
				<UserBtn />
			</div>
		</div>
	);
};
