import { useState } from 'react';
import { EmailField } from './EmailField';
import { PasswordField } from './PasswordField';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface SigninForm {
	email: string;
	password: string;
}

export const SigninForm = () => {
	const [formData, setFormData] = useState<SigninForm>({
		email: '',
		password: '',
	});

	const router = useRouter();

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
		});
	};

	const handleFormSubmit = async (e: any) => {
		//missing sing in details
		if (formData.email === '' && formData.password === '') return;

		//send details to api
		try {
			const signinResponse = await axios.post('http://localhost:3000/api/auth/signin', { signinData: formData });

			if (signinResponse.data.message === 'Signed in successfully.') {
				//signin successfull
				router.push('/user/profile');
			} else {
				//handle signin errors
			}
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<form
			action={handleFormSubmit}
			className='grid place-self-center border border-black rounded-lg gap-2 p-5'
			style={{ boxShadow: '0px 2px 6px -2px black' }}>
			<div className='text-center'>
				<h1 className='text-2xl'>Welcome Back, Bookworm!</h1>
				<p className='font-light'>Enter your details to access your bookish adventures.</p>
			</div>
			<EmailField
				input={formData.email}
				handleInputChange={handleStateChange}
			/>
			<PasswordField
				label='Password'
				id='password'
				input={formData.password}
				error={false}
				handleInputChange={handleStateChange}
			/>
			<div className='flex justify-end gap-3 mt-3'>
				<button
					type='submit'
					className='border border-black rounded-md px-2 py-1 hover:bg-gunmetal/15'>
					Sign In
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
