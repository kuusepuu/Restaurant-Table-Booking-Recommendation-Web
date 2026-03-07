import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RestaurantTable, TableRecommendation } from '../../models/table.model';
import { BookingRequest } from '../../models/booking.model';

@Component({
  selector: 'app-table-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './table-detail.component.html',
  styleUrls: ['./table-detail.component.css']
})
export class TableDetailComponent {
  @Input() table: RestaurantTable | null = null;
  @Input() recommendation: TableRecommendation | null = null;
  @Input() selectedDate: string = '';
  @Input() selectedTime: string = '';
  @Input() durationMinutes: number = 120;
  @Input() groupSize: number = 2;

  @Output() bookTable = new EventEmitter<BookingRequest>();
  @Output() close = new EventEmitter<void>();

  bookingForm: FormGroup;
  showBookingForm = false;

  constructor(private fb: FormBuilder) {
    this.bookingForm = this.fb.group({
      customerName: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  formatZone(zone: string): string {
    return zone.replace(/_/g, ' ');
  }

  onBook(): void {
    if (this.bookingForm.valid && this.table) {
      const request: BookingRequest = {
        tableId: this.table.id,
        customerName: this.bookingForm.value.customerName,
        groupSize: this.groupSize,
        date: this.selectedDate,
        startTime: this.selectedTime,
        durationMinutes: this.durationMinutes
      };
      this.bookTable.emit(request);
      this.showBookingForm = false;
      this.bookingForm.reset();
    }
  }

  onClose(): void {
    this.close.emit();
  }
}

