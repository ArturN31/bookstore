import { AddressForm } from '@/components/addressForm/AddressForm';
import { RootLayout } from '@/components/layout/Layout';

export default function UserProfile() {
	return (
		<RootLayout>
			<>
				<AddressForm />
				<p>USER PROFILE</p>
			</>
		</RootLayout>
	);
}
