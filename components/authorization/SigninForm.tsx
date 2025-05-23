'use client';

import { SigninFormAction } from '@/data/actions/auth/SigninForm-actions';
import { useActionState, useEffect, useState } from 'react';
import { PasswordField } from './PasswordField';

export const SigninForm = () => {
	const INITIAL_STATE = {
		email: '',
		password: '',
		message: null,
		error: null,
	};
	const [formState, formAction] = useActionState(SigninFormAction, INITIAL_STATE);
	const [formError, setFormError] = useState<string | null>(null);
	const { email, password, message, error } = formState || {};

	useEffect(() => {
		if (message) {
			setFormError(message);
		} else {
			setFormError(null);
		}
	}, [message]);

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
