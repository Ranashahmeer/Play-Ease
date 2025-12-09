import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ReviewsService, Review, RatingSummary } from '../../services/reviews/reviews.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-reviews-rating',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reviews-rating.component.html',
  styleUrl: './reviews-rating.component.css'
})
export class ReviewsRatingComponent implements OnInit, OnDestroy {
  @Input() courtId!: number;
  @Input() currentUserId: number = 0;
  @Input() showHeader: boolean = true;

  // Reviews and Ratings State
  reviews: Review[] = [];
  ratingSummary: RatingSummary | null = null;
  showAllReviews: boolean = false;
  isLoadingReviews: boolean = false;
  reviewForm: FormGroup;
  showReviewForm: boolean = false;
  userHasReviewed: boolean = false;
  userReview: Review | null = null;

  // Expose Math object for use in template
  Math = Math;

  constructor(
    private fb: FormBuilder,
    private reviewsService: ReviewsService,
    private alertService: AlertService,
    private router: Router
  ) {
    this.reviewForm = this.fb.group({
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      reviewText: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    if (this.courtId) {
      this.fetchReviewsAndRating();
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  fetchReviewsAndRating(): void {
    if (!this.courtId) return;
    
    this.isLoadingReviews = true;
    
    // Fetch rating summary
    this.reviewsService.getCourtRatingSummary(this.courtId).subscribe({
      next: (summary) => {
        this.ratingSummary = summary;
        this.isLoadingReviews = false;
      },
      error: (err) => {
        console.error('Error fetching rating summary:', err);
        this.isLoadingReviews = false;
      }
    });
    
    // Fetch top reviews
    this.reviewsService.getCourtReviews(this.courtId, 3, false).subscribe({
      next: (reviews) => {
        this.reviews = reviews;
        // Check if current user has reviewed
        this.userReview = reviews.find(r => r.userID === this.currentUserId) || null;
        this.userHasReviewed = !!this.userReview;
        if (this.userHasReviewed && this.userReview) {
          this.reviewForm.patchValue({
            rating: this.userReview.rating,
            reviewText: this.userReview.reviewText || ''
          });
        }
      },
      error: (err) => {
        console.error('Error fetching reviews:', err);
      }
    });
  }

  loadAllReviews(): void {
    if (!this.courtId) return;
    this.showAllReviews = true;
    this.reviewsService.getCourtReviews(this.courtId, 50, true).subscribe({
      next: (reviews) => {
        this.reviews = reviews;
      },
      error: (err) => {
        console.error('Error fetching all reviews:', err);
        this.alertService.error('Failed to load all reviews');
      }
    });
  }

  toggleReviewForm(): void {
    if (!this.currentUserId) {
      this.alertService.warning('Please login to write a review');
      this.router.navigate(['/login']);
      return;
    }
    this.showReviewForm = !this.showReviewForm;
    if (!this.showReviewForm && !this.userHasReviewed) {
      this.reviewForm.reset({ rating: 5, reviewText: '' });
    }
  }

  submitReview(): void {
    if (!this.currentUserId || !this.courtId) {
      this.alertService.warning('Please login to submit a review');
      return;
    }

    if (this.reviewForm.invalid) {
      this.alertService.error('Please provide a valid rating (1-5 stars)');
      return;
    }

    const reviewData = {
      courtID: this.courtId,
      userID: this.currentUserId,
      rating: this.reviewForm.value.rating,
      reviewText: this.reviewForm.value.reviewText?.trim() || null
    };

    this.reviewsService.createReview(reviewData).subscribe({
      next: (response) => {
        this.alertService.success(this.userHasReviewed ? 'Review updated successfully!' : 'Review submitted successfully!');
        this.showReviewForm = false;
        this.fetchReviewsAndRating();
      },
      error: (err) => {
        console.error('Error submitting review:', err);
        this.alertService.error(err.error?.error || 'Failed to submit review. Please try again.');
      }
    });
  }

  deleteReview(): void {
    if (!this.userReview || !this.currentUserId) return;
    
    if (!confirm('Are you sure you want to delete your review?')) return;

    this.reviewsService.deleteReview(this.userReview.reviewID, this.currentUserId).subscribe({
      next: () => {
        this.alertService.success('Review deleted successfully!');
        this.userReview = null;
        this.userHasReviewed = false;
        this.reviewForm.reset({ rating: 5, reviewText: '' });
        this.fetchReviewsAndRating();
      },
      error: (err) => {
        console.error('Error deleting review:', err);
        this.alertService.error(err.error?.error || 'Failed to delete review. Please try again.');
      }
    });
  }

  getStarRating(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i + 1);
  }

  getRatingPercentage(rating: number): number {
    if (!this.ratingSummary || this.ratingSummary.totalReviews === 0) return 0;
    const count = this.ratingSummary.ratingDistribution[rating] || 0;
    return (count / this.ratingSummary.totalReviews) * 100;
  }
}

