import { CardContent, CardMedia } from '@mui/material';
import Image from 'next/image';

export const BookCardBody = ({ book }: { book: Book }) => {
    const year = book.publication_date ? new Date(book.publication_date).getFullYear() : '';
    const imageSrc = book.image_url || '/placeholder-book.svg';

    return (
        <div className="flex grow flex-col">
            <CardMedia className="relative aspect-4/5 w-full overflow-hidden bg-slate-50">
                <Image
                    className="object-cover transition-all duration-500 group-hover:scale-110"
                    src={imageSrc}
                    alt={book.title}
                    fill
                    sizes="(max-width: 1080px) 280px, (max-width: 1920px) 400px, 800px"
                    priority
                />
            </CardMedia>

            <CardContent className="1080p:p-5 4k:p-10 flex grow flex-col p-3 pt-4">
                <div className="4k:space-y-4 space-y-0.5">
                    <h3 className="1080p:text-base 1440p:text-lg 4k:text-4xl 4k:min-h-24 line-clamp-2 min-h-8 text-[13px] leading-tight font-black text-slate-900">
                        {book.title}
                    </h3>
                    <p className="1080p:text-xs 4k:text-2xl truncate text-[10px] font-bold tracking-tight text-slate-400 uppercase">
                        {book.author}
                    </p>
                </div>

                <div className="1080p:text-xs 4k:text-xl 4k:mt-10 4k:pt-6 mt-3 flex items-center justify-between border-t border-slate-50 pt-2 text-[9px] font-bold text-slate-300">
                    <span className="1080p:max-w-none max-w-20 truncate uppercase">
                        {book.publisher}
                    </span>
                    <span>{year}</span>
                </div>

                <div className="4k:pt-8 mt-auto flex items-end justify-between pt-2">
                    <div className="leading-none">
                        <span className="1080p:text-[10px] 4k:text-xl text-[8px] font-black tracking-tighter text-indigo-600 uppercase">
                            {book.sales_count} Sold
                        </span>
                        <p className="1080p:text-xl 4k:text-6xl 4k:mt-2 text-base font-[1000] text-slate-900">
                            £{Number(book.price).toFixed(2)}
                        </p>
                    </div>
                    <div className="1080p:h-6 1080p:w-1.5 4k:h-16 4k:w-4 h-4 w-1 bg-yellow-400" />
                </div>
            </CardContent>
        </div>
    );
};
