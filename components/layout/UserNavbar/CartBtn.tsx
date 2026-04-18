'use client';

import { useState, useEffect } from 'react';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { CartSidebar } from '@/components/CartSidebar/CartSidebar';
import { useCartState } from '@/providers/cart/utils/useCart';
import { IconButton, Badge } from '@mui/material';

export const CartBtn = () => {
    const [openCart, setOpenCart] = useState(false);
    const { cartBooksAmount } = useCartState();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleCartVisibility = () => setOpenCart(!openCart);

    if (!isMounted)
        return (
            <div
                style={{ width: '48px', height: '48px' }}
                aria-hidden="true"
            />
        );

    const cartButtonLabel = `Shopping cart with ${cartBooksAmount} items`;

    return (
        <>
            <IconButton
                data-testid="cart-button"
                onClick={handleCartVisibility}
                aria-label={cartButtonLabel}
                sx={{
                    boxShadow: '0 4px 6px -1px black',
                    borderRadius: '50%',
                    width: '48px',
                    height: '48px',
                    display: 'grid',
                    placeItems: 'center',
                    backgroundColor: '#f7cb15',
                    cursor: 'pointer',
                    '&:hover': {
                        backgroundColor: '#f7cb1580',
                        border: '1px solid black',
                    },
                }}
            >
                <ShoppingCartOutlinedIcon aria-hidden="true" />
                <Badge
                    badgeContent={cartBooksAmount}
                    color="error"
                    sx={{
                        '& .MuiBadge-badge': {
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            padding: '0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#fb2c36',
                            top: '-27.5px',
                            right: '-20px',
                            fontSize: '0.75rem',
                        },
                    }}
                />
            </IconButton>
            <CartSidebar
                openCart={openCart}
                setOpenCart={setOpenCart}
            />
        </>
    );
};
