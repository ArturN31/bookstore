import { User } from '@supabase/supabase-js';
import { CredentialRow } from './CredentialRow';

export const UsersSection = ({ standardUsers }: { standardUsers: User[] }) => {
    return (
        <div className="bg-[#f8fafc] p-6 lg:col-span-7">
            <div className="mb-6 flex items-center justify-between">
                <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                    Standard_Identities [{standardUsers.length.toString().padStart(2, '0')}]
                </p>
                <div className="mx-4 h-px flex-1 bg-slate-200" />
            </div>

            <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2">
                {standardUsers.map((user) => (
                    <div
                        key={user.id}
                        className="transition-transform hover:translate-x-1"
                    >
                        <CredentialRow
                            value={user.email}
                            variant="minimal"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
