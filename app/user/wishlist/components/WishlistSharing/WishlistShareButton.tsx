'use client';

import ShareIcon from '@mui/icons-material/Share';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { useWishlistSharing } from './hook/useWishlistSharing';
import { VisibilityToggle } from './VisibilityToggle';
import { ShareLinkDisplay } from './ShareLinkDisplay';
import { EmptyShareState } from './EmptyShareState';

export const WishlistShareButton = () => {
    const {
        username,
        open,
        setOpen,
        isPublic,
        shareToken,
        isPending,
        copied,
        activeShareUrl,
        handleTogglePublic,
        handleGenerateOrResetToken,
        handleCopyShareLink,
    } = useWishlistSharing();

    if (!username) return null;

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-transparent px-4 py-2 text-xs font-bold tracking-wider text-stone-800 uppercase transition-all duration-200 hover:border-stone-900 hover:bg-stone-900 hover:text-white sm:w-auto"
            >
                <ShareIcon className="h-3.5 w-3.5" />
                <span>Share Options</span>
            </button>

            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                aria-labelledby="wishlist-sharing-title"
                fullWidth
                maxWidth="sm"
                sx={{
                    '& .MuiBackdrop-root': {
                        backgroundColor: 'rgba(15, 23, 42, 0.6)',
                        backdropFilter: 'blur(4px)',
                    },
                    '& .MuiDialog-paper': {
                        borderRadius: '1.25rem',
                        margin: '1rem',
                        width: 'calc(100% - 2rem)',
                        maxWidth: '36rem',
                        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
                    },
                }}
            >
                <DialogTitle
                    id="wishlist-sharing-title"
                    className="px-6 pt-6 pb-2 font-serif text-xl font-bold tracking-tight text-slate-900"
                >
                    Wishlist Sharing Settings
                </DialogTitle>
                <DialogContent className="space-y-6 px-6 py-4">
                    <VisibilityToggle
                        isPublic={isPublic}
                        isPending={isPending}
                        onToggle={handleTogglePublic}
                    />

                    {(isPublic || shareToken) && (
                        <ShareLinkDisplay
                            isPublic={isPublic}
                            activeShareUrl={activeShareUrl}
                            isPending={isPending}
                            copied={copied}
                            onCopy={handleCopyShareLink}
                            onReset={handleGenerateOrResetToken}
                        />
                    )}

                    {!isPublic && !shareToken && (
                        <EmptyShareState
                            isPending={isPending}
                            onGenerate={handleGenerateOrResetToken}
                        />
                    )}
                </DialogContent>
                <DialogActions className="px-6 pt-2 pb-6">
                    <Button
                        onClick={() => setOpen(false)}
                        className="rounded-xl px-5 py-2 text-xs font-bold tracking-wider text-slate-600 normal-case transition-colors hover:bg-slate-100"
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
