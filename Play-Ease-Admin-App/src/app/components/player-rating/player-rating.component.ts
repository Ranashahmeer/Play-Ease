import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PlayerRatingsService, MatchPlayer, CreatePlayerRating } from '../../services/player-ratings/player-ratings.service';
import { AlertService } from '../../services/alert.service';
import { UserRatingBadgeComponent } from '../user-rating-badge/user-rating-badge.component';

@Component({
  selector: 'app-player-rating',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UserRatingBadgeComponent],
  templateUrl: './player-rating.component.html',
  styleUrl: './player-rating.component.css'
})
export class PlayerRatingComponent implements OnInit {
  @Input() matchId!: number;
  @Input() currentUserId!: number;
  @Output() ratingSubmitted = new EventEmitter<void>();

  players: MatchPlayer[] = [];
  isLoadingPlayers: boolean = false;
  ratingForms: Map<number, FormGroup> = new Map();
  showRatingForm: Map<number, boolean> = new Map();

  constructor(
    private fb: FormBuilder,
    private playerRatingsService: PlayerRatingsService,
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.matchId && this.currentUserId) {
      this.loadPlayers();
    }
  }

  loadPlayers(): void {
    this.isLoadingPlayers = true;
    this.playerRatingsService.getMatchPlayers(this.matchId, this.currentUserId).subscribe({
      next: (players) => {
        this.players = players;
        // Initialize forms for each player
        players.forEach(player => {
          if (player.canRate) {
            const form = this.fb.group({
              rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
              reviewText: ['', [Validators.maxLength(500)]]
            });
            this.ratingForms.set(player.userID, form);
            this.showRatingForm.set(player.userID, false);
          }
        });
        this.isLoadingPlayers = false;
      },
      error: (err) => {
        console.error('Error loading players:', err);
        this.alertService.error('Failed to load players');
        this.isLoadingPlayers = false;
      }
    });
  }

  toggleRatingForm(playerId: number): void {
    if (!this.currentUserId) {
      this.alertService.warning('Please login to rate players');
      this.router.navigate(['/login']);
      return;
    }
    const currentValue = this.showRatingForm.get(playerId) || false;
    this.showRatingForm.set(playerId, !currentValue);
  }

  submitRating(player: MatchPlayer): void {
    if (!this.currentUserId || !this.matchId) {
      this.alertService.warning('Please login to submit a rating');
      return;
    }

    const form = this.ratingForms.get(player.userID);
    if (!form || form.invalid) {
      this.alertService.error('Please provide a valid rating (1-5 stars)');
      return;
    }

    const ratingData: CreatePlayerRating = {
      matchID: this.matchId,
      ratedByUserID: this.currentUserId,
      ratedUserID: player.userID,
      rating: form.value.rating,
      reviewText: form.value.reviewText?.trim() || null
    };

    this.playerRatingsService.createPlayerRating(ratingData).subscribe({
      next: (response) => {
        this.alertService.success(player.alreadyRated ? 'Rating updated successfully!' : 'Rating submitted successfully!');
        this.showRatingForm.set(player.userID, false);
        this.loadPlayers(); // Reload to update alreadyRated status
        this.ratingSubmitted.emit();
      },
      error: (err) => {
        console.error('Error submitting rating:', err);
        this.alertService.error(err.error?.error || 'Failed to submit rating. Please try again.');
      }
    });
  }

  getStarRating(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i + 1);
  }

  getForm(playerId: number): FormGroup | undefined {
    return this.ratingForms.get(playerId);
  }

  isFormVisible(playerId: number): boolean {
    return this.showRatingForm.get(playerId) || false;
  }
}

