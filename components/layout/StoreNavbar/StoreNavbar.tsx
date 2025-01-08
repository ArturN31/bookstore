import { Format } from './format/Format';
import { Genre } from './genre/Genre';

export const StoreNavbar = () => {
	return (
		<div className='border-y border-gunmetal px-8 flex gap-1'>
			<Genre />
			<Format />
		</div>
	);
};
