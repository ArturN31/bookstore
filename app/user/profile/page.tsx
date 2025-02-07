import { AddressFormInsert } from '@/components/pages/profile/AddressForm/AddressFormInsert';
import { RootLayout } from '@/components/layout/Layout';
import { getUserData, getUserDataProperty } from '@/data/user/GetUserData';
import { createClient } from '@/utils/db/server';
import { Navigation } from '@/components/pages/profile/Navigation';
import { UserDetails } from '@/components/pages/profile/UserDetails';

const getData = async () => {
	const handleDataUpdate = async () => {
		userData = await getUserData();
		userEmail = await getUserDataProperty('email');
	};

	//get data
	let userData = await getUserData();
	let userEmail = await getUserDataProperty('email');

	//updates user data when data is inserted into the users table
	//reloads the ui on successfull entry of data from the AddressForm
	const supabase = await createClient();
	const channel = supabase
		.channel('custom-insert-channel')
		.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, async (payload) => {
			await handleDataUpdate();
		})
		.subscribe();

	return { userData, userEmail, channel };
};

export default async function UserProfile() {
	const { userData, userEmail, channel } = await getData();
	channel.unsubscribe();

	if (!userData)
		return (
			<RootLayout>
				<div className='grid gap-5'>
					<div className='text-center'>
						<p className='text-2xl'>Hello there!</p>
						<p className='text-lg font-light'>It looks like you haven't finished setting up your profile yet.</p>
					</div>
					<AddressFormInsert />
				</div>
			</RootLayout>
		);

	if (typeof userData !== 'string' && userEmail)
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
