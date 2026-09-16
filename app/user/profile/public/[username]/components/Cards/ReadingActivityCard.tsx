import { PrivacyStatusBadge } from '../PrivacyStatusBadge';
import { ProfileCardActionButton } from '../ProfileCard/ProfileCardActionButton';
import { ProfileCardContainer } from '../ProfileCard/ProfileCardContainer';
import { ProfileCardHeader } from '../ProfileCard/ProfileCardHeader';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined';

interface ReadingActivityCardProps {
    username: string;
    isPublic?: boolean;
}

export const ReadingActivityCard = ({ username, isPublic = true }: ReadingActivityCardProps) => {
    return (
        <ProfileCardContainer colorTheme="blue">
            <div className="flex items-start justify-between gap-2">
                <ProfileCardHeader
                    icon={<AutoStoriesOutlinedIcon fontSize="small" />}
                    title="Reading Activity"
                    subtitle={isPublic ? 'Public stats and reviews' : 'Private stats and reviews'}
                    colorTheme="blue"
                />
                <PrivacyStatusBadge isPublic={isPublic} />
            </div>
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
                Check out recent reviews, ratings, and literary milestones achieved by this reader.
            </p>
            <ProfileCardActionButton
                href={`/user/reviews/${username}`}
                icon={<BookmarkBorderOutlinedIcon fontSize="small" />}
                colorTheme="blue"
            >
                View Reviews
            </ProfileCardActionButton>
        </ProfileCardContainer>
    );
};
