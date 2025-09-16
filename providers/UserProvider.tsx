'use client';

import {
	createContext,
	useContext,
	useMemo,
	useState,
	useEffect,
	useCallback,
} from 'react';
import { createClient } from '@/utils/db/client';
import { getUserData } from '@/data/user/GetUserData';
import { Session } from '@supabase/supabase-js';

type UserProvider = {
	username: string;
	loggedIn: boolean;
	profileExists: boolean;
	clearUsername: () => void;
	toggleLoggedIn: (newState: boolean) => void;
	loading: boolean;
	error: string | null;
	refreshUser: () => Promise<void>;
};

const UserContext = createContext<UserProvider>({
	username: '',
	loggedIn: false,
	profileExists: false,
	clearUsername: () => {},
	toggleLoggedIn: () => {},
	loading: false,
	error: null,
	refreshUser: async () => {},
});

/**
 * Manages user authentication and profile data within the application.
 *
 * This component provides a centralized way to access the user's logged-in status,
 * username, and profile existence throughout the application. It automatically
 * synchronizes with Supabase for real-time updates on authentication state changes
 * (like signing in or out) and updates to the user's profile table.
 *
 * The provider makes the following data and functions available via the UserContext:
 * - `username`: The user's current username.
 * - `loggedIn`: A boolean indicating if the user is authenticated.
 * - `profileExists`: A boolean indicating if the user has a profile in the database.
 * - `loading`: A boolean indicating if user data is currently being fetched.
 * - `error`: A string containing any error message if data fetching fails.
 * - `refreshUser`: An async function to manually refetch user data.
 *
 * This provider should wrap the part of the application that needs access to user data.
 * You can access the provided values using the `useUserState` custom hook.
 */
export const UserProvider = ({ children }: { children: React.ReactNode }) => {
	const supabase = createClient();
	const [username, setUsername] = useState<string>('');
	const [loggedIn, setLoggedIn] = useState<boolean>(false);
	const [profileExists, setProfileExists] = useState<boolean>(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchUserData = useCallback(async (session: Session | null) => {
		setError(null);

		if (!session?.user) {
			setLoggedIn(false);
			setUsername('');
			setProfileExists(false);
			setLoading(false);
			return;
		}

		try {
			const userData = await getUserData();
			const newUsername = userData?.username;
			setLoggedIn(true);
			setUsername(newUsername || '');
			setProfileExists(userData ? true : false);
		} catch (err: any) {
			console.log('Error fetching user data:', err);
			setError('Failed to fetch user data. Please try again later.');
			setLoggedIn(false);
			setUsername('');
		} finally {
			setLoading(false);
		}
	}, []);

	const refreshUser = useCallback(async () => {
		const {
			data: { session },
		} = await supabase.auth.getSession();
		await fetchUserData(session);
	}, [supabase, fetchUserData]);

	useEffect(() => {
		let authStateSubscription: any;
		let userProfileSubscription: any;

		const setupSubscriptions = async () => {
			setLoading(true);

			authStateSubscription = supabase.auth.onAuthStateChange((event, session) => {
				if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
					fetchUserData(session);
				}
			}).data.subscription;

			const {
				data: { session },
			} = await supabase.auth.getSession();
			await fetchUserData(session);

			if (session?.user) {
				userProfileSubscription = supabase
					.channel(`user-profile-channel-${session.user.id}`)
					.on(
						'postgres_changes',
						{
							event: '*',
							schema: 'public',
							table: 'users',
							filter: `id=eq.${session.user.id}`,
						},
						() => {
							fetchUserData(session);
						},
					)
					.subscribe();
			}
		};

		setupSubscriptions();

		return () => {
			if (authStateSubscription) {
				authStateSubscription.unsubscribe();
			}
			if (userProfileSubscription) {
				supabase.removeChannel(userProfileSubscription);
			}
		};
	}, [supabase, fetchUserData]);

	const contextValue = useMemo(
		() => ({
			username,
			loggedIn,
			profileExists,
			clearUsername: () => {
				setUsername('');
			},
			toggleLoggedIn: (newState: boolean) => {
				setLoggedIn(newState);
			},
			loading,
			error,
			refreshUser,
		}),
		[username, loggedIn, profileExists, loading, error, fetchUserData, supabase],
	);

	return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

export const useUserState = () => useContext(UserContext);
