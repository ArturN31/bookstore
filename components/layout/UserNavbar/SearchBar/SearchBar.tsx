'use client';

import { SearchOutput } from './SearchOutput';
import { ChangeEvent, useEffect, useState } from 'react';
import { SearchInput } from './SearchInput';
import { getAllBooks } from '@/data/books/GetBooksData';

export const SearchBar = () => {
	const [input, setInput] = useState('');
	const [hovered, setHovered] = useState(false);
	const [books, setBooks] = useState<Book[]>([]);

	const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
		const { value } = e.target;
		setInput(value);
		setHovered(true);
	};

	const fetchBooks = async (val: string) => {
		try {
			const allBooks = await getAllBooks();
			if (allBooks) {
				const filteredBooks = allBooks
					.filter((book: Book) => book.is_active)
					.filter((book: Book) => book.title.toLowerCase().includes(val.toLowerCase()))
					.slice(0, 10);
				setBooks(filteredBooks);
				setHovered(true);
			}
		} catch (error) {
			console.error('Error fetching books:', error);
		}
	};

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			fetchBooks(input);
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [input]);

	return (
		<div
			className='grid relative'
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}>
			<SearchInput
				input={input}
				handleInput={handleInput}
			/>
			{input && hovered && <SearchOutput books={books} />}
		</div>
	);
};
