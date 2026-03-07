import { CardContent, CardMedia, List } from '@mui/material';
import Image from 'next/image';
import { BookCardCart } from '@/components/books/bookCard/Body/BookCardCart';

export const BookCardBodyContent = ({ book }: { book: Book }) => {
    return (
        <div className="grid h-full">
            <CardMedia className="max-h-50 bg-black">
                <Image
                    className="m-auto"
                    src={book.image_url}
                    alt={`The placeholder image for ${book.title}.`}
                    width={200}
                    height={200}
                />
            </CardMedia>
            <CardContent>
                <List className="grid gap-3 text-center">
                    <p className="text-gunmetal text-base font-semibold">{book.title}</p>
                    <div className="grid gap-1">
                        <p className="text-gunmetal text-sm font-normal">{book.author}</p>
                        <p className="text-xs font-light text-gray-400">{book.publisher}</p>
                    </div>
                    <p className="text-xl font-bold">{book.price}</p>
                </List>
            </CardContent>
            <BookCardCart book={book} />
        </div>
    );
};
