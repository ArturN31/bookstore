import { RootLayout } from '@/components/layout/Layout';
import { createClient } from '@/utils/db/server';
import { PostgrestResponse } from '@supabase/supabase-js';
import { OutputBook } from '@/components/books/OutputBook';
import { ChevronRight } from 'lucide-react';

export default async function RetrieveBooksForGroupsAndTypesPage({ params }: { params: Promise<{ slug: string }> }) {
	const slug = (await params).slug as unknown as string[];
	const group = slug[0]; //represents the book group - genre/format
	const type = decodeURIComponent(slug[1]); //represents the type - Adventure/Comedy/Paperback/Hardcover

	const getBooks = async (group: string, type: string) => {
		const supabase = await createClient();
		const { data, error }: PostgrestResponse<Book> = await supabase.from('books').select('*').eq(group, type);

		if (error) {
			console.log(error);
			return `Could not retrieve books for this group: ${group} and type: ${type}.`;
		}

		if (data.length < 1) return `There are no books for this group: ${group} and type: ${type}.`;

		return data;
	};

	const books = await getBooks(group, type);
	console.log(books);

	if (typeof books === 'string')
		return (
			<RootLayout>
				<div>
					<p>{books}</p>
				</div>
			</RootLayout>
		);

	return (
		<RootLayout>
			<div>
				<p className='flex items-center w-fit py-1'>
					Books{' '}
					<ChevronRight
						size={16}
						strokeWidth={2.5}
					/>{' '}
					{String(group).charAt(0).toUpperCase() + String(group).slice(1)}{' '}
					<ChevronRight
						size={16}
						strokeWidth={2.5}
					/>{' '}
					{type}
				</p>

				<div className='flex flex-wrap justify-center gap-5'>
					{books.map((book) => (
						<OutputBook book={book} />
					))}
				</div>
			</div>
		</RootLayout>
	);
}
