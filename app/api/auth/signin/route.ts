import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/db/server';

export const POST = async (req: NextRequest) => {
	try {
		const body = await req.json();
		const { signinData }: { signinData: { email: string; password: string } } = body;

		if (!body) {
			return NextResponse.json({ message: 'Parameters not passed with the request.' }, { status: 400 });
		}

		if (!signinData.email || !signinData.password) {
			return NextResponse.json({ message: 'Sign in details not passed with the request.' }, { status: 400 });
		}

		const supabase = await createClient();
		const { error } = await supabase.auth.signInWithPassword({
			email: signinData.email,
			password: signinData.password,
		});

		if (error) {
			if (error.code == 'invalid_credentials')
				return NextResponse.json({ message: 'Sign in credentials not recognised.' }, { status: 400 });
			if (error.code == 'user_not_found')
				return NextResponse.json(
					{ message: 'User to which the API request relates no longer exists.' },
					{ status: 400 },
				);

			return NextResponse.json({ message: 'Failed to sign in.' }, { status: 500 });
		}

		return NextResponse.json({ message: 'Signed in successfully.' }, { status: 200 });
	} catch (error) {
		console.error(error);
		return NextResponse.json({ message: 'Failed to sign in.' }, { status: 500 });
	}
};
