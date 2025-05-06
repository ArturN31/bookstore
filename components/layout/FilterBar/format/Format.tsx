import { PostgrestResponse } from '@supabase/supabase-js';
import { DropdownList } from './DropdownList';
import { createClient } from '@/utils/db/server';

export const Format = async () => {
	const getFormats = async () => {
		try {
			const supabase = await createClient();
			const { data, error }: PostgrestResponse<Book> = await supabase.from('books').select('format');

			if (error) return { message: 'Failed to retrieve books from database.' };
			if (!data?.length) return { message: 'No book formats found.' };

			let formats: string[] = [...new Set(data?.map((entry) => entry.format))];
			return { formats: formats };
		} catch (error) {
			console.error(error);
			return { message: 'Failed to retrieve books from database.' };
		}
	};

	const formats = await getFormats();

	if (formats)
		return (
			<DropdownList
				formats={formats.formats}
				message={formats.message}
			/>
		);
};
