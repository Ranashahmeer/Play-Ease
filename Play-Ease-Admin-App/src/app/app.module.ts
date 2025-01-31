import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';  // Import LoginComponent
import { NavbarComponent } from './components/navbar-header/navbar.component';  // Import NavbarComponent

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,  // Declare LoginComponent here
    NavbarComponent,  // Declare NavbarComponent here
  ],
  imports: [
    BrowserModule,
    // any other modules you need
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
