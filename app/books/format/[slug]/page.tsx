import { RootLayout } from '@/components/layout/Layout';
import { createClient } from '@/utils/db/server';
import { PostgrestResponse } from '@supabase/supabase-js';

export default async function FormatPage({ params }: { params: Promise<{ slug: string }> }) {
	const slug = (await params).slug;

	const getBooks = async (format: any) => {
		const supabase = await createClient();
		const { data, error }: PostgrestResponse<Book> = await supabase.from('books').select('*').eq('format', format);

		if (error) {
			console.log(error);
			return 'Could not retrieve books for this format.';
		}

		if (data.length < 1) return 'There are no books for this format.';

		console.log(data);
	};

	if (slug) getBooks(slug);

	return (
		<RootLayout>
			<p>Format: {slug}</p>
		</RootLayout>
	);
}
