import axios from 'axios';
import { useEffect, useState } from 'react';
import { DropdownList } from './DropdownList';

export const Genre = () => {
	const [genres, setGenres] = useState<{ genres: string[] }>({ genres: [] });

	const getGenres = async () => {
		const genresResponse = await axios.get('http://localhost:3000/api/getBooks/genreTypes');
		setGenres(genresResponse.data);
	};

	useEffect(() => {
		getGenres();
	}, []);

	return (
		<div className='w-fit'>
			<DropdownList genres={genres} />
		</div>
	);
};
