import { faker } from '@faker-js/faker/locale/en_GB';

const generateReview = (bookId: string, userId: string) => {
	return {
		book_id: bookId,
		user_id: userId,
		review: faker.lorem.paragraph({ min: 5, max: 15 }),
		rating: Math.floor(Math.random() * 5) + 1,
	};
};

const testUserIds = [
	'6719fac7-fc59-411c-b20c-22ac6c7b622f', //Test User10
	'9a7642c4-8231-44e6-8062-db02643cc373', //Test User9
	'b7de927c-0080-4af6-94ac-1acbf4ffad03', //Test User8
	'3214fb78-41e5-44f2-b070-747c222332b4', //Test User7
	'e21ae8ae-c3a3-4e1c-aaba-37c6e293bc16', //Test User6
	'086d18e5-3370-40dc-83e4-e84a8f8f0eee', //Test User5
	'f12cd62f-e628-45b4-aff1-5030e5031611', //Test User4
	'44b791b0-4ba5-423b-aaed-38293b5c7ae9', //Test User3
	'3d947395-70c1-418f-b969-808c069c4214', //Test User2
	'f679c56a-f208-470e-8161-e7ffd62a4a32', //Test User
];

export const generateReviewsArray = (books: Book[]): GeneratedReview[] => {
	const reviews: GeneratedReview[] = [];

	books.forEach((book) => {
		//keeps track of users used for review
		const reviewedUsers = new Set<string>();

		//generate random rumber of reviews
		const numberOfReviews = Math.floor(Math.random() * 10) + 1;

		for (let i = 0; i < numberOfReviews; i++) {
			//selects a user for review that has not been used previously
			let selectedUser;
			do {
				selectedUser = testUserIds[Math.floor(Math.random() * testUserIds.length)];
			} while (reviewedUsers.has(selectedUser));

			const newReview = generateReview(book.id, selectedUser);
			reviews.push(newReview);
			reviewedUsers.add(selectedUser);
		}
	});

	return reviews;
};
