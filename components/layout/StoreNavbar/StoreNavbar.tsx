import { Format } from './format/Format';
import { Genre } from './genre/Genre';
import { Home } from './home';

export const StoreNavbar = () => {
	return (
		<div className='border-y border-gunmetal'>
			<div className='flex gap-1 md:max-w-[800px] xl:max-w-[1000px] px-3 m-auto justify-center md:justify-start'>
				<Home />
				<Genre />
				<Format />
			</div>
		</div>
	);
};
