import { type NextRequest } from 'next/server';
import { updateSession } from '@/utils/db/middleware';

export async function middleware(request: NextRequest) {
	return await updateSession(request);
}

export const config = {
	matcher: [
		//protected routes - requires sign in
		//match following request paths
		'/user/profile',
		'/user/profile/change_address',
		'/user/auth/change_password',
		'/user/wishlist',
	],
};
