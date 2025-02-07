import { createClient } from '@/utils/db/client';
import { usePathname, useRouter } from 'next/navigation';
import { RefObject, useEffect, useState } from 'react';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';

import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';

export const Dropdown = ({ dropdownRef }: { dropdownRef: RefObject<HTMLDivElement | null> }) => {
	const [loggedIn, setLoggedIn] = useState(false);

	const supabase = createClient();
	const router = useRouter();
	const pathname = usePathname();

	const handleNavigation = (path: string) => {
		router.push(path);
	};

	const handleSignOut = async () => {
		try {
			const { error } = await supabase.auth.signOut();
			if (error) console.log(error);
			setLoggedIn(false);
			router.push('/');
		} catch (error) {
			console.log(error);
		}
	};

	useEffect(() => {
		supabase.auth.onAuthStateChange((event, session) => {
			if (event === 'SIGNED_IN') setLoggedIn(true);

			/*
			INITIAL_SESSION - indicates that the Supabase client has finished its initial setup and has checked for any existing user session
			
            User is already signed in: If a valid session is found, the INITIAL_SESSION event will be emitted, and you can proceed with actions for a signed-in user.

            User is not signed in: If no valid session is found, the INITIAL_SESSION event will still be emitted, but the session object within the event data will be null or undefined.
            */
			if (event === 'INITIAL_SESSION' && session) setLoggedIn(true);
			console.log(event);
		});
	}, []);

	const activeRoute = 'bg-slate-100 font-semibold';

	return (
		<div
			className='my-2 p-1 bg-white border border-black text-center absolute w-[175px] lg:translate-x-[-150px] translate-x-[-150px] sm:translate-x-[-76px] rounded-md'
			ref={dropdownRef}
			tabIndex={-1}>
			{loggedIn ? (
				<>
					<button
						className={`w-full hover:bg-slate-200 hover:cursor-pointer hover:font-semibold hover:rounded-sm ${
							pathname === '/user/profile' ? activeRoute : ''
						}`}
						onClick={() => {
							handleNavigation('/user/profile');
						}}>
						<p className='grid grid-cols-12'>
							<span className='col-span-10'>User Profile</span>
							<ManageAccountsIcon />
						</p>
					</button>
					<button
						className={`w-full hover:bg-slate-200 hover:cursor-pointer hover:font-semibold hover:rounded-sm ${
							pathname === '/user/wishlist' ? activeRoute : ''
						}`}
						onClick={() => {
							handleNavigation('/user/wishlist');
						}}>
						<p className='grid grid-cols-12 justify-items-center'>
							<span className='col-span-10'>Wishlist</span>
						</p>
					</button>
					<button
						className='w-full hover:bg-slate-200 hover:cursor-pointer hover:font-semibold hover:rounded-sm'
						onClick={() => {
							handleSignOut();
						}}>
						<p className='grid grid-cols-12 justify-items-center'>
							<span className='col-span-10'>Sign Out</span>
							<LogoutIcon />
						</p>
					</button>
				</>
			) : (
				<button
					className={`w-full hover:bg-slate-200 hover:cursor-pointer hover:font-semibold hover:rounded-sm ${
						pathname === '/user/auth/signin' ? activeRoute : ''
					}`}
					onClick={() => {
						handleNavigation('/user/auth/signin');
					}}>
					<p className='grid grid-cols-12 justify-items-center'>
						<span className='col-span-10'>Sign In</span>
						<LoginIcon />
					</p>
				</button>
			)}
		</div>
	);
};
