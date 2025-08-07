import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';  // Import LoginComponent
import { NavbarComponent } from './components/navbar-header/navbar.component';  // Import NavbarComponent
import { BookingsComponent } from './components/bookings/bookings.component';
import { NextBookingsComponent } from './components/next-bookings/next-bookings.component';

import { DxDateBoxModule, DxSelectBoxModule, DxTextBoxModule } from 'devextreme-angular';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,  // Declare LoginComponent here
    NavbarComponent, // Declare NavbarComponent here
    BookingsComponent, 
    NextBookingsComponent,
  ],
  imports: [
    BrowserModule,
    DxDateBoxModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    FormsModule,
    //ReactiveFormsModule,
    // any other modules you need
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
