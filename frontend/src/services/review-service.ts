import { api } from '../lib/api';

export interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
}

export interface Review {
    id: number;
    order_id: number;
    customer_id: number;
    restaurant_id: number;
    rating: number;
    comment: string;
    created_at: string;
    customer?: User;
}

export interface RiderReview {
    id: number;
    order_id: number;
    rider_id: number;
    rating: number;
    comment: string;
    created_at: string;
    customer?: User;
}

export interface CreateReviewRequest {
    order_id: number;
    rating: number;
    comment: string;
}

export const reviewService = {
    async createReview(req: CreateReviewRequest): Promise<{ message: string; data: Review }> {
        const response = await api.post('/reviews', req);
        return response.data;
    },

    async getReviewsByRestaurant(restaurantId: number): Promise<{ data: Review[] }> {
        const response = await api.get(`/reviews/restaurant/${restaurantId}`);
        return response.data;
    },

    async createRiderReview(req: CreateReviewRequest): Promise<{ message: string; data: RiderReview }> {
        const response = await api.post('/reviews/rider', req);
        return response.data;
    },

    async getRiderReviewByOrder(orderId: number): Promise<{ data: RiderReview | null }> {
        try {
            const response = await api.get(`/reviews/rider/order/${orderId}`);
            return response.data;
        } catch (err) {
            return { data: null };
        }
    },

    async getRestaurantReviewByOrder(_orderId: number): Promise<{ data: Review | null }> {
        return { data: null };
    },

    async getRiderReviews(riderId: number): Promise<{ data: RiderReview[] }> {
        const response = await api.get(`/reviews/rider/user/${riderId}`);
        return response.data;
    },

    async getRiderStats() {
        const response = await api.get<{ data: any[] }>("/reviews/riders");
        return response.data.data || [];
    }
};
