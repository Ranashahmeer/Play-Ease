import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.css']
})
export class ContactUsComponent {

  thankYouMessage: string = '';

  sendMessage(event: Event) {
    event.preventDefault(); // Prevent page reload

    const name = (document.getElementById('name') as HTMLInputElement).value;
    const email = (document.getElementById('email') as HTMLInputElement).value;
    const message = (document.getElementById('message') as HTMLTextAreaElement).value;

    if (!name || !email || !message) {
      this.thankYouMessage = 'Please fill in all fields before sending.';
      this.clearMessageAfterDelay();
      return;
    }

    // Save data locally
    const contactData = { name, email, message, date: new Date().toISOString() };
    const existingData = JSON.parse(localStorage.getItem('contactMessages') || '[]');
    existingData.push(contactData);
    localStorage.setItem('contactMessages', JSON.stringify(existingData));

    // Show thank you message
    this.thankYouMessage = 'Message has been sent! Thanks for your feedback.';

    // Reset form
    (document.querySelector('.contact-form') as HTMLFormElement).reset();

    this.clearMessageAfterDelay();
  }

  private clearMessageAfterDelay() {
    setTimeout(() => {
      this.thankYouMessage = '';
    }, 10000); // 10 seconds
  }
}
