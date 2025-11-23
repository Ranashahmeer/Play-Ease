import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  DxButtonModule,
  DxFileUploaderModule,
  DxPopupModule,
  DxGalleryModule
} from 'devextreme-angular';
import { Subscription } from 'rxjs';
import { CourtService, CourtDto, PitchDto } from '../../services/courts/court.service';
import { GetDatabyDatasourceService } from '../../services/get-data/get-databy-datasource.service';
import { AlertService } from '../../services/alert.service';

type Court = {
  id?: string;
  name: string;
  location?: string;
  ownerName?: string;
  ownerCnic?: string;
  rating?: number;
  pitches: string[];
  price: number;
  pricePerPitch?: Record<string, number>;
  openingTime?: string;
  closingTime?: string;
  image?: string;
  images?: string[];
  offers?: string[];
  about?: string;
  bookedSlots?: Record<string, string[]>;
};

const STORAGE_KEY = 'playease_courts';

@Component({
  selector: 'app-add-court',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DxButtonModule, DxFileUploaderModule, DxPopupModule, DxGalleryModule],
  templateUrl: './add-court.component.html',
  styleUrl: './add-court.component.css'
})
export class AddCourtComponent {
  form!: FormGroup;
  subscriptions: Subscription[] = [];
  courts: Court[] = [];
  pitches: string[] = [];
  offers: string[] = [];
  images: string[] = [];
  mainImage: string = '';
  pricePerPitch: Record<string, number> = {};
  editingId: string | null = null;
  private originalRating?: number;
  submitted = false;
  popupVisible = false;
  selectedCourt: Court | null = null;
  isBrowser = false;
  
  ownerId?: number;
  userId?: number;
  isAdmin: boolean = false;

