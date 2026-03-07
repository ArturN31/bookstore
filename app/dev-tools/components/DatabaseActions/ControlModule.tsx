import { SeedControl } from './SeedControl';

export interface ControlModuleProps {
    id: string;
    title: string;
    description: string;
    type:
        | 'add_sales'
        | 'seed_discounts'
        | 'reset'
        | 'stock_purge'
        | 'review_bomb'
        | 'add_carts'
        | 'add_wishlists'
        | 'add_books';
}

export const ControlModule = ({ id, title, description, type }: ControlModuleProps) => (
    <div className="flex flex-col bg-white p-6 transition-all hover:shadow-inner">
        <div className="mb-8 flex items-center justify-between">
            <span className="bg-gunmetal px-2 py-1 font-mono text-[10px] font-bold tracking-tighter text-white uppercase">
                {id}
            </span>
        </div>
        <h3 className="text-gunmetal text-2xl leading-none font-black tracking-tighter uppercase">
            {title}
        </h3>
        <p className="mt-2 min-h-7.5 font-mono text-[10px] leading-tight font-bold text-slate-400 uppercase">
            {description}
        </p>
        <div className="border-gunmetal/10 mt-8 border-t-2 pt-6">
            <SeedControl type={type} />
        </div>
    </div>
);
