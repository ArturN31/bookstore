import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/db/server';

export const POST = async (req: NextRequest) => {
	try {
		const body = await req.json();
		const { signupData }: { signupData: { email: string; password: string } } = body;

		if (!body) {
			return NextResponse.json({ message: 'Parameters not passed with the request.' }, { status: 400 });
		}

		if (!signupData.email || !signupData.password) {
			return NextResponse.json({ message: 'Sign up details not passed with the request.' }, { status: 400 });
		}

		const supabase = await createClient();
		const { error } = await supabase.auth.signUp({ email: signupData.email, password: signupData.password });

		if (error) {
			if (error.code == 'email_exists')
				return NextResponse.json(
					{ message: 'Failed to insert user into the database as email already exists.' },
					{ status: 400 },
				);
			if (error.code == 'user_already_exists')
				return NextResponse.json(
					{ message: 'Failed to insert user into the database as it already exists.' },
					{ status: 400 },
				);
			if (error.code == 'weak_password')
				return NextResponse.json(
					{
						message:
							'Failed to insert user into the database as the password is too weak.\nIt has to include: lowercase, uppercase letters, digits, and symbols.',
					},
					{ status: 400 },
				);

			return NextResponse.json({ message: 'Failed to insert user into the database.' }, { status: 500 });
		}

		return NextResponse.json({ message: 'User has been added to the database.' }, { status: 200 });
	} catch (error) {
		console.error(error);
		return NextResponse.json({ message: 'Failed to insert user into the database.' }, { status: 500 });
	}
};
