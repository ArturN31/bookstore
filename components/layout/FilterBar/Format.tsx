'use server';

import { PostgrestResponse } from '@supabase/supabase-js';
import { createBackendClient } from '@/utils/db/server';
import { CustomPopoverWithList } from '@/components/CustomPopoverWithList';
import { redirect } from 'next/navigation';

export const handleFormatChoice = async (filter: string) => {
    const option = filter.slice(0, 1) + filter.slice(1, filter.length + 1).toLocaleLowerCase();
    redirect(`/books/format/${option}`);
};

export const Format = async () => {
    const getFormats = async () => {
        try {
            const supabase = await createBackendClient();
            const { data, error }: PostgrestResponse<Book> = await supabase
                .from('books')
                .select('format');

            if (error) return { formats: [], message: 'Failed to retrieve books from database.' };
            if (!data?.length) return { formats: [], message: 'No book formats found.' };

            let formats: string[] = [...new Set(data.map((entry) => entry.format))].sort((a, b) =>
                a.localeCompare(b),
            );
            return { formats: formats, message: undefined };
        } catch (error) {
            return { formats: [], message: 'Failed to retrieve books from database.' };
        }
    };

    const formats = await getFormats();

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
