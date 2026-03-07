import Image from 'next/image';
import logo from '@/public/logo.jpg';
import { UserNavbar } from '@/components/layout/UserNavbar/UserNavbar';
import Link from 'next/link';
import { FilterBar } from '@/components/layout/FilterBar/FilterBar';

export const Header = () => {
    return (
        <nav data-testid="header">
            <div className="bg-gunmetal grid justify-center gap-8 select-none lg:flex lg:justify-between lg:gap-0">
                <div className="grid items-center gap-0 px-5 md:flex md:gap-5">
                    <Link
                        data-testid="header-logo"
                        aria-label="Books 4 You Home"
                        className="flex shrink-0 rounded-full hover:cursor-pointer"
                        href="/"
                    >
                        <Image
                            className="m-auto rounded-full"
                            src={logo}
                            width={150}
                            height={150}
                            alt="Books 4 You Logo"
                            priority
                            fetchPriority="high"
                            decoding="sync"
                        />
                    </Link>
                    <div className="text-center text-3xl text-white">
                        <p>Easy Reading,</p>
                        <p>Endless Possibilities.</p>
                    </div>
                </div>
                <div className="grid items-center px-8 pb-8 lg:pb-0">
                    <UserNavbar />
                </div>
            </div>
            <div className="bg-moonstone">
                <FilterBar />
            </div>
        </nav>
    );
};
