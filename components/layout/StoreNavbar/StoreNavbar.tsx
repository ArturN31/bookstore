import { Format } from './format/Format';
import { Genre } from './genre/Genre';
import { Home } from './home';

export const StoreNavbar = () => {
	return (
		<div className='border-y border-gunmetal px-8 flex gap-1'>
			<Home />
			<Genre />
			<Format />
		</div>
	);
};
