import { RestaurantTable } from './table.model';

export interface Booking {
  id: number;
  table: RestaurantTable;
  customerName: string;
  groupSize: number;
  date: string;
  startTime: string;
  endTime: string;
}

export interface BookingRequest {
  tableId: number;
  customerName: string;
  groupSize: number;
  date: string;
  startTime: string;
  durationMinutes: number;
}

export interface BookingResponse extends Booking {}

