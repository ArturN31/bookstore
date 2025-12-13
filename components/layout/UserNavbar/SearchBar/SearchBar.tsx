'use client';

import { SearchOutput } from './SearchOutput';
import { ChangeEvent, useEffect, useState } from 'react';
import { SearchInput } from './SearchInput';
import { getAllBooks } from '@/data/books/GetBooksData';

export const SearchBar = () => {
	const [input, setInput] = useState('');
	const [isDropdownVisible, setIsDropdownVisible] = useState(false);
	const [searchResults, setSearchResults] = useState<Book[]>([]);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { value } = e.target;
		setInput(value);
		setIsDropdownVisible(true);
		setErrorMessage(null);
	};

	const fetchAndFilterBooks = async (searchTerm: string) => {
		setSearchResults([]);
		setErrorMessage(null);

		try {
			const allBooks = await getAllBooks();

			if (!allBooks) {
				setErrorMessage('No books available to search.');
				setIsDropdownVisible(true);
				return;
			}

			const filteredBooks = allBooks
				.filter((book: Book) => book.is_active)
				.filter((book: Book) =>
					book.title.toLowerCase().includes(searchTerm.toLowerCase()),
				)
				.slice(0, 10);

			setSearchResults(filteredBooks);
			setIsDropdownVisible(true);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: 'An unknown error occurred while fetching books.';

			setErrorMessage(
				`Failed to retrieve books. Please try again later. Details: ${message}`,
			);
			setSearchResults([]);
			setIsDropdownVisible(true);
		}
	};

	const handleMouseEnter = () => setIsDropdownVisible(true);
	const handleMouseLeave = () => setIsDropdownVisible(false);

	useEffect(() => {
		if (input) {
			const delaySearch = setTimeout(() => {
				fetchAndFilterBooks(input);
			}, 1000);

			return () => clearTimeout(delaySearch);
		} else {
			setSearchResults([]);
			setErrorMessage(null);
		}
	}, [input]);

	return (
		<div
			data-testid='searchbar'
			className='grid relative'
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}>
			<SearchInput
				input={input}
				handleInput={handleInputChange}
			/>
			{input && isDropdownVisible && (
				<SearchOutput
					books={searchResults}
					errorMessage={errorMessage}
				/>
			)}
		</div>
	);
};
