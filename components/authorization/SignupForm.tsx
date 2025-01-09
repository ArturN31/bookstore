import { useEffect, useState } from 'react';
import { EmailField } from './EmailField';
import { PasswordField } from './PasswordField';
import axios from 'axios';

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

	const handleFormSubmit = async (e: any) => {
		setFormError('');

		//It has to include: lowercase, uppercase letters, digits, and symbols.
		const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;

		if (!regex.test(formData.password) || formData.password.length < 8) {
			//password is too weak
			setFormError(
				'Password has to be minimum 8 characters long and include: lowercase, uppercase letters, digits, and symbols.',
			);
			setFormErrors({
				password: true,
				cnfPassword: true,
			});
			return;
		}

		if (formData.password !== formData.cnfPassword) {
			//passwords do not match
			setFormError('Passwords do not match');
			setFormErrors({
				password: true,
				cnfPassword: true,
			});
			return;
		}

		if (formError !== '') return;
		else {
			//send sign up details to api
			try {
				const res = await axios.post('http://localhost:3000/api/auth/signup', { formData: formData });

				if (res.data.message === 'User has been added to the database.') {
					console.log(res);
					//account has been added
				}
			} catch (error: any) {
				console.log(error);

				if (error.response.data.message) setFormError(error.response.data.message);
			}
		}
	};

	useEffect(() => {
		const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;

		if (regex.test(formData.password) || formData.password.length >= 8) {
			setFormError('');
			setFormErrors({
				password: false,
				cnfPassword: false,
			});
			return;
		}

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
			className='grid place-self-center border border-black rounded-lg gap-2 p-5 w-[450px]'
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
