import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';

export const CartBtn = () => {
	return (
		<div className='shadow-md rounded-full w-12 h-12 place-items-center grid bg-yellow hover:bg-yellow/[0.8] hover:border hover:border-black hover:cursor-pointer'>
			<ShoppingCartOutlinedIcon />
		</div>
	);
};
