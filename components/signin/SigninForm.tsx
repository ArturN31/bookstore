import { useEffect, useState } from 'react';
import { EmailField } from './EmailField';
import { PasswordField } from './PasswordField';

interface SigninForm {
	email: string;
	password: string;
	cnfPassword: string;
}

interface SigninFormErrors {
	email: boolean;
	password: boolean;
	cnfPassword: boolean;
}

export const SigninForm = () => {
	const [formData, setFormData] = useState<SigninForm>({
		email: '',
		password: '',
		cnfPassword: '',
	});

	const [formError, setFormError] = useState('');

	const [formErrors, setFormErrors] = useState<SigninFormErrors>({
		email: false,
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
			email: false,
			password: false,
			cnfPassword: false,
		});
		setFormError('');
	};

	const handleFormSubmit = (e: any) => {
		setFormError('');

		if (formData.password !== formData.cnfPassword) {
			setFormError('Passwords do not match');
			setFormErrors({
				email: formErrors.email,
				password: true,
				cnfPassword: true,
			});
		}

		//create an account
		console.log(formData);
	};

	useEffect(() => {
		if (formData.password === formData.cnfPassword) {
			setFormError('');
			setFormErrors({
				email: formErrors.email,
				password: false,
				cnfPassword: false,
			});
		}
	}, [formData]);

	return (
		<form
			action={handleFormSubmit}
			className='grid border rounded-lg gap-2 p-5 max-w-[500px] m-auto'
			style={{ boxShadow: '0px 2px 6px -2px black' }}>
			<div>
				<h1 className='text-2xl'>Create Your Account</h1>
				<p className='font-light'>Let's get you started! Please enter your information below.</p>
				{formError ? <p className='font-semibold text-red-500'>{formError}</p> : ''}
			</div>
			<EmailField
				input={formData.email}
				error={formErrors.email}
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
			<div className='flex justify-end gap-3'>
				<button
					type='submit'
					className='border border-black rounded-md px-2 py-1 hover:bg-gunmetal/15'>
					Submit
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
