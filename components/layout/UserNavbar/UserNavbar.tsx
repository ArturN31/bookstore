import { SearchBar } from '@/components/layout/UserNavbar/SearchBar/SearchBar';
import { UserBtn } from '@/components/layout/UserNavbar/UserBtn';
import { CartBtn } from '@/components/layout/UserNavbar/CartBtn';

export const UserNavbar = () => {
    return (
        <div className="grid grid-cols-1 gap-3 sm:auto-cols-auto sm:grid-flow-col">
            <SearchBar />
            <div className="flex justify-center gap-3">
                <CartBtn />
                <UserBtn />
            </div>
        </div>
    );
};
