import { createAdminClient } from '@/utils/db/admin';
import { CredentialRow } from './CredentialRow';
import { Suspense } from 'react';
import { AdminSection } from './AdminSection';
import { UsersSection } from './UsersSection';

export async function UserRegistry() {
    const supabase = await createAdminClient();
    const {
        data: { users: authUsers },
        error,
    } = await supabase.auth.admin.listUsers();

    if (error)
        return (
            <div className="border-4 border-red-600 bg-red-50 p-6 font-mono text-red-600 shadow-[8px_8px_0px_0px_rgba(220,38,38,0.1)]">
                <div className="mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse bg-red-600" />
                    <span className="font-black tracking-tighter uppercase">
                        Registry_Access_Denied
                    </span>
                </div>
                <p className="text-xs uppercase">Fault_Code: {error.message}</p>
            </div>
        );

    const users = authUsers || [];
    const adminUser =
        users.find((u) => u.app_metadata?.role === 'admin' || u.email?.includes('admin')) ||
        users[0];
    const standardUsers = users.filter((u) => u.id !== adminUser?.id).slice(0, 8);

    return (
        <Suspense fallback={<div className="h-64 animate-pulse bg-slate-200" />}>
            <div className="border-gunmetal bg-gunmetal relative grid grid-cols-1 gap-px overflow-hidden border-4 shadow-[12px_12px_0px_0px_rgba(32,39,47,0.1)] lg:grid-cols-12">
                <AdminSection adminUser={adminUser} />

                <UsersSection standardUsers={standardUsers} />
            </div>
        </Suspense>
    );
}
