'use client';

import { AddressFormUpdateAction } from '@/data/actions/AddressFormUpdate-actions';
import { useActionState, useState } from 'react';
import { TextInput } from './TextInput';

export const AddressFormUpdate = () => {
	const INITIAL_STATE = {
		streetAddress: '',
		postcode: '',
		city: '',
		country: '',
	};

	const [formState, formAction] = useActionState(AddressFormUpdateAction, INITIAL_STATE);
	const [formError, setFormError] = useState('');

	const { streetAddress, postcode, city, country } = formState || {};

	if (formState.message === 'User data could not be updated.') {
		console.log(formState.error);
		setFormError(formState.message);
	}

	if (formState.message === 'User data was updated.') {
		//refresh page /user/profile
		window.location.href = '/user/profile';
	}

	return (
		<form
			action={formAction}
			className='grid place-self-center border border-black rounded-lg gap-2 p-5'
			style={{ boxShadow: '0px 2px 6px -2px black' }}>
			<div>
				<h1 className='text-2xl'>Let's Update Your Address!</h1>
				<p className='font-light'>Update your shipping address information below.</p>
				{formError ? <p className='font-semibold text-red-500'>{formError}</p> : ''}
			</div>

			<div className='grid gap-2'>
				<div className='flex gap-2'>
					{[
						{
							label: 'Street Address',
							id: 'streetAddress',
							defaultValue: streetAddress,
						},
						{
							label: 'Postcode',
							id: 'postcode',
							defaultValue: postcode,
						},
					].map((el) => (
						<TextInput
							key={el.id}
							label={el.label}
							id={el.id}
							defaultValue={el.defaultValue}
						/>
					))}
				</div>

				<div className='flex gap-2'>
					{[
						{
							label: 'City',
							id: 'city',
							defaultValue: city,
						},
						{
							label: 'Country',
							id: 'country',
							defaultValue: country,
						},
					].map((el) => (
						<TextInput
							key={el.id}
							label={el.label}
							id={el.id}
							defaultValue={el.defaultValue}
						/>
					))}
				</div>

				<div className='flex justify-end gap-3 mt-3'>
					<button
						className='border border-black rounded-md px-2 py-1 hover:bg-gunmetal/15'
						type='submit'>
						Submit
					</button>
					<button
						className='border border-black rounded-md px-2 py-1 hover:bg-gunmetal/15'
						type='reset'>
						Reset
					</button>
				</div>
			</div>
		</form>
	);
};
