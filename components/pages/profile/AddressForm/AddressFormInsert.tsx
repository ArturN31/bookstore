'use client';

import { AddressFormInsertAction } from '@/data/actions/AddressForm/AddressFormInsert-actions';
import { useActionState, useEffect, useState } from 'react';
import { TextInput } from './TextInput';

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
		message: null,
		error: null,
	};
	const [formState, formAction] = useActionState(AddressFormInsertAction, INITIAL_STATE);
	const [formError, setFormError] = useState<string | null>(null);
	const { firstName, lastName, dob, phoneNumber, streetAddress, postcode, city, country, message } = formState || {};

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
				<h1 className='text-xl font-semibold'>Enter Your Shipping Address</h1>
				<p className='text-gray-600'>For fast and accurate delivery, please fill in the details below.</p>
				{formError ? <p className='font-semibold text-red-500'>{formError}</p> : ''}
			</div>

			<div className='grid gap-2'>
				<div className='flex gap-2'>
					{[
						{
							label: 'First Name',
							id: 'firstName',
							defaultValue: firstName,
						},
						{
							label: 'Last Name',
							id: 'lastName',
							defaultValue: lastName,
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
