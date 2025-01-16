'use client';

import { useState } from 'react';
import { TextField } from './TextField';

interface AddressForm {
	firstName: string;
	lastName: string;
	dob: Date;
	streetAddress: string;
	postcode: string;
	city: string;
	country: string;
	phoneNumber: string;
}

export const AddressForm = () => {
	const [formData, setFormData] = useState<AddressForm>({
		firstName: '',
		lastName: '',
		dob: new Date(),
		streetAddress: '',
		postcode: '',
		city: '',
		country: '',
		phoneNumber: '',
	});

	const handleStateChange = (el: string, value: string) => {
		setFormData((prevFormData) => {
			return {
				...prevFormData,
				[el]: value,
			};
		});
	};

	return (
		<form className='grid border gap-2 p-5'>
			<div>
				<h1 className='text-2xl'>Tell Us Where to Ship</h1>
				<p className='font-light'>Enter your shipping address information below.</p>
			</div>
			<TextField
				placeholder='First Name'
				label='First Name'
				id='firstName'
				input={formData.firstName}
				handleInputChange={handleStateChange}
			/>
			<TextField
				placeholder='Last Name'
				label='Last Name'
				id='lastName'
				input={formData.lastName}
				handleInputChange={handleStateChange}
			/>
			<input
				type='date'
				name=''
				id=''
			/>
			<TextField
				placeholder='Street Address'
				label='Street Address'
				id='streetAddress'
				input={formData.streetAddress}
				handleInputChange={handleStateChange}
			/>
			<TextField
				placeholder='Postcode'
				label='Postcode'
				id='postcode'
				input={formData.postcode}
				handleInputChange={handleStateChange}
			/>
			<TextField
				placeholder='City'
				label='City'
				id='city'
				input={formData.city}
				handleInputChange={handleStateChange}
			/>
			<TextField
				placeholder='Country'
				label='Country'
				id='country'
				input={formData.country}
				handleInputChange={handleStateChange}
			/>
			<TextField
				placeholder='Phone Number'
				label='Phone Number'
				id='phoneNumber'
				input={formData.phoneNumber}
				handleInputChange={handleStateChange}
			/>
		</form>
	);
};
