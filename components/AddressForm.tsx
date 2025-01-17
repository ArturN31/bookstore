'use client';

import { AddressFormAction } from '@/data/actions/AddressForm-actions';
import { useActionState } from 'react';

export const AddressForm = () => {
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

	const [formState, formAction] = useActionState(AddressFormAction, INITIAL_STATE);

	const { firstName, lastName, dob, phoneNumber, streetAddress, postcode, city, country } = formState || {};

	console.log(formState);

	return (
		<form
			action={formAction}
			className='grid place-self-center border border-black rounded-lg gap-2 p-5'
			style={{ boxShadow: '0px 2px 6px -2px black' }}>
			<div>
				<h1 className='text-2xl'>Tell Us Where to Ship</h1>
				<p className='font-light'>Enter your shipping address information below.</p>
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
						<div
							className='grid'
							key={el.id}>
							<label htmlFor={el.id}>{el.label}</label>
							<input
								required
								type='text'
								id={el.id}
								name={el.id}
								placeholder={el.label}
								defaultValue={el.defaultValue}
								className='border border-black px-2 py-1'
							/>
						</div>
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
					<div className='grid'>
						<label htmlFor='phoneNumber'>Phone Number</label>
						<input
							required
							type='text'
							id='phoneNumber'
							name='phoneNumber'
							placeholder='Phone Number'
							defaultValue={phoneNumber}
							className='border border-black px-2 py-1'
						/>
					</div>
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
						<div
							className='grid'
							key={el.id}>
							<label htmlFor={el.id}>{el.label}</label>
							<input
								required
								type='text'
								id={el.id}
								name={el.id}
								placeholder={el.label}
								defaultValue={el.defaultValue}
								className={`border border-black px-2 py-1 ${
									el.id === 'postcode' ? 'uppercase placeholder:normal-case' : ''
								}`}
							/>
						</div>
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
						<div
							className='grid'
							key={el.id}>
							<label htmlFor={el.id}>{el.label}</label>
							<input
								required
								type='text'
								id={el.id}
								name={el.id}
								placeholder={el.label}
								defaultValue={el.defaultValue}
								className='border border-black px-2 py-1'
							/>
						</div>
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
