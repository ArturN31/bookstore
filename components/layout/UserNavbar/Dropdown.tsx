import { createClient } from '@/utils/db/client';
import { usePathname, useRouter } from 'next/navigation';
import { RefObject, useEffect, useState } from 'react';

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
		});
	}, []);

	const activeRoute = 'bg-slate-100 font-semibold';

	return (
		<div
			className='my-2 p-1 bg-white border border-black text-center absolute w-[200px] lg:translate-x-[-150px] translate-x-[-150px] sm:translate-x-[-76px] rounded-md'
			ref={dropdownRef}
			tabIndex={-1}>
			{loggedIn ? (
				<>
					<button
						className={`w-full hover:bg-slate-200 hover:font-semibold hover:rounded-sm ${
							pathname === '/user/profile' ? activeRoute : ''
						}`}
						onClick={() => {
							handleNavigation('/user/profile');
						}}>
						User Profile
					</button>
					<button
						className='w-full hover:bg-slate-200 hover:font-semibold hover:rounded-sm'
						onClick={() => {
							handleSignOut();
						}}>
						Sign Out
					</button>
				</>
			) : (
				<button
					className={`w-full hover:bg-slate-200 hover:font-semibold hover:rounded-sm ${
						pathname === '/user/auth/signin' ? activeRoute : ''
					}`}
					onClick={() => {
						handleNavigation('/user/auth/signin');
					}}>
					Sign In
				</button>
			)}
		</div>
	);
};
