export const RemoveFromCartCardForm = ({ cartID, bookID }: { cartID: string | null; bookID: string }) => {
	return (
		<form>
			<button className='border px-2 py-1 cursor-pointer'>Remove from cart</button>
		</form>
	);
};
