import { useRouter } from 'next/router';
import { RootLayout } from '@/components/layout/Layout';
import axios from 'axios';

export default function GenrePage() {
	const router = useRouter();
	const { genre } = router.query;

	const getBooks = async (genre: any) => {
		const booksResponse = await axios.post('http://localhost:3000/api/booksByGenre', { genre: genre });
		console.log(booksResponse.data);
	};

	if (genre) getBooks(genre);

	return (
		<RootLayout>
			<p>Genre: {genre}</p>
		</RootLayout>
	);
}
