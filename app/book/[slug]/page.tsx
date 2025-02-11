import { RootLayout } from '@/components/layout/Layout';
import { getBook } from '@/data/book/GetBookData';

export default async function BookById({ params }: { params: Promise<{ slug: string }> }) {
	const slug = (await params).slug as unknown as string;

	const book = await getBook(slug);

	console.log(book);

	if (typeof book !== 'string')
		return (
			<RootLayout>
				<div>
					<p>{book.title}</p>
				</div>
			</RootLayout>
		);
}
