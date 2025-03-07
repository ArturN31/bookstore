import { AddressFormInsert } from '@/components/pages/profile/AddressForm/AddressFormInsert';
import { RootLayout } from '@/components/layout/Layout';
import { getUserData, getUserDataProperty } from '@/data/user/GetUserData';
import { createClient } from '@/utils/db/server';
import { Navigation } from '@/components/pages/profile/Navigation';
import { UserDetails } from '@/components/pages/profile/UserDetails';

const fetchData = async () => {
	let userData = await getUserData();
	let userEmail = await getUserDataProperty('email');
	return { userData, userEmail };
};

const subscribeToUserChanges = async (onDataUpdate: () => Promise<void>) => {
	const supabase = await createClient();
	const channel = supabase
		.channel('custom-insert-channel')
		.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, async () => {
			await onDataUpdate();
		})
		.subscribe();
	return channel;
};

export default async function UserProfile() {
	let { userData, userEmail } = await fetchData();

	const handleDataUpdate = async () => {
		const newData = await fetchData();
		userData = newData.userData;
		userEmail = newData.userEmail;
	};

	const channel = await subscribeToUserChanges(handleDataUpdate);

	try {
		if (userData && userEmail) {
			return (
				<RootLayout>
					<div className='grid gap-5 justify-items-center'>
						<div className='grid gap-5 justify-items-center'>
							<Navigation />
						</div>
						<div className='flex flex-wrap gap-5 justify-center'>
							<UserDetails
								userData={userData}
								userEmail={userEmail}
							/>
						</div>
					</div>
				</RootLayout>
			);
		}

		return (
			<RootLayout>
				<div className='grid gap-5'>
					<div className='text-center'>
						<p className='text-2xl'>Hi there!</p>
						<p className='font-light'>Just a quick heads-up: your profile setup isn't quite finished.</p>
						<p className='font-light'>Completing it will give you full access to everything our store has to offer.</p>
					</div>
					<AddressFormInsert />
				</div>
			</RootLayout>
		);
	} finally {
		if (channel) {
			channel.unsubscribe();
		}
	}
}
