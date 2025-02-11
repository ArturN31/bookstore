'use client';

import { useActionState, useState } from 'react';
import { SignupFormAction } from '@/data/actions/SignupForm-actions';
import { PasswordField } from './PasswordField';

export const SignupForm = () => {
	const INITIAL_STATE = {
		email: '',
		password: '',
		cnfPassword: '',
	};
	const [formState, formAction] = useActionState(SignupFormAction, INITIAL_STATE);
	const [formError, setFormError] = useState('');
	const { email, password, cnfPassword, message } = formState || {};

	//passwords do not match
	if (
		formError !== 'Password and Confirm Password do not match.' &&
		message === 'Password and Confirm Password do not match.'
	)
		setFormError(message);

	//email exists
	if (
		formError !== 'Failed to insert user into the database as email already exists.' &&
		message === 'Failed to insert user into the database as email already exists.'
	)
		setFormError(message);

	//user exists
	if (
		formError !== 'Failed to insert user into the database as it already exists.' &&
		message === 'Failed to insert user into the database as it already exists.'
	)
		setFormError(message);

	//weak password
	if (
		formError !==
			'Failed to insert user into the database as the password is too weak.\nPassword should be at least 8 characters long.\nIt has to include: lowercase, uppercase letters, digits, and symbols.' &&
		message ===
			'Failed to insert user into the database as the password is too weak.\nPassword should be at least 8 characters long.\nIt has to include: lowercase, uppercase letters, digits, and symbols.'
	)
		setFormError(message);

	//failed to insert user
	if (
		formError !== 'Failed to insert user into the database.' &&
		message === 'Failed to insert user into the database.'
	)
		setFormError(message);

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
