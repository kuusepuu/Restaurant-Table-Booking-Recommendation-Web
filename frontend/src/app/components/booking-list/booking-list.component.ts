import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Booking } from '../../models/booking.model';

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking-list.component.html',
  styleUrls: ['./booking-list.component.css']
})
export class BookingListComponent {
  @Input() bookings: Booking[] = [];
  @Input() selectedDate: string = '';

  @Output() cancelBooking = new EventEmitter<number>();

  onCancel(id: number): void {
    if (confirm('Are you sure you want to cancel this booking?')) {
      this.cancelBooking.emit(id);
    }
  }

  formatTime(time: string): string {
    return time.substring(0, 5); // "18:30:00" → "18:30"
  }
}

