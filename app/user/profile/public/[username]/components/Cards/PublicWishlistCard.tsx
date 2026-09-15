import { ProfileCardContainer } from '../ProfileCard/ProfileCardContainer';
import { ProfileCardHeader } from '../ProfileCard/ProfileCardHeader';
import { ProfileCardActionButton } from '../ProfileCard/ProfileCardActionButton';
import CardGiftcardOutlinedIcon from '@mui/icons-material/CardGiftcardOutlined';
import { PrivacyStatusBadge } from '../PrivacyStatusBadge';

interface PublicWishlistCardProps {
    username: string;
    isPublic?: boolean;
}

export const PublicWishlistCard = ({ username, isPublic = true }: PublicWishlistCardProps) => {
    return (
        <ProfileCardContainer colorTheme="amber">
            <div className="flex items-start justify-between gap-2">
                <ProfileCardHeader
                    icon={<CardGiftcardOutlinedIcon fontSize="small" />}
                    title={isPublic ? 'Public Wishlist' : 'Wishlist'}
                    subtitle="Book recommendations & saved items"
                    iconContainerClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
                />
                <PrivacyStatusBadge isPublic={isPublic} />
            </div>
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
                Explore books and reading lists that @{username} has chosen to share with the
                community.
            </p>
            <ProfileCardActionButton
                href={`/user/wishlist/${username}`}
                icon={<CardGiftcardOutlinedIcon fontSize="small" />}
            >
                View Wishlist
            </ProfileCardActionButton>
        </ProfileCardContainer>
    );
};
