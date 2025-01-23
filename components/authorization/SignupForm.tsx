'use client';

import { useActionState, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { SignupFormAction } from '@/data/actions/SignupForm-actions';

export const SignupForm = () => {
	const INITIAL_STATE = {
		email: '',
		password: '',
		cnfPassword: '',
	};

	const [formState, formAction] = useActionState(SignupFormAction, INITIAL_STATE);

	const [formError, setFormError] = useState('');

	const [visiblePassword, setVisiblePassword] = useState(false);

	const [visibleCnfPassword, setVisibileCnfPassword] = useState(false);

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
			'Failed to insert user into the database as the password is too weak.\nIt has to include: lowercase, uppercase letters, digits, and symbols.' &&
		message ===
			'Failed to insert user into the database as the password is too weak.\nIt has to include: lowercase, uppercase letters, digits, and symbols.'
	)
		setFormError(message);

	//failed to insert user
	if (
		formError !== 'Failed to insert user into the database.' &&
		message === 'Failed to insert user into the database.'
	)
		setFormError(message);

	//user signed up
	if (message === 'User has been added to the database.') window.location.href = '/user/profile';

	const handlePasswordVisibility = (e: any) => {
		e.preventDefault();
		setVisiblePassword(!visiblePassword);
	};

	const handleCnfPasswordVisibility = (e: any) => {
		e.preventDefault();
		setVisibileCnfPassword(!visibleCnfPassword);
	};

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

			<div className='grid'>
				<label
					htmlFor='Password'
					className='text-black'>
					Password
				</label>
				<div className='flex items-center'>
					<input
						required
						type={visiblePassword ? 'text' : 'password'}
						id='password'
						name='password'
						placeholder='Password'
						defaultValue={password}
						className='border border-black px-2 py-1 w-full'
					/>
					<button
						className='w-fit h-full px-1 border border-black border-l-0 hover:bg-gunmetal/15'
						onClick={handlePasswordVisibility}>
						{!visiblePassword ? <Eye /> : <EyeOff />}
					</button>
				</div>
			</div>

			<div className='grid'>
				<label
					htmlFor='cnfPassword'
					className='text-black'>
					Confirm Password
				</label>
				<div className='flex items-center'>
					<input
						required
						type={visibleCnfPassword ? 'text' : 'password'}
						id='cnfPassword'
						name='cnfPassword'
						placeholder='Confirm Password'
						defaultValue={cnfPassword}
						className='border border-black px-2 py-1 w-full'
					/>
					<button
						className='w-fit h-full px-1 border border-black border-l-0 hover:bg-gunmetal/15'
						onClick={handleCnfPasswordVisibility}>
						{!visibleCnfPassword ? <Eye /> : <EyeOff />}
					</button>
				</div>
			</div>

			<div className='flex justify-end gap-3 mt-3'>
				<button
					type='submit'
					className='border border-black rounded-md px-2 py-1 hover:bg-gunmetal/15'>
					Sign Up
				</button>
				<button
					type='reset'
					className='border border-black rounded-md px-2 py-1 hover:bg-gunmetal/15'>
					Reset
				</button>
			</div>
		</form>
	);
};
