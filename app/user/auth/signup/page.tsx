'use client';

import { EmailField } from '@/components/formItems/EmailField';
import { FormBtns } from '@/components/formItems/FormBtns';
import { FormErrors } from '@/components/formItems/FormErrors';
import { PasswordField } from '@/components/formItems/PasswordField';
import { SignUpAction, SignUpFormState } from '@/data/actions/auth/SignUpAction';
import { useActionState, useEffect, useState, useTransition } from 'react';

export default function SignUpPage() {
	const INITIAL_STATE: SignUpFormState = {
		email: '',
		password: '',
		cnfPassword: '',
		message: undefined,
		error: undefined,
		validationErrors: undefined,
	};
	const [formState, formAction] = useActionState(SignUpAction, INITIAL_STATE);
	const [formError, setFormError] = useState<string | null>(null);
	const [isTransitioningSubmit, startTransitionSubmit] = useTransition();
	const [isTransitioningReset, startTransitionReset] = useTransition();
	const { email, password, cnfPassword, message, validationErrors } = formState;

	useEffect(() => {
		if (message) {
			setFormError(message);
		} else {
			setFormError(null);
		}
	}, [message]);

	const handleReset = async () => {
		const emailElement = document.getElementById('email') as HTMLInputElement | null;
		const passwordElement = document.getElementById(
			'password',
		) as HTMLInputElement | null;
		const cnfPasswordElement = document.getElementById(
			'cnfPassword',
		) as HTMLInputElement | null;

		if (emailElement && passwordElement && cnfPasswordElement) {
			emailElement.value = '';
			passwordElement.value = '';
			cnfPasswordElement.value = '';

			const form = document.getElementById('signup-form') as HTMLFormElement;

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
		<div className='grid'>
			<div className='relative grid place-self-center w-full max-w-md'>
				<form
					id='signup-form'
					data-testid='signup-form'
					action={formAction}
					onSubmit={handleSubmit}
					className='grid place-self-center bg-white shadow-md rounded-lg gap-5 p-8 w-full max-w-md border-t-8 border-gunmetal'
					style={{ boxShadow: '0px 2px 6px -2px black' }}>
					<div className='pb-5 border-b border-gray-200'>
						<h1 className='text-xl font-semibold text-gray-800 mb-1'>
							Create Your Account
						</h1>
						<p className='font-light text-gray-600 text-sm'>
							Let's get you started! Please enter your information below.
						</p>
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
		</div>
	);
}
