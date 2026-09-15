import { createBackendClient } from '@/utils/db/server';

export async function checkIsOwner(targetUsername: string): Promise<boolean> {
    if (!targetUsername) return false;

    const supabase = await createBackendClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { data: profileData } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single();

    const loggedInUsername = profileData?.username ?? null;

    return loggedInUsername !== null && loggedInUsername === targetUsername;
}
