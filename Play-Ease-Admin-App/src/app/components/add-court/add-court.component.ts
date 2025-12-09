import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';

import {
  DxButtonModule,
  DxFileUploaderModule
} from 'devextreme-angular';
import { Subscription } from 'rxjs';
import { CourtService, CourtDto, PitchDto } from '../../services/courts/court.service';
import { GetDatabyDatasourceService } from '../../services/get-data/get-databy-datasource.service';
import { AlertService } from '../../services/alert.service';
import { OwnerService, Owner } from '../../services/owner.service';
import { HttpClient } from '@angular/common/http';
import { PaymentMethodService, PaymentMethod, OwnerPaymentMethod } from '../../services/payment-method.service';

@Component({
  selector: 'app-add-court',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DxButtonModule, DxFileUploaderModule, FormsModule],
  templateUrl: './add-court.component.html',
  styleUrl: './add-court.component.css'
})
export class AddCourtComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  subscriptions: Subscription[] = [];
  pitches: string[] = [];
  offers: string[] = [];
  images: string[] = [];
  mainImage: string = '';
  pricePerPitch: Record<string, number> = {};
  editingId: string | null = null;
  private originalRating?: number;
  submitted = false;
  isBrowser = false;
  owners: Owner[] = [];
  ownerId?: number;
  userId?: number;
  isAdmin: boolean = false;
  uploadedDocuments: File[] = [];
  documentPreviews: { name: string; size: number }[] = [];

  // Payment method properties
  availablePaymentMethods: PaymentMethod[] = [];
  ownerPaymentMethods: OwnerPaymentMethod[] = [];
  isLoadingPaymentMethods = false;

  constructor(
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) platformId: Object,
    private courtService: CourtService,
    private dataService: GetDatabyDatasourceService,
    private alertService: AlertService,
    private ownerService: OwnerService,
    private http: HttpClient,
    private paymentMethodService: PaymentMethodService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Get logged in user info
    const saved = localStorage.getItem('loggedInUser');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        this.userId = user.userID;
        // Check if admin
        if (user.roleID === 1) {
          this.isAdmin = true;
          // Load owners for admin
          this.loadOwners();
        } else {
          // Get owner ID for non-admin users
          this.loadOwnerId();
        }
      } catch { }
    }

    // Load available payment methods
    this.loadPaymentMethods();

    this.form = this.fb.group({
      name: ['', Validators.required],
      location: ['', Validators.required],
      ownerId: [null, this.isAdmin ? Validators.required : []],
      openingTime: [''],
      closingTime: [''],
      about: ['']
    });
  }

  loadOwners(): void {
    this.ownerService.getOwners().subscribe({
      next: (owners) => {
        this.owners = owners;
      },
      error: (err) => {
        console.error('Error loading owners:', err);
        this.alertService.error('Failed to load court owners');
      }
    });
  }

  loadOwnerId(): void {
    if (!this.userId) return;
    const whereclause = `co.userid = ${this.userId}`;
    this.dataService.getData(5, whereclause).subscribe({
      next: (apiData: any[] | null | undefined) => {
        const ownerData = Array.isArray(apiData) ? apiData : [];
        if (ownerData.length > 0) {
          this.ownerId = ownerData[0].ownerid || ownerData[0].OwnerID;
          this.form.patchValue({ ownerID: this.ownerId });
        }
      },
      error: (err: any) => {
        console.error('Error loading owner data:', err);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  addPitch(inputEl: HTMLInputElement) {
    const val = (inputEl.value || '').trim();
    if (!val) return;
    if (!this.pitches.includes(val)) {
      this.pitches.push(val);
      this.pricePerPitch[val] = NaN;
    }
    inputEl.value = '';
  }

  removePitch(p: string) {
    this.pitches = this.pitches.filter(x => x !== p);
    delete this.pricePerPitch[p];
  }

  setPitchPrice(pitch: string, raw: string | number) {
    const str = typeof raw === 'number' ? String(raw) : String(raw);
    const cleaned = str.replace(/[^\d.]/g, '');
    const v = cleaned === '' ? NaN : Number(cleaned);
    if (Number.isFinite(v) && v >= 0) {
      this.pricePerPitch[pitch] = Math.round(v);
    } else {
      this.pricePerPitch[pitch] = NaN;
    }
  }

  formattedPrice(pitch: string): string {
    const v = this.pricePerPitch[pitch];
    if (!Number.isFinite(v)) return '';
    try { return `Rs ${v.toLocaleString('en-PK')}`; } catch { return `Rs ${v}`; }
  }

  anyInvalidPitchPrice(): boolean {
    if (!this.pitches || this.pitches.length === 0) return false;
    for (const p of this.pitches) {
      const v = this.pricePerPitch[p];
      if (!Number.isFinite(v) || Number.isNaN(v)) return true;
    }
    return false;
  }

  isFiniteValue(v: any): boolean { return Number.isFinite(v); }

  addOffer(inputEl: HTMLInputElement) {
    const val = (inputEl.value || '').trim();
    if (!val) return;
    if (!this.offers.includes(val)) this.offers.push(val);
    inputEl.value = '';
  }

  removeOffer(o: string) { this.offers = this.offers.filter(x => x !== o); }

  onImagesUpload(e: any) {
    const files: File[] = e?.value || [];
    if (!files || files.length === 0) return;
    const maxFiles = Math.min(files.length, 6);
    for (let i = 0; i < maxFiles; i++) {
      const f = files[i];
      const reader = new FileReader();
      reader.onload = (ev: any) => {
        this.images.push(ev.target.result as string);
        if (!this.mainImage) this.mainImage = this.images[0];
      };
      reader.readAsDataURL(f);
    }
  }

  setAsMain(img: string) { this.mainImage = img; }

  // Document handling methods
  onDocumentsSelected(event: any): void {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.alertService.error(`File ${file.name} exceeds 5MB limit`);
        continue;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        this.alertService.error(`File ${file.name} has invalid type. Only PDF, JPG, and PNG are allowed.`);
        continue;
      }

      this.uploadedDocuments.push(file);
      this.documentPreviews.push({
        name: file.name,
        size: file.size
      });
    }
  }

  removeDocument(index: number): void {
    this.uploadedDocuments.splice(index, 1);
    this.documentPreviews.splice(index, 1);
  }

  async uploadDocuments(): Promise<string[]> {
    if (this.uploadedDocuments.length === 0) {
      return [];
    }

    const formData = new FormData();
    this.uploadedDocuments.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response: any = await this.http.post('http://localhost:5000/api/DocumentUpload/upload', formData).toPromise();
      return response.fileUrls || [];
    } catch (error) {
      console.error('Error uploading documents:', error);
      this.alertService.error('Failed to upload documents');
      return [];
    }
  }

  startCreateNew() {
    this.editingId = null;
    this.originalRating = undefined;
    this.submitted = false;
    this.form.reset({
      name: '',
      location: '',
      ownerId: null,
      openingTime: '',
      closingTime: '',
      about: ''
    });
    this.pitches = [];
    this.offers = [];
    this.images = [];
    this.mainImage = '';
    this.pricePerPitch = {};
    if (this.isBrowser) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }


  async saveCourt() {
    this.submitted = true;
    const missing: string[] = [];

    if (!this.form.value.name || this.form.get('name')?.invalid)
      missing.push('Court Name');
    if (!this.form.value.location || this.form.get('location')?.invalid)
      missing.push('Location');

    // Get owner ID from form (for admin) or from loaded owner data (for owner users)
    const ownerID = this.isAdmin ? this.form.value.ownerId : this.ownerId;
    if (!ownerID || ownerID <= 0)
      missing.push('Owner selection');

    if (!this.pitches || this.pitches.length === 0)
      missing.push('At least one pitch (add via "Add pitch")');
    else {
      for (const p of this.pitches) {
        const v = this.pricePerPitch[p];
        if (!Number.isFinite(v) || Number.isNaN(v))
          missing.push(`Price for pitch "${p}"`);
      }
    }

    if (missing.length > 0) {
      this.alertService.error('Please fill in all required fields:\\n' + missing.join('\\n'));
      return;
    }

    // Upload documents first
    let documentUrls: string[] = [];
    if (this.uploadedDocuments.length > 0) {
      documentUrls = await this.uploadDocuments();
      if (documentUrls.length === 0 && this.uploadedDocuments.length > 0) {
        this.alertService.error('Failed to upload documents. Please try again.');
        return;
      }
    }

    // Build pitches array
    const pitches: PitchDto[] = this.pitches.map(p => ({
      PitchType: p,
      Price: this.pricePerPitch[p]
    }));

    // Prepare court DTO
    const courtDto: CourtDto = {
      CourtID: this.editingId ? parseInt(this.editingId) : undefined,
      Name: this.form.value.name,
      Location: this.form.value.location,
      Rating: this.editingId ? this.originalRating : undefined,
      OpeningTime: this.form.value.openingTime || undefined,
      ClosingTime: this.form.value.closingTime || undefined,
      About: this.form.value.about || undefined,
      MainImage: this.mainImage || (this.images[0] ?? undefined),
      OwnerID: ownerID,
      Pitches: pitches,
      Images: this.images.length > 0 ? this.images : undefined,
      Documents: documentUrls.length > 0 ? documentUrls : undefined,
      Offers: this.offers.length > 0 ? this.offers : undefined
    };

    // Call backend API
    const apiCall = this.editingId
      ? this.courtService.updateCourt(parseInt(this.editingId), courtDto)
      : this.courtService.createCourt(courtDto);


    apiCall.subscribe({
      next: async (response: any) => {
        // Save payment methods for new courts (not updates) if any were added
        if (!this.editingId && ownerID && this.ownerPaymentMethods.length > 0) {
          this.ownerId = ownerID; // Ensure ownerId is set
          const paymentsSaved = await this.savePaymentMethods();

          if (paymentsSaved) {
            this.alertService.success('Court and payment methods saved successfully!');
          } else {
            this.alertService.warning('Court created but payment methods failed to save. Please add them later from My Account.');
          }
        } else {
          this.alertService.success(
            this.editingId
              ? 'Court updated successfully!'
              : 'Court created successfully!'
          );
        }

        this.startCreateNew();
        // Clear documents and payment methods
        this.uploadedDocuments = [];
        this.documentPreviews = [];
        this.ownerPaymentMethods = [];
      },
      error: (err: any) => {
        console.error('Error saving court:', err);
        this.alertService.error(
          err?.error?.error || 'Failed to save court. Please try again.'
        );
      }
    });
  }

  // ===== Payment Method Functions =====

  loadPaymentMethods(): void {
    this.paymentMethodService.getPaymentMethods().subscribe({
      next: (methods) => {
        this.availablePaymentMethods = methods;
      },
      error: (err) => {
        console.error('Error loading payment methods:', err);
        this.alertService.error('Failed to load payment methods');
      }
    });
  }

  addPaymentMethod(): void {
    const newPayment: OwnerPaymentMethod = {
      ownerID: this.ownerId || 0,
      methodID: 0,
      accountTitle: '',
      accountNumber: '',
      bankName: ''
    };
    this.ownerPaymentMethods.push(newPayment);
  }

  removePaymentMethod(index: number): void {
    this.ownerPaymentMethods.splice(index, 1);
  }

  validatePaymentMethods(): boolean {
    if (this.ownerPaymentMethods.length === 0) {
      this.alertService.error('Please add at least one payment method');
      return false;
    }

    for (let i = 0; i < this.ownerPaymentMethods.length; i++) {
      const payment = this.ownerPaymentMethods[i];

      if (!payment.methodID || payment.methodID === 0) {
        this.alertService.error(`Please select payment type for payment method #${i + 1}`);
        return false;
      }

      if (!payment.accountTitle || payment.accountTitle.trim().length < 3) {
        this.alertService.error(`Please enter valid account title for payment method #${i + 1} (minimum 3 characters)`);
        return false;
      }

      if (!payment.accountNumber || payment.accountNumber.trim().length < 5) {
        this.alertService.error(`Please enter valid account number for payment method #${i + 1} (minimum 5 characters)`);
        return false;
      }

      // Validate Bank Name for Bank Transfer (MethodID = 3)
      if (payment.methodID === 3 && (!payment.bankName || payment.bankName.trim().length === 0)) {
        this.alertService.error(`Please enter bank name for payment method #${i + 1}`);
        return false;
      }
    }

    return true;
  }

  async savePaymentMethods(): Promise<boolean> {
    if (!this.ownerId) {
      this.alertService.error('Owner ID is required to save payment methods');
      return false;
    }

    if (!this.validatePaymentMethods()) {
      return false;
    }

    const payments = this.ownerPaymentMethods.map(p => ({
      ownerID: this.ownerId!,
      methodID: p.methodID,
      accountTitle: p.accountTitle.trim(),
      accountNumber: p.accountNumber.trim(),
      bankName: p.methodID === 3 ? p.bankName?.trim() : undefined
    }));

    try {
      await this.paymentMethodService.createOwnerPaymentsBulk(payments).toPromise();
      return true;
    } catch (error) {
      console.error('Error saving payment methods:', error);
      this.alertService.error('Failed to save payment methods');
      return false;
    }
  }

  getPaymentMethodName(methodID: number): string {
    const method = this.availablePaymentMethods.find(m => m.methodID === methodID);
    return method ? method.methodName : '';
  }
}
