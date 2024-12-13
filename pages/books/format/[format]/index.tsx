import { useRouter } from 'next/router';
import { RootLayout } from '@/components/layout/Layout';
import axios from 'axios';

export default function FormatPage() {
	const router = useRouter();
	const { format } = router.query;

	const getBooks = async (genre: any) => {
		const booksResponse = await axios.post('http://localhost:3000/api/booksByFormat', { format: format });
		console.log(booksResponse.data);
	};

	if (format) getBooks(format);

	return (
		<RootLayout>
			<p>Format: {format}</p>
		</RootLayout>
	);
}
