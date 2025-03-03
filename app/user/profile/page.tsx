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

	if (userData === 'Profile not existing.' || !userData)
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
