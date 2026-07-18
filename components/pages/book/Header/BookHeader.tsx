import { BookCart } from './BookCart';
import Image from 'next/image';
import { BookHeaderDetails } from './BookHeaderDetails';

export const BookHeader = ({ book }: { book: Book }) => {
    const { image_url, title } = book;

    return (
        <header
            className="grid h-min grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3"
            aria-label="Book overview"
        >
            <div className="grid justify-center overflow-hidden rounded-md bg-black shadow-[0px_2px_6px_-2px_#000]">
                <Image
                    width={200}
                    height={200}
                    sizes="(max-width: 300px) 100vw, 33vw"
                    style={{ width: '100%', height: 'auto', maxHeight: '300px' }}
                    src={image_url || '/placeholder-book.svg'}
                    alt={`Cover for ${title}`}
                    priority
                />
            </div>

            <BookHeaderDetails book={book} />

            <BookCart book={book} />
        </header>
    );
};
