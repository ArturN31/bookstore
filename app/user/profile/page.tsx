import { AddressForm } from '@/components/AddressForm';
import { RootLayout } from '@/components/layout/Layout';
import { createClient } from '@/utils/db/server';
import { Pencil } from 'lucide-react';
import Link from 'next/link';

export default async function UserProfile() {
	const getUserProp = async (prop: keyof User) => {
		try {
			const supabase = await createClient();
			let {
				data: { user },
				error,
			} = await supabase.auth.getUser();
			if (error) console.log(error);
			if (user) return user[prop as keyof typeof user] as string;
		} catch (error) {
			console.log(error);
		}
	};

	const getUserData = async () => {
		try {
			const userID = await getUserProp('id');
			const supabase = await createClient();
			let { data, error } = await supabase.from('users').select('*').eq('id', userID).single();
			if (error) console.log(error);
			return data as User;
		} catch (error) {
			console.log(error);
		}
	};

	const user = await getUserData();
	const userEmail = await getUserProp('email');

	if (!user)
		return (
			<RootLayout>
				<div className='grid gap-5'>
					<div className='text-center'>
						<p className='text-2xl'>Hello there!</p>
						<p className='text-lg font-light'>It looks like you haven't finished setting up your profile yet.</p>
					</div>
					<AddressForm />
				</div>
			</RootLayout>
		);

	return (
		<RootLayout>
			<div className='grid gap-5 justify-items-center'>
				<Link
					href={'/user/auth/change_password'}
					className='flex w-fit rounded-md bg-slate-100 hover:bg-slate-200 shadow-[-0px_2px_4px_-2px_#000] hover:shadow-[0px_0px_4px_-2px_#000]'>
					<div className='border border-black rounded-l-md px-2 py-1 text-lg'>Change Password</div>
					<div className='border-y border-r border-black rounded-r-md  px-2 py-1'>
						<Pencil />
					</div>
				</Link>

				<div className='grid grid-cols-3 gap-5'>
					<div className='border border-black text-center flex flex-col justify-center p-5 rounded-md shadow-[0px_2px_6px_-2px_#000]'>
						<p className='font-semibold'>Name:</p>
						<p>
							{user.first_name} {user.last_name}
						</p>
					</div>

					<div className='border border-black text-center flex flex-col justify-center p-5 rounded-md shadow-[0px_2px_6px_-2px_#000]'>
						<p className='font-semibold'>Address:</p>
						<p>{user.street_address}</p>
						<p>{user.postcode}</p>
						<p>
							{user.city}, {user.country}
						</p>
					</div>

					<div className='border border-black text-center flex flex-col justify-center p-5 rounded-md shadow-[0px_2px_6px_-2px_#000]'>
						<p className='font-semibold'>Contact details:</p>
						<p>{user.phone_number}</p>
						<p>{userEmail}</p>
					</div>
				</div>
			</div>
		</RootLayout>
	);
}
