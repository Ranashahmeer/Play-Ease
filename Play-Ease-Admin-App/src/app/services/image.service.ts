import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ImageService {
    private readonly apiBaseUrl = 'http://localhost:5000';
    private readonly fallbackImage = 'assets/placeholder-court.png';

    constructor() { }

    /**
     * Converts a relative image path to a full URL
     * Handles both assets/ paths (served by Angular) and uploads/ paths (served by backend)
     */
    getImageUrl(imagePath: string | undefined | null): string {
        if (!imagePath || imagePath.trim() === '') {
            return this.fallbackImage;
        }

        const path = imagePath.trim();

        // If it's already a full URL, return as-is
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }

        // If it's an assets/ path, return as-is (Angular will serve it)
        if (path.startsWith('assets/')) {
            return path;
        }

        // If it's an uploads/ path, prepend the API base URL
        if (path.startsWith('uploads/')) {
            return `${this.apiBaseUrl}/${path}`;
        }

        // Default: assume it's a relative backend path
        return `${this.apiBaseUrl}/${path}`;
    }

    /**
     * Converts an array of image paths to full URLs
     */
    getImageUrls(imagePaths: string[] | undefined | null): string[] {
        if (!imagePaths || imagePaths.length === 0) {
            return [this.fallbackImage];
        }

        return imagePaths.map(path => this.getImageUrl(path));
    }

    /**
     * Gets the fallback image URL
     */
    getFallbackImage(): string {
        return this.fallbackImage;
    }
}
