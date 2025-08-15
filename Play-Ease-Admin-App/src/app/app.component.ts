import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar-header/navbar.component';
import { NavbarFooterComponent } from './components/navbar-footer/navbar-footer.component';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, NavbarComponent, NavbarFooterComponent
    ],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Play-Ease-Admin-App';
}
