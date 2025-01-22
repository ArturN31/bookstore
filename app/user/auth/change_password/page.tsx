import { RootLayout } from '@/components/layout/Layout';
import { getUserData } from '@/data/user/GetUserData';

export default async function ChangePasswordPage() {
	const userData = await getUserData();

	console.log(userData);

	return (
		<RootLayout>
			<div>
				<p>Change Password Page</p>
			</div>
		</RootLayout>
	);
}
