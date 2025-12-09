import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiAssistantService, ChatMessage, CourtSummary } from '../../services/ai-assistant.service';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';

@Component({
    selector: 'app-ai-assistant',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ai-assistant.component.html',
    styleUrl: './ai-assistant.component.css'
})
export class AiAssistantComponent implements OnInit, OnDestroy, AfterViewChecked {
    @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

    isOpen = false;
    messages: ChatMessage[] = [];
    currentMessage = '';
    isTyping = false;
    suggestions: string[] = [];
    showSuggestions = true;
    private destroy$ = new Subject<void>();
    private shouldScrollToBottom = false;

    constructor(
        private aiService: AiAssistantService,
        private router: Router
    ) { }

    ngOnInit(): void {
        // Subscribe to messages
        this.aiService.messages$
            .pipe(takeUntil(this.destroy$))
            .subscribe(messages => {
                this.messages = messages;
                this.shouldScrollToBottom = true;
            });

        // Subscribe to typing indicator
        this.aiService.isTyping$
            .pipe(takeUntil(this.destroy$))
            .subscribe(isTyping => {
                this.isTyping = isTyping;
                if (isTyping) {
                    this.shouldScrollToBottom = true;
                }
            });

        // Load suggestions
        this.aiService.getSuggestions()
            .pipe(takeUntil(this.destroy$))
            .subscribe(response => {
                this.suggestions = response.suggestions;
            });
    }

    ngAfterViewChecked(): void {
        if (this.shouldScrollToBottom) {
            this.scrollToBottom();
            this.shouldScrollToBottom = false;
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    toggleChat(): void {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.shouldScrollToBottom = true;
        }
    }

    sendMessage(): void {
        const message = this.currentMessage.trim();
        if (!message) return;

        this.showSuggestions = false;
        this.currentMessage = '';

        this.aiService.sendMessage(message).subscribe({
            error: (err) => {
                console.error('Error sending message:', err);
                // Show error message
                const errorMessage: ChatMessage = {
                    id: Date.now().toString(),
                    message: "Sorry, I'm having trouble connecting. Please try again.",
                    sender: 'ai',
                    timestamp: new Date(),
                    type: 'general'
                };
                const messages = this.messages;
                this.messages = [...messages, errorMessage];
            }
        });
    }

    useSuggestion(suggestion: string): void {
        this.currentMessage = suggestion;
        this.sendMessage();
    }

    viewCourt(courtId: number): void {
        this.router.navigate(['/court-details', courtId]);
        this.isOpen = false;
    }

    clearChat(): void {
        this.aiService.clearChat();
        this.showSuggestions = true;
    }

    private scrollToBottom(): void {
        try {
            if (this.messagesContainer) {
                const container = this.messagesContainer.nativeElement;
                container.scrollTop = container.scrollHeight;
            }
        } catch (err) {
            console.error('Scroll error:', err);
        }
    }

    onKeyPress(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }
}
