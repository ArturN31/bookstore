import { Format } from './Format';
import { Genre } from './Genre';

export const StoreNavbar = () => {
	return (
		<div className='border-y border-gunmetal px-8 flex gap-1'>
			<Genre />
			<Format />
		</div>
	);
};
