'use client';

import { SigninFormAction } from '@/data/actions/SigninForm-actions';
import { useActionState, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const SigninForm = () => {
	const INITIAL_STATE = {
		email: '',
		password: '',
	};

	const [formState, formAction] = useActionState(SigninFormAction, INITIAL_STATE);
	const [formError, setFormError] = useState('');
	const [visible, setVisible] = useState(false);

	const handleVisibility = (e: any) => {
		e.preventDefault();
		setVisible(!visible);
	};

	const { email, password, message, error } = formState || {};

	if (formError !== 'Sign in credentials not recognised.' && message === 'Sign in credentials not recognised.')
		setFormError(message);

	if (
		formError !== 'User to which the request relates no longer exists.' &&
		message === 'User to which the request relates no longer exists.'
	)
		setFormError(message);

	if (formError !== 'Failed to sign in.' && message === 'Failed to sign in.') setFormError(message);

	if (message === 'Signed in successfully.') window.location.href = '/user/profile';

	return (
		<form
			action={formAction}
			className='grid place-self-center border border-black rounded-lg gap-2 p-5'
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

			<div className='grid'>
				<label
					htmlFor='Password'
					className='text-black'>
					Password
				</label>
				<div className='flex items-center'>
					<input
						required
						type={visible ? 'text' : 'password'}
						id='password'
						name='password'
						placeholder='Password'
						defaultValue={password}
						className='border px-2 py-1 w-full'
					/>
					<button
						className='w-fit h-full px-1 border border-black border-l-0 hover:bg-gunmetal/15'
						onClick={handleVisibility}>
						{!visible ? <Eye /> : <EyeOff />}
					</button>
				</div>
			</div>

			<div className='flex justify-end gap-3 mt-3'>
				<button
					type='submit'
					className='border border-black rounded-md px-2 py-1 hover:bg-gunmetal/15'>
					Sign In
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
