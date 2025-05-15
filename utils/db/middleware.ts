import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
	let supabaseResponse = NextResponse.next({
		request,
	});

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_DB_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_DB_ANON_PUBLIC_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					console.log('Cookies to set:', cookiesToSet);

					cookiesToSet.forEach(({ name, value, options }) => {
						console.log(
							`Setting cookie: <span class="math-inline">\{name\}\=</span>{value} (options: ${JSON.stringify(
								options,
							)})`,
						);
						request.cookies.set(name, value);
					});

					supabaseResponse = NextResponse.next({
						request,
					});

					cookiesToSet.forEach(({ name, value, options }) => {
						console.log(
							`Setting cookie on response: <span class="math-inline">\{name\}\=</span>{value} (options: ${JSON.stringify(
								options,
							)})`,
						);
						supabaseResponse.cookies.set(name, value, options);
					});
				},
			},
		},
	);

	// Do not run code between createServerClient and
	// supabase.auth.getUser(). A simple mistake could make it very hard to debug
	// issues with users being randomly logged out.

	// IMPORTANT: DO NOT REMOVE auth.getUser()

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/auth')) {
		// no user, potentially respond by redirecting the user to the login page
		const url = request.nextUrl.clone();
		url.pathname = '/user/auth/signin';
		return NextResponse.redirect(url);
	}

	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (session && session.expires_at) {
		const now = Math.floor(Date.now() / 1000);
		const timeUntilExpiry = session.expires_at - now;

		const refreshThreshold = 60; // 1 min

		if (timeUntilExpiry < refreshThreshold) {
			// Refresh if close to expiring or already expired
			console.log('Access token close to expiring or expired. Attempting refresh.');

			const { error } = await supabase.auth.refreshSession(session);

			if (error) {
				console.error('Session refresh failed:', error);
			} else {
				console.log('Session refresh successful!');
			}
		} else {
			console.log('Access token is valid.');
			console.log(`expires: ${session.expires_at} date:${new Date(session.expires_at * 1000)}`);
			console.log(`now: ${new Date()}`);
		}
	}

	// IMPORTANT: You *must* return the supabaseResponse object as it is.
	// If you're creating a new response object with NextResponse.next() make sure to:
	// 1. Pass the request in it, like so:
	//    const myNewResponse = NextResponse.next({ request })
	// 2. Copy over the cookies, like so:
	//    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
	// 3. Change the myNewResponse object to fit your needs, but avoid changing
	//    the cookies!
	// 4. Finally:
	//    return myNewResponse
	// If this is not done, you may be causing the browser and server to go out
	// of sync and terminate the user's session prematurely!

	return supabaseResponse;
}
