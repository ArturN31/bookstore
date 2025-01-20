import { AddressForm } from '@/components/AddressForm';
import { RootLayout } from '@/components/layout/Layout';
import { createClient } from '@/utils/db/server';

export default async function UserProfile() {
	const getUserProp = async (prop: keyof User) => {
		try {
			const supabase = await createClient();
			let {
				data: { user },
				error,
			} = await supabase.auth.getUser();
			if (error) console.log(error);
			if (user) return user[prop as keyof typeof user] as string;
		} catch (error) {
			console.log(error);
		}
	};

	const getUserData = async () => {
		try {
			const userID = await getUserProp('id');
			const supabase = await createClient();
			let { data, error } = await supabase.from('users').select('*').eq('id', userID).single();
			if (error) console.log(error);
			return data as User;
		} catch (error) {
			console.log(error);
		}
	};

	const user = await getUserData();
	const userEmail = await getUserProp('email');

	if (!user)
		return (
			<RootLayout>
				<div className='grid gap-5'>
					<div className='text-center'>
						<p className='text-2xl'>Hello there!</p>
						<p className='text-lg font-light'>It looks like you haven't finished setting up your profile yet.</p>
					</div>
					<AddressForm />
				</div>
			</RootLayout>
		);

	return (
		<RootLayout>
			<div className='grid gap-5'>
				<div>
					<p>Name:</p>
					<p>
						{user.first_name} {user.last_name}
					</p>
				</div>

				<div>
					<p>Address:</p>
					<p>{user.street_address}</p>
					<p>{user.postcode}</p>
					<p>
						{user.city}, {user.country}
					</p>
				</div>

				<div>
					<p>Contact details:</p>
					<p>{user.phone_number}</p>
					<p>{userEmail}</p>
				</div>
			</div>
		</RootLayout>
	);
}
