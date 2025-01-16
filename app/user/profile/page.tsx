import { AddressForm } from '@/components/addressForm/AddressForm';
import { RootLayout } from '@/components/layout/Layout';
import { createClient } from '@/utils/db/server';

export default async function UserProfile() {
	const getUserID = async () => {
		try {
			const supabase = await createClient();
			let {
				data: { user },
				error,
			} = await supabase.auth.getUser();

			if (error) console.log(error);
			return user?.id;
		} catch (error) {
			console.log(error);
		}
	};

	const getUserData = async () => {
		try {
			const userID = await getUserID();

			if (userID) {
				const supabase = await createClient();
				let { data, error } = await supabase.from('users').select('*').eq('id', userID).single();

				if (error) console.log(error);

				return data;
			}
		} catch (error) {
			console.log(error);
		}
	};

	const user = await getUserData();
	console.log(user);

	return (
		<RootLayout>
			<>
				<AddressForm />
				<p>USER PROFILE</p>
			</>
		</RootLayout>
	);
}
