// API Service for Reviews
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://3.12.102.106:3001/api';
// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';


export interface Review {
  id: number | string;
  name: string;
  email?: string;
  location?: string;
  rating: number;
  text: string;
  review_text?: string;
  property_type?: string;
  created_at: string;
  status?: string;
  is_verified?: boolean;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  fiveStarReviews: number;
  fourStarReviews: number;
  threeStarReviews: number;
  twoStarReviews: number;
  oneStarReviews: number;
}

export interface NewReview {
  name: string;
  email: string;
  location?: string;
  rating: number;
  review_text: string;
  property_type?: string;
}

// Fetch all approved reviews from database
export const fetchReviews = async (): Promise<Review[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch reviews');
    }
    
    const data = await response.json();
    
    // Normalize the data structure (handle both 'text' and 'review_text')
    return data.reviews?.map((review: any) => ({
      ...review,
      text: review.text || review.review_text || '',
      created_at: review.created_at || review.createdAt || new Date().toISOString()
    })) || [];
  } catch (error) {
    console.error('Error fetching reviews:', error);
    // Return empty array on error - don't use localStorage fallback
    // This ensures we only show reviews from the database
    return [];
  }
};

// Fetch review statistics from database
export const fetchReviewStats = async (): Promise<ReviewStats> => {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/stats`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch review stats');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching review stats:', error);
    // Return empty stats on error - don't use localStorage fallback
    // This ensures we only show stats from the database
    return {
      totalReviews: 0,
      averageRating: 0,
      fiveStarReviews: 0,
      fourStarReviews: 0,
      threeStarReviews: 0,
      twoStarReviews: 0,
      oneStarReviews: 0
    };
  }
};

// Submit a new review - stores directly in database
export const submitReview = async (reviewData: NewReview): Promise<{ success: boolean; message: string; review?: Review }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: reviewData.name,
        email: reviewData.email,
        location: reviewData.location || '',
        rating: reviewData.rating,
        review_text: reviewData.review_text,
        property_type: reviewData.property_type || ''
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to submit review' }));
      throw new Error(errorData.message || errorData.error || 'Failed to submit review');
    }
    
    const data = await response.json();
    
    // Review is now stored in database via API
    return {
      success: true,
      message: data.message || 'Review submitted successfully!',
      review: data.review
    };
  } catch (error) {
    console.error('Error submitting review:', error);
    
    // Throw error instead of falling back to localStorage
    throw error;
  }
};

// Note: localStorage helpers removed - all reviews are now stored in database only
// Reviews are fetched and stored directly via API calls to the backend

// Calculate stats from reviews array
export const calculateStats = (reviews: Review[]): ReviewStats => {
  if (reviews.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      fiveStarReviews: 0,
      fourStarReviews: 0,
      threeStarReviews: 0,
      twoStarReviews: 0,
      oneStarReviews: 0
    };
  }
  
  const totalReviews = reviews.length;
  const sumRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = sumRatings / totalReviews;
  
  const ratingCounts = reviews.reduce((counts, review) => {
    counts[review.rating as keyof typeof counts]++;
    return counts;
  }, {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0
  });
  
  return {
    totalReviews,
    averageRating: Math.round(averageRating * 10) / 10,
    fiveStarReviews: ratingCounts[5],
    fourStarReviews: ratingCounts[4],
    threeStarReviews: ratingCounts[3],
    twoStarReviews: ratingCounts[2],
    oneStarReviews: ratingCounts[1]
  };
};
