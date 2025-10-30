import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; 
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';  // Import LoginComponent
import { NavbarComponent } from './components/navbar-header/navbar.component';  // Import NavbarComponent
import { BookingsComponent } from './components/bookings/bookings.component';
import { NextBookingsComponent } from './components/next-bookings/next-bookings.component';
import { PlayerRecruitmentComponent } from './components/player-recruitment/player-recruitment.component';
import { RequestModalComponent } from './components/player-recruitment/request-modal/request-modal.component';
import { AvailableRequestsComponent } from './components/player-recruitment/available-requests/available-requests.component';
import { MyRequestsComponent } from './components/player-recruitment/my-requests/my-requests.component';

import { DxButtonModule,DxPopupModule,DxDropDownBoxModule,DxListModule,DxFileUploaderModule, 
  DxDateBoxModule, DxSelectBoxModule, DxSliderModule, DxTagBoxModule, 
  DxTextBoxModule, DxGalleryModule } from 'devextreme-angular';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,  // Declare LoginComponent here
    NavbarComponent, // Declare NavbarComponent here
    BookingsComponent, 
    NextBookingsComponent,
    PlayerRecruitmentComponent,
    RequestModalComponent,
    AvailableRequestsComponent,
    MyRequestsComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    DxDateBoxModule,DxButtonModule,DxTagBoxModule,DxSliderModule,DxPopupModule,
    DxSelectBoxModule,DxGalleryModule,DxFileUploaderModule,DxDropDownBoxModule,
    DxTextBoxModule,DxListModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule  
    // any other modules you need
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
