'use client';

import Image from 'next/image';
import logo from '@/public/logo.jpg';
import { UserNavbar } from '@/components/layout/UserNavbar/UserNavbar';
import Link from 'next/link';
import { FilterBar } from '@/components/layout/FilterBar/FilterBar';
import { useEffect, useState } from 'react';

export const Header = () => {
    const [isVisible, setIsVisible] = useState<boolean>(true);
    const [lastScrollY, setLastScrollY] = useState<number>(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY <= 50) {
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
                // Scrolling down past threshold -> hide header
                setIsVisible(false);
            } else if (currentScrollY < lastScrollY) {
                // Scrolling up -> show header immediately
                setIsVisible(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [lastScrollY]);

    return (
        <header
            className={`fixed top-0 right-0 left-0 z-45 transition-transform duration-300 ease-in-out ${
                isVisible ? 'translate-y-0' : '-translate-y-full'
            }`}
        >
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
        </header>
    );
};
