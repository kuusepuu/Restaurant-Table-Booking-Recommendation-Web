import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SearchCriteria, Zone } from '../../models/table.model';

@Component({
  selector: 'app-booking-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking-search.component.html',
  styleUrls: ['./booking-search.component.css']
})
export class BookingSearchComponent implements OnInit {
  @Output() search = new EventEmitter<SearchCriteria>();

  searchForm!: FormGroup;
  zones: Zone[] = ['MAIN_HALL', 'WINDOW', 'PRIVATE', 'PATIO'];

  // Generate time slots from 11:00 to 22:00 in 30-min intervals
  timeSlots: string[] = this.generateTimeSlots();

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];

    this.searchForm = this.fb.group({
      date: [today, Validators.required],
      startTime: ['18:00', Validators.required],
      durationMinutes: [120],
      groupSize: [2, [Validators.required, Validators.min(1), Validators.max(20)]],
      preferredZones: this.fb.group({
        MAIN_HALL: [false],
        WINDOW: [false],
        PRIVATE: [false],
        PATIO: [false]
      }),
      needsAccessible: [false]
    });
  }

  private generateTimeSlots(): string[] {
    const slots: string[] = [];
    for (let hour = 11; hour <= 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 22) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  }

  formatZone(zone: string): string {
    return zone.replace(/_/g, ' ');
  }

  onSubmit(): void {
    if (this.searchForm.valid) {
      const formValue = this.searchForm.value;

      // Convert checkbox group to array of selected zones
      const preferredZones = Object.entries(formValue.preferredZones as Record<string, boolean>)
        .filter(([, selected]) => selected)
        .map(([zone]) => zone as Zone);

      const criteria: SearchCriteria = {
        date: formValue.date,
        startTime: formValue.startTime,
        durationMinutes: Number(formValue.durationMinutes),
        groupSize: Number(formValue.groupSize),
        preferredZones,
        needsAccessible: formValue.needsAccessible
      };

      this.search.emit(criteria);
    }
  }
}

