'use server';

import { redirect } from 'next/navigation';
import { CustomPopoverWithList } from '@/components/ui/CustomPopoverWithList';
import { unstable_cache } from 'next/cache';
import { createPublicServerClient } from '@/utils/db/publicServer';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';

export const handleFormatChoice = async (filter: string) => {
    const option = filter.slice(0, 1) + filter.slice(1, filter.length + 1).toLocaleLowerCase();
    redirect(`/books/format/${option}`);
};

const getCachedFormats = unstable_cache(
    async () => {
        const supabase = await createPublicServerClient();
        const result = await safeSupabaseQuery<Pick<Book, 'format'>[]>(async () =>
            supabase.from('books').select('format'),
        );
        if (result.error) return { formats: [], message: result.error };
        if (!result.data || result.data.length === 0)
            return { formats: [], message: 'No book formats found.' };

        const formats: string[] = [...new Set(result.data.map((entry) => entry.format))]
            .filter((format): format is string => typeof format === 'string' && format.length > 0)
            .sort((a, b) => a.localeCompare(b));
        if (formats.length === 0) return { formats: [], message: 'No book formats found.' };
        return { formats, message: undefined };
    },
    ['books-formats-list'],
    {
        revalidate: 3600,
        tags: ['books'],
    },
);

export const Format = async () => {
    const formats = await getCachedFormats();

    return (
        <CustomPopoverWithList
            btnText="Format"
            btnIcon={undefined}
            listToRender={formats.formats}
            listIcons={undefined}
            message={formats.message}
            listItemOnClick={handleFormatChoice}
        />
    );
};
