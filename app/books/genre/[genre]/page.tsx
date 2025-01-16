'use client';

import { usePathname } from 'next/navigation';
import { RootLayout } from '@/components/layout/Layout';
import axios from 'axios';

export default function GenrePage() {
	const pathname = usePathname();
	const genre = pathname?.split('/')[3];

	const getBooks = async (genre: any) => {
		const booksResponse = await axios.post('http://localhost:3000/api/getBooks/byGenre', { genre: genre });
		console.log(booksResponse.data);
	};

	if (genre) getBooks(genre);

	return (
		<RootLayout>
			<p>Genre: {genre}</p>
		</RootLayout>
	);
}
