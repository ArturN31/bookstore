import Card from '@mui/material/Card';
import { ReviewCardRating } from './ReviewCardRating';
import { ReviewCardBody } from './ReviewCardBody';

export interface SelectedReview {
    id: string | number;
    username: string;
    rating: number;
    review: string;
    created_at: string;
    updated_at: string;
}

export const ReviewCard = ({ review }: { review: SelectedReview }) => {
    const createdAt = new Date(review.created_at);
    const updatedAt = new Date(review.updated_at);
    const isUpdated = updatedAt.getTime() !== createdAt.getTime();

    return (
        <Card
            elevation={0}
            className="flex flex-col overflow-hidden rounded-xl! border border-[#E8E2D5]! bg-[#FAF7F2]! shadow-none! sm:flex-row"
        >
            <ReviewCardRating rating={review.rating} />

            <ReviewCardBody
                username={review.username}
                review={review.review}
                createdAt={createdAt}
                isUpdated={isUpdated}
            />
        </Card>
    );
};
