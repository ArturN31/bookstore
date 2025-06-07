'use client';

import { AddressFormUpdateAction } from '@/data/actions/AddressForm/AddressFormUpdate-actions';
import { useActionState, useEffect, useState, useTransition } from 'react';
import { FormInputs } from './FormInputs';
import { FormBtns } from '../../../../formItems/FormBtns';
import { FormErrors } from '../../../../formItems/FormErrors';

export const AddressFormUpdate = () => {
	const INITIAL_STATE = {
		streetAddress: '',
		postcode: '',
		city: '',
		country: '',
		message: undefined,
		error: undefined,
		validationErrors: undefined,
	};
	const [formState, formAction] = useActionState(AddressFormUpdateAction, INITIAL_STATE);
	const [formError, setFormError] = useState<string | null>(null);
	const [isTransitioningSubmit, startTransitionSubmit] = useTransition();
	const [isTransitioningReset, startTransitionReset] = useTransition();
	const { streetAddress, postcode, city, country, message, validationErrors } = formState || {};

	useEffect(() => {
		if (message) {
			setFormError(message);
		} else {
			setFormError(null);
		}
	}, [message]);

	const handleReset = async () => {
		const streetElement = document.getElementById('streetAddress') as HTMLInputElement | null;
		const postcodeElement = document.getElementById('postcode') as HTMLInputElement | null;
		const cityElement = document.getElementById('city') as HTMLInputElement | null;
		const countryElement = document.getElementById('country') as HTMLInputElement | null;

		if (streetElement && postcodeElement && cityElement && countryElement) {
			streetElement.value = '';
			postcodeElement.value = '';
			cityElement.value = '';
			countryElement.value = '';

			const form = document.getElementById('change-address-form') as HTMLFormElement;
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
				id='change-address-form'
				action={formAction}
				onSubmit={handleSubmit}
				className='grid place-self-center bg-white shadow-md rounded-lg gap-5 p-8 w-full max-w-md border-t-8 border-gunmetal'
				style={{ boxShadow: '0px 2px 6px -2px black' }}>
				<div className='pb-5 border-b border-gray-200'>
					<h1 className='text-xl font-semibold text-gray-800 mb-1'>Let's Update Your Address!</h1>
					<p className='font-light text-gray-600 text-sm'>Update your shipping address information below.</p>
				</div>

				<div className='grid gap-3'>
					<FormErrors
						formError={formError}
						isUsernameTaken={undefined}
						validationErrors={validationErrors}
					/>

					<FormInputs
						streetAddress={streetAddress ?? ''}
						postcode={postcode ?? ''}
						city={city ?? ''}
						country={country ?? ''}
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
