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

interface User {
	id: string;
	created_at: Date;
	updated_at: Date;
	first_name: string;
	second_name: string;
	date_of_birth: Date;
	street_address: string;
	postcode: string;
	city: string;
	country: string;
	phone_number: string;
	[key: string]: string | Date;
}
