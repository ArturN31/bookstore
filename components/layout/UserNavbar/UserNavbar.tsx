import { SearchBar } from './SearchBar/SearchBar';
import { CartBtn } from './CartBtn/CartBtn';
import { UserBtn } from './UserBtn/UserBtn';
import { getUserDataProperty, isLoggedIn } from '@/data/user/GetUserData';

export const UserNavbar = async () => {
	const userID = await getUserDataProperty('id');
	const loggedIn = await isLoggedIn(userID);

	return (
		<div className='grid gap-3 sm:auto-cols-auto sm:grid-flow-col grid-cols-1'>
			<SearchBar />
			<div className='flex gap-3 justify-center'>
				<CartBtn />
				<UserBtn loggedIn={loggedIn} />
			</div>
		</div>
	);
};
