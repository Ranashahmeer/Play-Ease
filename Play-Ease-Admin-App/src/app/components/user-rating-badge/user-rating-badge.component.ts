import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerRatingsService, PlayerRatingSummary } from '../../services/player-ratings/player-ratings.service';

@Component({
  selector: 'app-user-rating-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-rating-badge.component.html',
  styleUrl: './user-rating-badge.component.css'
})
export class UserRatingBadgeComponent implements OnInit, OnChanges {
  @Input() userId!: number;
  @Input() showLabel: boolean = false; // Show "Rating:" label
  @Input() size: 'small' | 'medium' | 'large' = 'medium'; // Size of the badge

  ratingSummary: PlayerRatingSummary | null = null;
  isLoading: boolean = false;

  // Expose Math for template
  Math = Math;

  constructor(private playerRatingsService: PlayerRatingsService) {}

  ngOnInit(): void {
    if (this.userId) {
      this.loadRating();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId'] && !changes['userId'].firstChange && this.userId) {
      this.loadRating();
    }
  }

  loadRating(): void {
    if (!this.userId || this.userId <= 0) return;

    this.isLoading = true;
    this.playerRatingsService.getUserRatingSummary(this.userId).subscribe({
      next: (summary) => {
        this.ratingSummary = summary;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading user rating:', err);
        this.ratingSummary = null;
        this.isLoading = false;
      }
    });
  }

  getStarRating(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i + 1);
  }

  hasRating(): boolean {
    return this.ratingSummary !== null && this.ratingSummary.totalRatings > 0;
  }
}

