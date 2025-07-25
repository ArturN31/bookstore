'use client';

import { SigninFormAction } from '@/data/actions/auth/SigninForm-actions';
import { useActionState, useEffect, useState, useTransition } from 'react';
import { PasswordField } from '../formItems/PasswordField';
import { FormErrors } from '../formItems/FormErrors';
import { FormBtns } from '../formItems/FormBtns';
import { EmailField } from '../formItems/EmailField';

export const SigninForm = () => {
	const INITIAL_STATE = {
		email: '',
		password: '',
		message: undefined,
		error: undefined,
		validationErrors: undefined,
	};
	const [formState, formAction] = useActionState(SigninFormAction, INITIAL_STATE);
	const [formError, setFormError] = useState<string | null>(null);
	const [isTransitioningSubmit, startTransitionSubmit] = useTransition();
	const [isTransitioningReset, startTransitionReset] = useTransition();
	const { email, password, message, validationErrors } = formState || {};

	useEffect(() => {
		if (message) {
			setFormError(message);
		} else {
			setFormError(null);
		}
	}, [message]);

	const handleReset = async () => {
		const emailElement = document.getElementById('email') as HTMLInputElement | null;
		const passwordElement = document.getElementById('password') as HTMLInputElement | null;

		if (emailElement && passwordElement) {
			emailElement.value = '';
			passwordElement.value = '';
			const form = document.getElementById('signin-form') as HTMLFormElement;
			if (form) {
				startTransitionReset(async () => {
					const newForm = new FormData(form);
					newForm.append('reset', 'yes');
					await formAction(newForm);
				});
			}
		}
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		const form = event.currentTarget as HTMLFormElement;
		startTransitionSubmit(async () => {
			await formAction(new FormData(form));
		});
	};

	return (
		<div className='relative grid place-self-center w-full max-w-md'>
			<form
				id='signin-form'
				action={formAction}
				onSubmit={handleSubmit}
				className='grid place-self-center bg-white shadow-md rounded-lg gap-5 p-8 w-full max-w-md border-t-8 border-gunmetal'
				style={{ boxShadow: '0px 2px 6px -2px black' }}>
				<div className='pb-5 border-b border-gray-200'>
					<h1 className='text-xl font-semibold text-gray-800 mb-1'>Welcome Back, Bookworm!</h1>
					<p className='font-light text-gray-600 text-sm'>Enter your details to access your bookish adventures.</p>
				</div>

				<FormErrors
					formError={formError}
					validationErrors={validationErrors}
					isUsernameTaken={undefined}
				/>

				<div className='grid gap-3'>
					<EmailField email={email ?? ''} />

					<PasswordField
						id='password'
						label='Password'
						placeholder='Password'
						defaultValue={password ?? ''}
					/>

					<FormBtns
						isTransitioningSubmit={isTransitioningSubmit}
						isTransitioningReset={isTransitioningReset}
						handleReset={handleReset}
					/>
				</div>
			</form>
		</div>
	);
};
