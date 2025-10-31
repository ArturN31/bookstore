import { createClient } from '@/utils/db/server';
import { PostgrestResponse } from '@supabase/supabase-js';
import { CustomPopoverWithList } from '@/components/CustomPopoverWithList';
import { redirect } from 'next/navigation';

export const handleGenreChoice = async (filter: string) => {
	'use server';
	const option =
		filter.slice(0, 1) + filter.slice(1, filter.length + 1).toLocaleLowerCase();

	redirect(`/books/genre/${option}`);
};

export const Genre = async () => {
	const getGenres = async () => {
		try {
			const supabase = await createClient();
			const { data, error }: PostgrestResponse<Book> = await supabase
				.from('books')
				.select('genre');

			if (error)
				return { genres: [], message: 'Failed to retrieve books from database.' };
			if (!data?.length) return { genres: [], message: 'No book genres found.' };

			let genres: string[] = [...new Set(data.map((entry) => entry.genre))].sort((a, b) =>
				a.localeCompare(b),
			);
			return { genres: genres, message: undefined };
		} catch (error) {
			return { genres: [], message: 'Failed to retrieve books from database.' };
		}
	};

	const genres = await getGenres();

	return (
		<CustomPopoverWithList
			btnText='Genre'
			btnIcon={undefined}
			listToRender={genres.genres}
			listIcons={undefined}
			message={genres.message}
			listItemOnClick={handleGenreChoice}
		/>
	);
};
