import { AddressForm } from '@/components/AddressForm';
import { RootLayout } from '@/components/layout/Layout';
import { getUserData, getUserDataProperty } from '@/data/user/GetUserData';
import { createClient } from '@/utils/db/server';
import { Pencil } from 'lucide-react';
import Link from 'next/link';

const getData = async () => {
	const handleDataUpdate = async () => {
		userData = await getUserData();
		userEmail = await getUserDataProperty('email');
	};

	//get data
	let userData = await getUserData();
	let userEmail = await getUserDataProperty('email');

	//updates user data when data is inserted into the users table
	//reloads the ui on successfull entry of data from the AddressForm
	const supabase = await createClient();
	const channel = supabase
		.channel('custom-insert-channel')
		.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, async (payload) => {
			await handleDataUpdate();
		})
		.subscribe();

	return { userData, userEmail, channel };
};

export default async function UserProfile() {
	const { userData, userEmail, channel } = await getData();
	channel.unsubscribe();

	if (!userData)
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
	else
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
								{userData.first_name} {userData.last_name}
							</p>
						</div>

						<div className='border border-black text-center flex flex-col justify-center p-5 rounded-md shadow-[0px_2px_6px_-2px_#000]'>
							<p className='font-semibold'>Address:</p>
							<p>{userData.street_address}</p>
							<p>{userData.postcode}</p>
							<p>
								{userData.city}, {userData.country}
							</p>
						</div>

						<div className='border border-black text-center flex flex-col justify-center p-5 rounded-md shadow-[0px_2px_6px_-2px_#000]'>
							<p className='font-semibold'>Contact details:</p>
							<p>{userData.phone_number}</p>
							<p>{userEmail}</p>
						</div>
					</div>
				</div>
			</RootLayout>
		);
}