  constructor(
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) platformId: Object,
    private courtService: CourtService,
    private dataService: GetDatabyDatasourceService,
    private alertService: AlertService
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
        } else {
          // Get owner ID for non-admin users
          this.loadOwnerId();
        }
      } catch {}
    }

    this.form = this.fb.group({
      name: ['', Validators.required],
      location: ['', Validators.required],
      ownerID: [this.ownerId || 0, this.isAdmin ? Validators.required : []],
      ownerName: ['', this.isAdmin ? Validators.required : []],
      ownerCnic: ['', this.isAdmin ? [Validators.required, Validators.pattern(/^\d{5}-\d{7}-\d{1}$/)] : []],
      openingTime: [''],
      closingTime: [''],
      about: ['']
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

  private loadFromStorage(): Court[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Court[];
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (err) {
      return [];
    }
  }

  private saveToStorage(arr: Court[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      this.courts = arr;
    } catch (err) {
      // Failed to save data locally
    }
  }

  private generateId() {
    return `c${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }

  resetStoreToSample() {
    const todayKey = this.toKey(new Date());
    const seed: Court[] = [
      {
        id: this.generateId(),
        name: 'Sample Arena',
        location: 'Gulberg',
        ownerName: 'Ahmed Khan',
        ownerCnic: '42101-1234567-1',
        rating: 4.4,
        pitches: ['5x5', '7x7'],
        pricePerPitch: { '5x5': 2000, '7x7': 2500 },
        price: 2000,
        openingTime: '06:00 AM',
        closingTime: '10:00 PM',
        image: 'assets/alphaarena.jpg',
        images: ['assets/alphaarena-1.jpg','assets/alphaarena-2.jpg'],
        offers: ['Toilet', 'Parking'],
        about: 'Seed court data - replace with your own.',
        bookedSlots: { [this.toKey(new Date())]: ['06:00 AM'] }
      }
    ];
    this.saveToStorage(seed);
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

  startCreateNew() {
    this.editingId = null;
    this.originalRating = undefined;
    this.submitted = false;
    this.form.reset({
      name: '',
      location: '',
      ownerName: '',
      ownerCnic: '',
      openingTime: '',
      closingTime: '',
      about: ''
    });
    this.pitches = [];
    this.offers = [];
    this.images = [];
    this.mainImage = '';
    this.pricePerPitch = {};
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  editCourt(c: Court) {
    this.editingId = c.id ?? null;
    this.originalRating = c.rating;
    this.submitted = false;
    this.form.patchValue({
      name: c.name,
      location: c.location ?? '',
      ownerName: c.ownerName ?? '',
      ownerCnic: c.ownerCnic ?? '',
      openingTime: c.openingTime ?? '',
      closingTime: c.closingTime ?? '',
      about: c.about ?? ''
    });
    this.pitches = [...(c.pitches || [])];
    this.offers = [...(c.offers || [])];
    this.images = [...(c.images || (c.image ? [c.image] : []))];
    this.mainImage = c.image || (this.images[0] ?? '');
    this.pricePerPitch = { ...(c.pricePerPitch || {}) };
    for (const p of this.pitches) {
      if (!(p in this.pricePerPitch)) this.pricePerPitch[p] = NaN;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onEditClick(c: Court, ev: any) { 
    try { ev?.event?.stopPropagation?.(); } catch {} 
    this.editCourt(c); 
  }

  onDeleteClick(c: Court, ev: any) { 
    try { ev?.event?.stopPropagation?.(); } catch {} 
    this.deleteCourt(c); 
  }

  deleteCourt(c: Court) {
    if (!c.id) return;
    if (!confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
    const arr = this.loadFromStorage().filter(x => x.id !== c.id);
    this.saveToStorage(arr);
  }

  saveCourt() {
    this.submitted = true;
    const missing: string[] = [];
    
    if (!this.form.value.name || this.form.get('name')?.invalid) 
      missing.push('Court Name');
    if (!this.form.value.location || this.form.get('location')?.invalid) 
      missing.push('Location');
    
    const ownerID = this.form.value.ownerID || this.ownerId;
    if (!ownerID || ownerID <= 0) 
      missing.push('Owner ID');
    
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
      this.alertService.error('Please fill in all required fields:\n' + missing.join('\n'));
      return; 
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
      Images: this.images.length > 0 ? this.images : undefined
    };

    // Call backend API
    const apiCall = this.editingId 
      ? this.courtService.updateCourt(parseInt(this.editingId), courtDto)
      : this.courtService.createCourt(courtDto);

    apiCall.subscribe({
      next: (response: any) => {
        this.alertService.success(
          this.editingId 
            ? 'Court updated successfully!' 
            : 'Court created successfully!'
        );
        this.startCreateNew();
        // Optionally reload courts list if needed
      },
      error: (err: any) => {
        console.error('Error saving court:', err);
        this.alertService.error(
          err?.error?.error || 'Failed to save court. Please try again.'
        );
      }
    });
  }

  getPreviewImage(c: Court) { 
    return c.image || (c.images && c.images[0]) || 'assets/placeholder-court.png'; 
  }

  openCourtDetails(c: Court) { 
    this.selectedCourt = c; 
    this.popupVisible = true; 
  }

  closePopup() { 
    this.popupVisible = false; 
    this.selectedCourt = null; 
  }

  get galleryImages(): string[] {
    if (!this.selectedCourt) return [];
    if (this.selectedCourt.images && this.selectedCourt.images.length) 
      return this.selectedCourt.images;
    return this.selectedCourt.image ? [this.selectedCourt.image] : [];
  }

  getOfferIcon(offer: string): string {
    if (!offer) return '•';
    const key = offer.toLowerCase();
    if (key.includes('park')) return '🅿️';
    if (key.includes('toilet') || key.includes('wc') || key.includes('restroom')) return '🚻';
    if (key.includes('shower')) return '🚿';
    if (key.includes('light')) return '💡';
    if (key.includes('change') || key.includes('changing')) return '🧍‍♂️';
    if (key.includes('water')) return '💧';
    if (key.includes('cafe') || key.includes('food')) return '☕';
    return '⭐';
  }

  toKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
