import { RootLayout } from '@/components/layout/Layout';
import { SigninForm } from '@/components/authorization/SigninForm';

export default function SignIn() {
	return (
		<RootLayout>
			<div className='grid gap-5'>
				<SigninForm />
				<p className='text-center'>
					New to Books 4 You? Create an account{' '}
					<a
						href='/auth/signup'
						className='text-sky-500 hover:text-sky-700'>
						here
					</a>
					.
				</p>
			</div>
		</RootLayout>
	);
}
