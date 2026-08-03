'use server';

import { CustomPopoverWithList } from '@/components/ui/CustomPopoverWithList';
import { redirect } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { createPublicServerClient } from '@/utils/db/publicServer';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';

export const handleGenreChoice = async (filter: string) => {
    const option = filter.slice(0, 1) + filter.slice(1, filter.length + 1).toLocaleLowerCase();
    redirect(`/books/genre/${option}`);
};

const getCachedGenres = unstable_cache(
    async () => {
        const supabase = await createPublicServerClient();
        const result = await safeSupabaseQuery<Pick<Book, 'genre'>[]>(async () =>
            supabase.from('books').select('genre'),
        );
        if (result.error) return { genres: [], message: result.error };
        if (!result.data || result.data.length === 0)
            return { genres: [], message: 'No book genres found.' };

        const genres: string[] = [...new Set(result.data.map((entry) => entry.genre))]
            .filter((genre): genre is string => typeof genre === 'string' && genre.length > 0)
            .sort((a, b) => a.localeCompare(b));
        if (genres.length === 0) return { genres: [], message: 'No book genres found.' };
        return { genres, message: undefined };
    },
    ['books-genres-list'],
    {
        revalidate: 3600,
        tags: ['books'],
    },
);

export const Genre = async () => {
    const genres = await getCachedGenres();

    return (
        <CustomPopoverWithList
            btnText="Genre"
            btnIcon={undefined}
            listToRender={genres.genres}
            listIcons={undefined}
            message={genres.message}
            listItemOnClick={handleGenreChoice}
        />
    );
};
