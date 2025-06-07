'use client';

import { AddressFormInsertAction } from '@/data/actions/AddressForm/AddressFormInsert-actions';
import { useActionState, useEffect, useState, useTransition } from 'react';
import { TextInput } from '../TextInput';
import { FormInputs } from './FormInputs';
import { FormBtns } from '../../../../formItems/FormBtns';
import { FormErrors } from '../../../../formItems/FormErrors';

export const AddressFormInsert = () => {
	const INITIAL_STATE = {
		firstName: '',
		lastName: '',
		dob: '',
		streetAddress: '',
		postcode: '',
		city: '',
		country: '',
		phoneNumber: '',
		message: undefined,
		error: undefined,
		validationErrors: undefined,
	};
	const [formState, formAction] = useActionState(AddressFormInsertAction, INITIAL_STATE);
	const [formError, setFormError] = useState<string | null>(null);
	const [isTransitioningSubmit, startTransitionSubmit] = useTransition();
	const [isTransitioningReset, startTransitionReset] = useTransition();
	const { firstName, lastName, dob, phoneNumber, streetAddress, postcode, city, country, message, validationErrors } =
		formState || {};

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
				id='insert-address-form'
				action={formAction}
				onSubmit={handleSubmit}
				className='grid place-self-center bg-white shadow-md rounded-lg gap-5 p-8 w-full max-w-md border-t-8 border-gunmetal'
				style={{ boxShadow: '0px 2px 6px -2px black' }}>
				<div className='pb-5 border-b border-gray-200'>
					<h1 className='text-xl font-semibold text-gray-800 mb-1'>Enter Your Shipping Address</h1>
					<p className='font-light text-gray-600 text-sm'>
						For fast and accurate delivery, please fill in the details below.
					</p>
				</div>

				<FormErrors
					formError={formError}
					validationErrors={validationErrors}
					isUsernameTaken={undefined}
				/>

				<div className='grid gap-3'>
					<FormInputs
						firstName={firstName}
						lastName={lastName}
						dob={dob}
						phoneNumber={phoneNumber}
						streetAddress={streetAddress}
						postcode={postcode}
						city={city}
						country={country}
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
