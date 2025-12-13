'use client';

import { FormBtns } from '@/components/formItems/FormBtns';
import { FormErrors } from '@/components/formItems/FormErrors';
import { PasswordField } from '@/components/formItems/PasswordField';
import {
	ChangePasswordAction,
	UsernameFormState,
} from '@/data/actions/auth/ChangePasswordAction';
import { useActionState, useEffect, useState, useTransition } from 'react';

export default function ChangePasswordPage() {
	const INITIAL_STATE: UsernameFormState = {
		password: '',
		cnfPassword: '',
		message: undefined,
		error: undefined,
		validationErrors: undefined,
	};

	const [formState, formAction] = useActionState(ChangePasswordAction, INITIAL_STATE);
	const [formError, setFormError] = useState<string | null>(null);
	const [isTransitioningSubmit, startTransitionSubmit] = useTransition();
	const [isTransitioningReset, startTransitionReset] = useTransition();
	const { password, cnfPassword, message, validationErrors } = formState;

	useEffect(() => {
		if (message) {
			setFormError(message);
		} else {
			setFormError(null);
		}
	}, [message]);

	const handleReset = async () => {
		const passwordElement = document.getElementById(
			'password',
		) as HTMLInputElement | null;
		const cnfPasswordElement = document.getElementById(
			'cnfPassword',
		) as HTMLInputElement | null;

		if (passwordElement && cnfPasswordElement) {
			passwordElement.value = '';
			cnfPasswordElement.value = '';
			const form = document.getElementById('change-password-form') as HTMLFormElement;
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
				id='change-password-form'
				data-testid='change-password-form'
				action={formAction}
				onSubmit={handleSubmit}
				className='grid place-self-center bg-white shadow-md rounded-lg gap-5 p-8 w-full max-w-md border-t-8 border-gunmetal'
				style={{ boxShadow: '0px 2px 6px -2px black' }}>
				<div className='pb-5 border-b border-gray-200'>
					<p className='text-xl font-semibold text-gray-800 mb-1'>
						Let's Update Your Password!
					</p>
					<p className='font-light text-gray-600 text-sm'>
						Keep your account safe with a new, strong password.
					</p>
					<p className='font-light text-gray-600 text-sm'>
						Make it easy to remember but hard to crack!
					</p>
				</div>

				<FormErrors
					formError={formError}
					validationErrors={validationErrors}
					isUsernameTaken={undefined}
				/>

				<div className='grid gap-3'>
					<PasswordField
						id='password'
						label='Password'
						placeholder='Enter Password'
						defaultValue={password ?? ''}
					/>
					<PasswordField
						id='cnfPassword'
						label='Confirm Password'
						placeholder='Confirm Password'
						defaultValue={cnfPassword ?? ''}
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
}
