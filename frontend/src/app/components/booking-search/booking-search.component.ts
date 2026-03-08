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

  // All possible time slots from 11:00 to 22:00 in 30-min intervals
  private allTimeSlots: string[] = this.generateTimeSlots();

  today: string = new Date().toISOString().split('T')[0];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    const defaultTime = this.getDefaultTime();

    this.searchForm = this.fb.group({
      date: [this.today, Validators.required],
      startTime: [defaultTime, Validators.required],
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

    // When date changes, re-validate the time slot (may have become past)
    this.searchForm.get('date')!.valueChanges.subscribe(() => {
      this.adjustTimeSlotForDate();
    });
  }

  /** Returns available time slots for the currently selected date */
  get timeSlots(): string[] {
    const selectedDate = this.searchForm?.get('date')?.value;
    if (!selectedDate || selectedDate !== this.today) {
      return this.allTimeSlots;
    }
    // Today: only show slots that haven't started yet (give 5-min buffer)
    const now = new Date();
    const cutoffMinutes = now.getHours() * 60 + now.getMinutes() + 5;
    return this.allTimeSlots.filter(slot => {
      const [h, m] = slot.split(':').map(Number);
      return h * 60 + m >= cutoffMinutes;
    });
  }

  /** If the selected time is now in the past (date changed to today), reset to first valid slot */
  private adjustTimeSlotForDate(): void {
    const slots = this.timeSlots;
    const current = this.searchForm.get('startTime')?.value;
    if (slots.length === 0) return;
    if (!slots.includes(current)) {
      this.searchForm.get('startTime')!.setValue(slots[0]);
    }
  }

  /** Pick a sensible default time: next 30-min slot or 18:00 if in evening */
  private getDefaultTime(): string {
    const now = new Date();
    const totalMinutes = now.getHours() * 60 + now.getMinutes() + 35; // 35-min buffer
    const roundedMinutes = Math.ceil(totalMinutes / 30) * 30;
    const hour = Math.floor(roundedMinutes / 60);
    const minute = roundedMinutes % 60;
    const slotStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    // If slot is within valid range, use it; otherwise fall back to 18:00
    return this.allTimeSlots.includes(slotStr) ? slotStr : '18:00';
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

  /** Returns true if the selected date+time combo is in the past */
  get isInPast(): boolean {
    const date = this.searchForm?.get('date')?.value;
    const time = this.searchForm?.get('startTime')?.value;
    if (!date || !time) return false;
    if (date > this.today) return false;
    if (date < this.today) return true;
    // Same day — compare time
    const [h, m] = time.split(':').map(Number);
    const now = new Date();
    return h * 60 + m < now.getHours() * 60 + now.getMinutes();
  }

  onSubmit(): void {
    if (this.searchForm.valid && !this.isInPast) {
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

