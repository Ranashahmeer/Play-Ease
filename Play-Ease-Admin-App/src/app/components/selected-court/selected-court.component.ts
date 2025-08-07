import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-selected-court',
  templateUrl: './selected-court.component.html',
  styleUrls: ['./selected-court.component.css']
})
export class SelectedCourtComponent implements OnInit {
  courtName: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.courtName = this.route.snapshot.paramMap.get('name');
  }
}