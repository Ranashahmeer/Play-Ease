import { Component, OnInit } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card'; // Import MatCardModule

import {FormControl} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RedirectCommand } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [
    // BrowserModule,
    CommonModule,
    // BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule, // Add this
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;

  constructor(private formBuilder: FormBuilder) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }
  
  ngOnInit(): void {
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      console.log('Login form submitted');
      
    } else {
      return;
    }
  }
}
