'use client';

import { AddressFormUpdateAction } from '@/data/actions/AddressFormUpdate-actions';
import { useActionState, useState } from 'react';
import { TextInput } from './TextInput';

export const AddressFormUpdate = () => {
	const INITIAL_STATE = {
		firstName: '',
		lastName: '',
		dob: '',
		streetAddress: '',
		postcode: '',
		city: '',
		country: '',
		phoneNumber: '',
	};

	const [formState, formAction] = useActionState(AddressFormUpdateAction, INITIAL_STATE);
	const [formError, setFormError] = useState('');

	const { dob, phoneNumber, streetAddress, postcode, city, country } = formState || {};

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
				<h1 className='text-2xl'>Tell Us Where to Ship</h1>
				<p className='font-light'>Enter your shipping address information below.</p>
				{formError ? <p className='font-semibold text-red-500'>{formError}</p> : ''}
			</div>

			<div className='grid gap-2'>
				<div className='flex gap-2'>
					<div className='grid'>
						<label htmlFor='dob'>Date of Birth</label>
						<input
							className='border border-black px-2 py-1 w-[199px]'
							type='date'
							id='dob'
							name='dob'
							defaultValue={dob}
						/>
					</div>
					<TextInput
						key='phoneNumber'
						label='Phone Number'
						id='phoneNumber'
						defaultValue={phoneNumber}
					/>
				</div>

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
