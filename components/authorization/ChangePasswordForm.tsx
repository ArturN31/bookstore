'use client';

import { useActionState, useEffect, useState } from 'react';
import { ChangePasswordFormAction } from '@/data/actions/ChangePasswordForm-actions';
import { PasswordField } from './PasswordField';

export const ChangePasswordForm = () => {
	const INITIAL_STATE = {
		password: '',
		cnfPassword: '',
		message: null,
		error: null,
	};

	const [formState, formAction] = useActionState(ChangePasswordFormAction, INITIAL_STATE);
	const [formError, setFormError] = useState<string | null>(null);
	const { password, cnfPassword, message, error } = formState || {};

	useEffect(() => {
		if (message) {
			setFormError(message);
		} else if (error && error.code === 'weak_password') {
			setFormError(
				'The password is too weak. Password should be at least 8 characters long and include lowercase, uppercase letters, digits, and symbols.',
			);
		} else if (error) {
			setFormError('Could not update user password.');
		} else {
			setFormError(null);
		}
	}, [message, error]);

	return (
		<form
			action={formAction}
			className='grid place-self-center border border-black rounded-lg gap-2 p-5 w-[450px]'
			style={{ boxShadow: '0px 2px 6px -2px black' }}>
			<div>
				<p className='text-2xl'>Let's Update Your Password!</p>
				<p className='font-light'>Keep your account safe with a new, strong password.</p>
				<p className='font-light'>Make it easy to remember but hard to crack!</p>
				{formError ? <p className='font-semibold text-red-500'>{formError}</p> : ''}
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

			<div className='grid justify-end mt-3'>
				<button
					type='submit'
					className='border border-black rounded-md px-2 py-1 hover:bg-gunmetal/15 hover:cursor-pointer'>
					Change password
				</button>
			</div>
		</form>
	);
};
