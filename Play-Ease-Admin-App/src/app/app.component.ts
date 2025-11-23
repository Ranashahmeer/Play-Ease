import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UserService } from './services/user.service';
import { NavbarComponent } from './components/navbar-header/navbar.component';
import { NavbarFooterComponent } from './components/navbar-footer/navbar-footer.component';
import { AlertComponent } from './components/alert/alert.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, NavbarFooterComponent, AlertComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']  
})
export class AppComponent {
  title = 'Play-Ease-Admin-App';
}
