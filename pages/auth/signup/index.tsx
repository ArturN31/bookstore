import { RootLayout } from '@/components/layout/Layout';
import { SignupForm } from '@/components/authorization/SignupForm';

export default function SignIn() {
	return (
		<RootLayout>
			<div className='grid'>
				<SignupForm />
			</div>
		</RootLayout>
	);
}
