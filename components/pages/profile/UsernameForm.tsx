'use client';

import { UsernameFormUpdateAction, UsernameFormState } from '@/data/actions/UsernameForm/UsernameFormUpdate-actions';
import { useActionState, useEffect, useState } from 'react';

export const UsernameForm = () => {
	const INITIAL_STATE: UsernameFormState = {
		username: '',
		message: undefined,
		error: undefined,
		validationErrors: undefined,
		isUsernameTaken: false,
	};
	const [formState, formAction] = useActionState(UsernameFormUpdateAction, INITIAL_STATE);
	const [formError, setFormError] = useState<string | null>(null);
	const { username, message, validationErrors, isUsernameTaken } = formState || {};

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
			className='grid place-self-center border border-black rounded-lg gap-2 p-5'
			style={{ boxShadow: '0px 2px 6px -2px black' }}>
			<div>
				<h1 className='text-2xl'>Let's Change Your Username!</h1>
				<p className='font-light'>Provide your new Username below.</p>
				{formError ? <p className='font-semibold text-red-500'>{formError}</p> : ''}
				{isUsernameTaken && (
					<p className='font-semibold text-red-500'>This username is already taken. Please choose another one.</p>
				)}
				{validationErrors && ( // Check if validatedData, error, and issues exist
					<ul className='mt-2 text-red-500 font-semibold'>
						{validationErrors.map((issue, index) => (
							<li key={index}>{issue.message}</li>
						))}
					</ul>
				)}
			</div>

			<div className='grid gap-2'>
				<div className='grid'>
					<label htmlFor='username'>Username</label>
					<input
						required
						type='text'
						id='username'
						name='username'
						placeholder='Username'
						defaultValue={username ? username : ''}
						className='border border-black px-2 py-1'
					/>
				</div>

				<div className='flex justify-end gap-3 mt-3'>
					<button
						className='border border-black rounded-md px-2 py-1 hover:bg-gunmetal/15 hover:cursor-pointer'
						type='submit'>
						Submit
					</button>
					<button
						className='border border-black rounded-md px-2 py-1 hover:bg-gunmetal/15 hover:cursor-pointer'
						type='reset'>
						Reset
					</button>
				</div>
			</div>
		</form>
	);
};
