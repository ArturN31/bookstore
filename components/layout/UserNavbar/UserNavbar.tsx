import { SearchBar } from './SearchBar/SearchBar';
import { CartBtn } from './CartBtn/CartBtn';
import { UserBtn } from './UserBtn/UserBtn';
import { getUserDataProperty, isLoggedIn } from '@/data/user/GetUserData';

export const UserNavbar = async () => {
	const userID = await getUserDataProperty('id');
	const loggedIn = await isLoggedIn(userID);

	return (
		<div className='flex gap-3'>
			<SearchBar />
			<CartBtn />
			<UserBtn loggedIn={loggedIn} />
		</div>
	);
};
