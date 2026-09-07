import { ProfileCardContainer } from '../ProfileCard/ProfileCardContainer';
import { ProfileCardHeader } from '../ProfileCard/ProfileCardHeader';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined';

export function ReadingActivityCard() {
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
            <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 dark:text-slate-500">
                <BookmarkBorderOutlinedIcon fontSize="small" />
                Coming Soon
            </div>
        </ProfileCardContainer>
    );
}
