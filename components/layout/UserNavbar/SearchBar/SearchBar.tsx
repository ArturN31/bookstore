'use client';

import { SearchOutput } from './SearchOutput';
import { ChangeEvent, useEffect, useState } from 'react';
import { SearchInput } from './SearchInput';
import { getAllBooks } from '@/data/books/GetBooksData';

export const SearchBar = () => {
	const [input, setInput] = useState('');
	const [isDropdownVisible, setIsDropdownVisible] = useState(false);
	const [searchResults, setSearchResults] = useState<Book[]>([]);

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { value } = e.target;
		setInput(value);
		setIsDropdownVisible(true);
	};

	const fetchAndFilterBooks = async (searchTerm: string) => {
		try {
			const allBooks = await getAllBooks();
			if (!allBooks) return null;

			const filteredBooks = allBooks
				.filter((book: Book) => book.is_active)
				.filter((book: Book) => book.title.toLowerCase().includes(searchTerm.toLowerCase()))
				.slice(0, 10);

			setSearchResults(filteredBooks);
			setIsDropdownVisible(true);
		} catch (error) {
			console.error('Error fetching books:', error);
		}
	};

	const handleMouseEnter = () => setIsDropdownVisible(true);
	const handleMouseLeave = () => setIsDropdownVisible(false);

	useEffect(() => {
		const delaySearch = setTimeout(() => {
			fetchAndFilterBooks(input);
		}, 1000);

		return () => clearTimeout(delaySearch);
	}, [input]);

	return (
		<div
			className='grid relative'
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}>
			<SearchInput
				input={input}
				handleInput={handleInputChange}
			/>
			{input && isDropdownVisible && <SearchOutput books={searchResults} />}
		</div>
	);
};
