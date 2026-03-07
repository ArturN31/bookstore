import { User } from '@supabase/supabase-js';
import { CredentialRow } from './CredentialRow';

export const AdminSection = ({ adminUser }: { adminUser: User }) => {
    return (
        <div className="relative bg-white lg:col-span-5">
            <CredentialRow
                label="Master_Root_Access"
                value={adminUser?.email || 'unassigned@root'}
                isPrimary
            />

            <div className="border-t border-slate-100 p-6">
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    System_Permissions
                </p>
                <div className="mt-2 flex gap-2">
                    {['Write_All', 'Bypass_RLS'].map((p) => (
                        <span
                            key={p}
                            className="bg-yellow text-gunmetal hover:bg-gunmetal hover:text-yellow cursor-default px-2 py-0.5 text-[9px] font-black tracking-tighter uppercase transition-colors"
                        >
                            {p}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};
