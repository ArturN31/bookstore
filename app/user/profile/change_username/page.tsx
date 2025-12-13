import { FormBtns } from '@/components/formItems/FormBtns';
import { FormErrors } from '@/components/formItems/FormErrors';
import {
	ChangeUsernameAction,
	ChangeUsernameFormState,
} from '@/data/actions/UsernameForm/ChangeUsernameAction';
import { useActionState, useEffect, useState, useTransition } from 'react';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';

export default function ChangeUsernamePage() {
	const INITIAL_STATE: ChangeUsernameFormState = {
		username: '',
		message: undefined,
		error: undefined,
		validationErrors: undefined,
		isUsernameTaken: false,
	};
	const [formState, formAction] = useActionState(ChangeUsernameAction, INITIAL_STATE);
	const [formError, setFormError] = useState<string | null>(null);
	const [isTransitioningSubmit, startTransitionSubmit] = useTransition();
	const [isTransitioningReset, startTransitionReset] = useTransition();
	const { username, message, validationErrors, isUsernameTaken } = formState;

	useEffect(() => {
		if (message) {
			setFormError(message);
		} else {
			setFormError(null);
		}
	}, [message]);

	const handleReset = async () => {
		const inputElement = document.getElementById(
			'username-field',
		) as HTMLInputElement | null;
		if (inputElement) {
			inputElement.value = '';
			const form = document.getElementById('change-username-form') as HTMLFormElement;
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
				id='change-username-form'
				data-testid='change-username-form'
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

					<div className='relative grid place-self-center w-full max-w-md'>
						<label
							htmlFor='username'
							className='inline-block text-gray-700 font-medium text-sm rounded-sm transition-colors duration-200 focus-within:bg-blue-100 focus-within:text-blue-700 px-1'>
							New Username
						</label>
						<div className='relative'>
							<div className='absolute top-2 pl-3 flex items-center pointer-events-none text-gray-400'>
								<PersonRoundedIcon aria-hidden='true' />
							</div>
							<input
								autoComplete='off'
								required
								type='text'
								id='username-field'
								data-testid='username-field'
								name='username'
								placeholder='Enter your new username'
								defaultValue={username ?? ''}
								className='block w-full pl-10 border border-gray-300 rounded-md py-2 focus:outline-none focus:border-blue-500 text-sm'
								aria-describedby='username-helper'
							/>
						</div>
						<p
							id='username-helper'
							className='text-gray-500 text-xs'>
							This will be your public display name.
						</p>
					</div>

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
