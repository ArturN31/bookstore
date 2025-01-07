import { useEffect, useState } from 'react';
import { EmailField } from './EmailField';
import { PasswordField } from './PasswordField';
import ReturnPolicy from '@/pages/returnpolicy';

interface SigninForm {
	email: string;
	password: string;
	cnfPassword: string;
}

interface SigninFormErrors {
	password: boolean;
	cnfPassword: boolean;
}

export const SignupForm = () => {
	const [formData, setFormData] = useState<SigninForm>({
		email: '',
		password: '',
		cnfPassword: '',
	});

	const [formError, setFormError] = useState('');

	const [formErrors, setFormErrors] = useState<SigninFormErrors>({
		password: false,
		cnfPassword: false,
	});

	const handleStateChange = (el: string, value: string) => {
		setFormData((prevFormData) => {
			return {
				...prevFormData,
				[el]: value,
			};
		});
	};

	const handleFormReset = () => {
		setFormData({
			email: '',
			password: '',
			cnfPassword: '',
		});
		setFormErrors({
			password: false,
			cnfPassword: false,
		});
		setFormError('');
	};

	const handleFormSubmit = (e: any) => {
		setFormError('');

		//passwords do not match
		if (formData.password !== formData.cnfPassword) {
			setFormError('Passwords do not match');
			setFormErrors({
				password: true,
				cnfPassword: true,
			});
			return;
		}

		//send details to api
		console.log(formData);
	};

	useEffect(() => {
		if (formData.password === formData.cnfPassword) {
			setFormError('');
			setFormErrors({
				password: false,
				cnfPassword: false,
			});
		}
	}, [formData]);

	return (
		<form
			action={handleFormSubmit}
			className='grid place-self-center border border-black rounded-lg gap-2 p-5'
			style={{ boxShadow: '0px 2px 6px -2px black' }}>
			<div className='text-center'>
				<h1 className='text-2xl'>Create Your Account</h1>
				<p className='font-light'>Let's get you started! Please enter your information below.</p>
				{formError ? <p className='font-semibold text-red-500'>{formError}</p> : ''}
			</div>
			<EmailField
				input={formData.email}
				handleInputChange={handleStateChange}
			/>
			<PasswordField
				label={formErrors.password ? 'Pasword (x)' : 'Password'}
				id='password'
				input={formData.password}
				error={formErrors.password}
				handleInputChange={handleStateChange}
			/>
			<PasswordField
				label={formErrors.cnfPassword ? 'Confirm Pasword (x)' : 'Confirm Password'}
				id='cnfPassword'
				input={formData.cnfPassword}
				error={formErrors.cnfPassword}
				handleInputChange={handleStateChange}
			/>
			<div className='flex justify-end gap-3 mt-3'>
				<button
					type='submit'
					className='border border-black rounded-md px-2 py-1 hover:bg-gunmetal/15'>
					Sign Up
				</button>
				<button
					type='reset'
					onClick={handleFormReset}
					className='border border-black rounded-md px-2 py-1 hover:bg-gunmetal/15'>
					Reset
				</button>
			</div>
		</form>
	);
};
