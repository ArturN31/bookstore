interface GeneratedBook {
	title: string;
	author: string;
	genre: string;
	publisher: string;
	publication_date: string;
	price: string;
	description: string;
	format: string;
	page_count: number;
	image_url: string;
	stock_quantity: number;
	is_active: boolean;
}

interface Book {
	id: string;
	created_at: string;
	updated_at: string;
	title: string;
	author: string;
	genre: string;
	publisher: string;
	publication_date: string;
	price: string;
	description: string;
	format: string;
	page_count: number;
	image_url: string;
	stock_quantity: number;
	is_active: boolean;
	reviews: Review[];
}

interface GeneratedReview {
	book_id: string;
	user_id: string;
	review: string;
	rating: number;
}

interface Review {
	id: string;
	created_at: string;
	updated_at: string;
	book_id: string;
	user_id: string;
	review: string;
	rating: number;
}
