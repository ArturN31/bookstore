import { ProfileCardContainer } from '../ProfileCard/ProfileCardContainer';
import { ProfileCardHeader } from '../ProfileCard/ProfileCardHeader';
import { ProfileCardActionButton } from '../ProfileCard/ProfileCardActionButton';
import CardGiftcardOutlinedIcon from '@mui/icons-material/CardGiftcardOutlined';

interface PublicWishlistCardProps {
    username: string;
}

export function PublicWishlistCard({ username }: PublicWishlistCardProps) {
    return (
        <ProfileCardContainer colorTheme="amber">
            <ProfileCardHeader
                icon={<CardGiftcardOutlinedIcon fontSize="small" />}
                title="Public Wishlist"
                subtitle="Book recommendations & saved items"
                iconContainerClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            />
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
                Explore books and reading lists that @{username} has chosen to share with the
                community.
            </p>
            <ProfileCardActionButton
                href={`/user/wishlist/shared/${username}`}
                icon={<CardGiftcardOutlinedIcon fontSize="small" />}
            >
                View Wishlist
            </ProfileCardActionButton>
        </ProfileCardContainer>
    );
}
