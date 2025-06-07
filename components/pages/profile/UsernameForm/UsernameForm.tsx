'use client';

import { UsernameFormUpdateAction, UsernameFormState } from '@/data/actions/UsernameForm/UsernameFormUpdate-actions';
import { useActionState, useEffect, useState, useTransition } from 'react';
import { FormErrors } from '../../../formItems/FormErrors';
import { UsernameInput } from './UsernameInput';
import { FormBtns } from '../../../formItems/FormBtns';

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
	const [isTransitioningSubmit, startTransitionSubmit] = useTransition();
	const [isTransitioningReset, startTransitionReset] = useTransition();
	const { username, message, validationErrors, isUsernameTaken } = formState || {};

	useEffect(() => {
		if (message) {
			setFormError(message);
		} else {
			setFormError(null);
		}
	}, [message]);

	const handleReset = async () => {
		const inputElement = document.getElementById('username') as HTMLInputElement | null;
		if (inputElement) {
			inputElement.value = '';
			const form = document.getElementById('username-form') as HTMLFormElement;
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
				id='username-form'
				action={formAction}
				onSubmit={handleSubmit}
				className='grid place-self-center bg-white shadow-md rounded-lg gap-5 p-8 w-full max-w-md border-t-8 border-gunmetal'
				style={{ boxShadow: '0px 2px 6px -2px black' }}>
				<div className='pb-5 border-b border-gray-200'>
					<h1 className='text-xl font-semibold text-gray-800 mb-1'>Edit Username</h1>
					<p className='font-light text-gray-600 text-sm'>Change your public name.</p>
				</div>
				<div className='grid gap-3'>
					<FormErrors
						formError={formError}
						isUsernameTaken={isUsernameTaken}
						validationErrors={validationErrors}
					/>

					<UsernameInput username={username} />

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
