import { RootLayout } from '@/components/layout/Layout';
import { ChangePasswordForm } from '@/components/authorization/ChangePasswordForm';

export default async function ChangePasswordPage() {
	return (
		<RootLayout>
			<ChangePasswordForm />
		</RootLayout>
	);
}
