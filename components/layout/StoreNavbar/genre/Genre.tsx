import { createClient } from '@/utils/db/server';
import { DropdownList } from './DropdownList';

export const Genre = async () => {
	const getGenres = async () => {
		try {
			const supabase = await createClient();
			const { data, error } = await supabase.from('books').select('genre');

			if (error) return { message: 'Failed to retrieve books from database.' };
			if (!data?.length) return { message: 'No book genres found.' };

			let genres: string[] = [...new Set(data?.map((entry) => entry.genre))];
			return { genres: genres };
		} catch (error) {
			console.error(error);
			return { message: 'Failed to retrieve books from database.' };
		}
	};

	const genres = await getGenres();

	if (genres)
		return (
			<div className='w-fit'>
				<DropdownList
					genres={genres.genres}
					message={genres.message}
				/>
			</div>
		);
};
