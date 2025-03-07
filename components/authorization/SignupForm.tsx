'use client';

import { useActionState, useEffect, useState } from 'react';
import { SignupFormAction } from '@/data/actions/auth/SignupForm-actions';
import { PasswordField } from './PasswordField';

export const SignupForm = () => {
	const INITIAL_STATE = {
		email: '',
		password: '',
		cnfPassword: '',
		message: null,
		error: null,
	};
	const [formState, formAction] = useActionState(SignupFormAction, INITIAL_STATE);
	const [formError, setFormError] = useState<string | null>(null);
	const { email, password, cnfPassword, message, error } = formState || {};

	useEffect(() => {
		if (message) {
			setFormError(message);
		} else if (error && error.code === 'weak_password') {
			setFormError(
				'Failed to insert user into the database as the password is too weak. Password should be at least 8 characters long and include lowercase, uppercase letters, digits, and symbols.',
			);
		} else if (error && error.code === 'email_exists') {
			setFormError('Failed to insert user into the database as email already exists.');
		} else if (error && error.code === 'user_already_exists') {
			setFormError('Failed to insert user into the database as it already exists.');
		} else if (error) {
			setFormError('Failed to insert user into the database.');
		} else {
			setFormError(null);
		}
	}, [message, error]);

	return (
		<form
			action={formAction}
			className='grid place-self-center border border-black rounded-lg gap-2 p-5 w-[450px]'
			style={{ boxShadow: '0px 2px 6px -2px black' }}>
			<div className='text-center'>
				<h1 className='text-2xl'>Create Your Account</h1>
				<p className='font-light'>Let's get you started! Please enter your information below.</p>
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

			<PasswordField
				id='cnfPassword'
				placeholder='Confirm Password'
				defaultValue={cnfPassword}
			/>

			<div className='flex justify-end gap-3 mt-3'>
				<button
					type='submit'
					className='border border-black rounded-md px-2 py-1 hover:bg-gunmetal/15 hover:cursor-pointer'>
					Sign Up
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
