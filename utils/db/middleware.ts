import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { recordSecurityAuditLog } from '../security/securityAuditLogger';

export async function updateSession(request: NextRequest): Promise<NextResponse> {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_DB_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => {
                        request.cookies.set(name, value);
                    });

                    supabaseResponse = NextResponse.next({
                        request,
                    });

                    cookiesToSet.forEach(({ name, value, options }) => {
                        supabaseResponse.cookies.set(name, value, options);
                    });
                },
            },
        },
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const isLoginOrAuth =
        request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/auth');

    if (!user && !isLoginOrAuth) {
        const attemptedPath = request.nextUrl.pathname;
        const isPrefetch = request.headers.get('Next-Router-Prefetch') === '1';
        const isLoggingOut = request.cookies.get('is_logging_out')?.value === 'true';

        if (!isPrefetch && !isLoggingOut) {
            void recordSecurityAuditLog(
                'UNAUTHORIZED_ACCESS_ATTEMPT',
                null,
                { path: attemptedPath },
                request.headers,
            );
        }

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
            console.log('Access token close to expiring or expired. Attempting refresh.');

            const { error } = await supabase.auth.refreshSession(session);

            if (error) console.error('Session refresh failed:', error);
            else console.log('Session refresh successful!');
        }
    }

    return supabaseResponse;
}
