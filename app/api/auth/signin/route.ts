import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAnonClient } from '@/utils/dbConnect';
import { serialize } from 'cookie';

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

		const supabase = getSupabaseAnonClient();
		const { data, error } = await supabase.auth.signInWithPassword({
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

		//JSON object for response
		const JSONresponse = {
			message: 'Signed in successfully.',
			user: {
				id: data.user.id,
				email: data.user.email,
				role: data.user.role,
			},
		};

		//set the access token cookie
		const accessTokenCookie = serialize('access_token', data.session.access_token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			maxAge: data.session.expires_in,
			path: '/',
			sameSite: 'strict',
		});

		//set the refresh token cookie
		const refreshTokenCookie = serialize('refresh_token', data.session.refresh_token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 365,
			path: '/',
			sameSite: 'strict',
		});

		//prep the response
		const response = new NextResponse(JSON.stringify(JSONresponse), { status: 200 });
		response.headers.append('Set-Cookie', accessTokenCookie);
		response.headers.append('Set-Cookie', refreshTokenCookie);

		return response;
	} catch (error) {
		console.error(error);
		return NextResponse.json({ message: 'Failed to sign in.' }, { status: 500 });
	}
};
