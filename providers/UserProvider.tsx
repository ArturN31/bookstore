'use client';

import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { createClient } from '@/utils/db/client';
import { getUserData } from '@/data/user/GetUserData';
import { Session } from '@supabase/supabase-js';

type UserProvider = {
	username: string;
	loggedIn: boolean;
	clearUsername: () => void;
	toggleLoggedIn: (newState: boolean) => void;
	loading: boolean;
	error: string | null;
};

const UserContext = createContext<UserProvider>({
	username: '',
	loggedIn: false,
	clearUsername: () => {},
	toggleLoggedIn: () => {},
	loading: false,
	error: null,
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
	const supabase = createClient();
	const [username, setUsername] = useState<string>('');
	const [loggedIn, setLoggedIn] = useState<boolean>(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const handleSessionChange = async (session: Session | null) => {
		setError(null);
		if (session?.user) {
			try {
				const userData = await getUserData();
				const newUsername = userData?.username;
				setLoggedIn(true);
				setUsername(newUsername || '');
			} catch (err: any) {
				console.error('Error fetching user data:', err);
				setError('Failed to fetch user data. Please try again later.');
				setLoggedIn(false);
				setUsername('');
			}
		} else {
			setLoggedIn(false);
			setUsername('');
		}
	};

	useEffect(() => {
		const fetchInitialUser = async () => {
			setError(null);
			setLoading(true);
			try {
				const {
					data: { session },
				} = await supabase.auth.getSession();
				await handleSessionChange(session);
			} catch (err: any) {
				console.error('Error fetching initial session:', err);
				setError('Failed to load initial user session.');
			} finally {
				setLoading(false);
			}
		};

		fetchInitialUser();

		//listen for user table changes
		const channel = supabase
			.channel('custom-insert-channel')
			.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, async (payload) => {
				console.log('New user inserted:', payload);
				const {
					data: { session },
				} = await supabase.auth.getSession();
				await handleSessionChange(session);
			})
			.subscribe();

		//listen for auth state changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
				handleSessionChange(session);
			}
		});

		return () => {
			subscription?.unsubscribe();
			channel.unsubscribe();
		};
	}, [supabase]);

	const contextValue = useMemo(
		() => ({
			username,
			loggedIn,
			clearUsername: () => {
				setUsername('');
			},
			toggleLoggedIn: (newState: boolean) => {
				setLoggedIn(newState);
			},
			loading,
			error,
		}),
		[username, loggedIn, loading, error],
	);

	if (loading) return <div className='text-red-500'>{loading}</div>;
	if (error) return <div className='text-red-500'>{error}</div>;
	return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

export const useUserState = () => useContext(UserContext);
