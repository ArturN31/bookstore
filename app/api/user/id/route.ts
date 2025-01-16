import { NextRequest, NextResponse } from 'next/server';

export const GET = async (req: NextRequest) => {
	try {
		console.log(req.headers);

		return NextResponse.json({ message: 'Signed in successfully.' }, { status: 200 });
	} catch (error) {
		console.error(error);
		return NextResponse.json({ message: 'Failed to sign in.' }, { status: 500 });
	}
};
