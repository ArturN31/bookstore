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
	rating?: number | null;
	wishlisted: boolean;
	addedToCart: boolean;
	[key: string]: any;
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
	username: string;
}

interface PaginatedReviewsResult {
	data: Review[] | null;
	total: number | null;
	totalPages: number | null;
	currentPage: number;
}

interface User {
	id: string;
	created_at: Date;
	updated_at: Date;
	first_name: string;
	last_name: string;
	date_of_birth: string;
	street_address: string;
	postcode: string;
	city: string;
	country: string;
	phone_number: string;
	username: string;
	[key: string]: string | Date;
}

interface Wishlist {
	id: string;
	created_at: Date;
	user_id: string;
	book_id: string;
}
