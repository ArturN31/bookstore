import Link from 'next/link';

export const BookMainDetails = ({
    stock,
    title,
    author,
    publicationDate,
    publisher,
    format,
    genre,
}: {
    stock: number;
    title: string;
    author: string;
    publicationDate: string;
    publisher: string;
    format: string;
    genre: string;
}) => {
    const isLowStock = stock > 0 && stock <= 25;

    return (
        <div className="grid items-center rounded-md border p-5 text-center shadow-[0px_2px_6px_-2px_#000]">
            {isLowStock && (
                <p className="m-auto grid h-fit w-fit items-center rounded-full bg-red-500 px-4 py-1 text-sm font-medium text-white">
                    {stock} left
                </p>
            )}

            <div>
                <h1 className="text-xl font-bold text-slate-900">{title}</h1>
                <p className="text-slate-600">
                    <span>by </span>
                    <Link
                        className="text-sky-600 transition-colors hover:text-sky-800 hover:underline"
                        href={`/books/author/${encodeURIComponent(author)}`}
                    >
                        {author}
                    </Link>
                </p>
            </div>

            <hr className="h-px border-t-0 bg-transparent bg-linear-to-r from-transparent via-neutral-500 to-transparent opacity-25" />

            <div className="space-y-1 text-sm text-slate-700">
                <p>
                    <span className="font-medium">Published:</span> {publicationDate}
                </p>
                <p>
                    <span className="font-medium">Publisher: </span>
                    <Link
                        className="text-sky-600 transition-colors hover:text-sky-800 hover:underline"
                        href={`/books/publisher/${encodeURIComponent(publisher)}`}
                    >
                        {publisher}
                    </Link>
                </p>
                <p>
                    <span className="font-medium">Format: </span>
                    <Link
                        href={`/books/format/${encodeURIComponent(format)}`}
                        className="text-sky-600 transition-colors hover:text-sky-800 hover:underline"
                    >
                        {format}
                    </Link>
                </p>
                <p>
                    <span className="font-medium">Genre: </span>
                    <Link
                        href={`/books/genre/${encodeURIComponent(genre)}`}
                        className="text-sky-600 transition-colors hover:text-sky-800 hover:underline"
                    >
                        {genre}
                    </Link>
                </p>
            </div>
        </div>
    );
};
