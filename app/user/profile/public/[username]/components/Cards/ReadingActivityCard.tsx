import { ProfileCardActionButton } from '../ProfileCard/ProfileCardActionButton';
import { ProfileCardContainer } from '../ProfileCard/ProfileCardContainer';
import { ProfileCardHeader } from '../ProfileCard/ProfileCardHeader';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined';

interface ReadingActivityCardProps {
    username: string;
}

export const ReadingActivityCard = ({ username }: ReadingActivityCardProps) => {
    return (
        <ProfileCardContainer colorTheme="blue">
            <ProfileCardHeader
                icon={<AutoStoriesOutlinedIcon fontSize="small" />}
                title="Reading Activity"
                subtitle="Public stats and reviews"
                iconContainerClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
            />
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
                Check out recent reviews, ratings, and literary milestones achieved by this reader.
            </p>
            <ProfileCardActionButton
                href={`/user/reviews/${username}`}
                icon={<BookmarkBorderOutlinedIcon fontSize="small" />}
            >
                View Reviews
            </ProfileCardActionButton>
            ;
        </ProfileCardContainer>
    );
};
