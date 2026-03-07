import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RestaurantTable, SearchCriteria, TableRecommendation } from './models/table.model';
import { Booking, BookingRequest } from './models/booking.model';
import { TableService } from './services/table.service';
import { BookingService } from './services/booking.service';
import { RecommendationService } from './services/recommendation.service';
import { FloorPlanComponent } from './components/floor-plan/floor-plan.component';
import { BookingSearchComponent } from './components/booking-search/booking-search.component';
import { TableDetailComponent } from './components/table-detail/table-detail.component';
import { BookingListComponent } from './components/booking-list/booking-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FloorPlanComponent,
    BookingSearchComponent,
    TableDetailComponent,
    BookingListComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  tables = signal<RestaurantTable[]>([]);
  bookings = signal<Booking[]>([]);
  recommendations = signal<TableRecommendation[]>([]);
  selectedTable = signal<RestaurantTable | null>(null);
  selectedRecommendation = signal<TableRecommendation | null>(null);

  // Search state
  isSearching = signal(false);
  searchPerformed = signal(false);
  searchError = signal<string | null>(null);

  // Track current search criteria
  currentCriteria = signal<SearchCriteria>({
    date: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    durationMinutes: 120,
    groupSize: 2,
    preferredZones: [],
    needsAccessible: false
  });

  constructor(
    private tableService: TableService,
    private bookingService: BookingService,
    private recommendationService: RecommendationService
  ) {}

  ngOnInit(): void {
    this.loadTables();
    this.loadBookings();
  }

  loadTables(): void {
    this.tableService.getAllTables().subscribe({
      next: (tables) => this.tables.set(tables),
      error: (err) => console.error('Failed to load tables:', err)
    });
  }

  loadBookings(): void {
    this.bookingService.getBookings(this.currentCriteria().date).subscribe({
      next: (bookings) => this.bookings.set(bookings),
      error: (err) => console.error('Failed to load bookings:', err)
    });
  }

  onSearch(criteria: SearchCriteria): void {
    this.currentCriteria.set(criteria);
    this.selectedTable.set(null);
    this.selectedRecommendation.set(null);
    this.isSearching.set(true);
    this.searchError.set(null);

    this.recommendationService.recommend(criteria).subscribe({
      next: (recommendations) => {
        this.recommendations.set(recommendations);
        this.searchPerformed.set(true);
        this.isSearching.set(false);
        this.loadBookings();
      },
      error: (err) => {
        console.error('Search failed:', err);
        this.isSearching.set(false);
        this.searchError.set('Could not load recommendations. Is the backend running?');
      }
    });
  }

  onTableSelected(table: RestaurantTable): void {
    this.selectedTable.set(table);
    this.selectedRecommendation.set(
      this.recommendations().find(r => r.table.id === table.id) ?? null
    );
  }

  onCloseDetail(): void {
    this.selectedTable.set(null);
    this.selectedRecommendation.set(null);
  }

  onBookTable(request: BookingRequest): void {
    this.bookingService.createBooking(request).subscribe({
      next: () => {
        alert('Booking confirmed! 🎉');
        this.selectedTable.set(null);
        this.selectedRecommendation.set(null);
        this.onSearch(this.currentCriteria());
      },
      error: (err) => {
        console.error('Booking failed:', err);
        const msg = err?.error?.message || 'The table may no longer be available.';
        alert(`Failed to create booking: ${msg}`);
      }
    });
  }

  onCancelBooking(id: number): void {
    this.bookingService.cancelBooking(id).subscribe({
      next: () => this.onSearch(this.currentCriteria()),
      error: (err) => console.error('Cancel failed:', err)
    });
  }
}
