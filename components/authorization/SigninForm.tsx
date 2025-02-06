'use client';

import { SigninFormAction } from '@/data/actions/SigninForm-actions';
import { useActionState, useState } from 'react';
import { PasswordField } from './PasswordField';
import { useRouter } from 'next/navigation';

export const SigninForm = () => {
	const INITIAL_STATE = {
		email: '',
		password: '',
	};
	const [formState, formAction] = useActionState(SigninFormAction, INITIAL_STATE);
	const [formError, setFormError] = useState('');
	const { email, password, message } = formState || {};

	if (formError !== 'Sign in credentials not recognised.' && message === 'Sign in credentials not recognised.')
		setFormError(message);

	if (
		formError !== 'User to which the request relates no longer exists.' &&
		message === 'User to which the request relates no longer exists.'
	)
		setFormError(message);

	if (formError !== 'Failed to sign in.' && message === 'Failed to sign in.') setFormError(message);

	if (message === 'Signed in successfully.') {
		const router = useRouter();
		router.back();
	}

	return (
		<form
			action={formAction}
			className='grid place-self-center border border-black rounded-lg gap-2 p-5 w-[450px]'
			style={{ boxShadow: '0px 2px 6px -2px black' }}>
			<div className='text-center'>
				<h1 className='text-2xl'>Welcome Back, Bookworm!</h1>
				<p className='font-light'>Enter your details to access your bookish adventures.</p>
				{formError ? <p className='font-semibold text-red-500'>{formError}</p> : ''}
			</div>

			<div className='grid'>
				<label htmlFor='email'>Email</label>
				<input
					required
					type='email'
					id='email'
					name='email'
					placeholder='Email'
					defaultValue={email}
					className='border border-black px-2 py-1'
				/>
			</div>

			<PasswordField
				id='password'
				placeholder='Password'
				defaultValue={password}
			/>

			<div className='flex justify-end gap-3 mt-3'>
				<button
					type='submit'
					className='border border-black rounded-md px-2 py-1 hover:bg-gunmetal/15 hover:cursor-pointer'>
					Sign In
				</button>
				<button
					type='reset'
					className='border border-black rounded-md px-2 py-1 hover:bg-gunmetal/15 hover:cursor-pointer'>
					Reset
				</button>
			</div>
		</form>
	);
};
