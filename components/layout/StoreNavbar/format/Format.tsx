import axios from 'axios';
import { DropdownList } from './DropdownList';
import { useEffect, useState } from 'react';

export const Format = () => {
	const [formats, setFormats] = useState({ formats: [] });

	const getFormats = async () => {
		const formatsResponse = await axios.get('http://localhost:3000/api/getBooks/formatTypes');
		setFormats(formatsResponse.data);
	};

	useEffect(() => {
		getFormats();
	}, []);

	return (
		<div className='w-fit'>
			<DropdownList formats={formats} />
		</div>
	);
};
