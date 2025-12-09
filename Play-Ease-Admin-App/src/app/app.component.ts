import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UserService } from './services/user.service';
import { NavbarComponent } from './components/navbar-header/navbar.component';
import { NavbarFooterComponent } from './components/navbar-footer/navbar-footer.component';
import { AlertComponent } from './components/alert/alert.component';
import { AiAssistantComponent } from './components/ai-assistant/ai-assistant.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, NavbarFooterComponent, AlertComponent, AiAssistantComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Play-Ease-Admin-App';
}
