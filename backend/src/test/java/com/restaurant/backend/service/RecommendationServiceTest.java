package com.restaurant.backend.service;

import com.restaurant.backend.dto.SearchCriteria;
import com.restaurant.backend.dto.TableRecommendation;
import com.restaurant.backend.model.Booking;
import com.restaurant.backend.model.RestaurantTable;
import com.restaurant.backend.model.Zone;
import com.restaurant.backend.repository.BookingRepository;
import com.restaurant.backend.repository.TableRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RecommendationServiceTest {

    @Mock
    private TableRepository tableRepository;

    @Mock
    private BookingRepository bookingRepository;

    @InjectMocks
    private RecommendationService recommendationService;

    private final LocalDate TODAY = LocalDate.of(2026, 3, 7);
    private final LocalTime START  = LocalTime.of(18, 0);

    /** Convenience builder for a table with no accessibility by default. */
    private RestaurantTable table(long id, int capacity, Zone zone) {
        return RestaurantTable.builder()
                .id(id)
                .label("T" + id)
                .capacity(capacity)
                .zone(zone)
                .accessible(false)
                .gridX((int) id)
                .gridY(1)
                .build();
    }

    private SearchCriteria criteria(int groupSize, List<Zone> zones, boolean accessible) {
        return new SearchCriteria(TODAY, START, 120, groupSize, zones, accessible);
    }

    @BeforeEach
    void stubEmptyBookings() {
        // By default, no overlapping bookings and no bookings today
        when(bookingRepository.findOverlapping(any(), any(), any())).thenReturn(List.of());
        when(bookingRepository.findByDate(any())).thenReturn(List.of());
    }


    // Test 1: Exact-capacity table is preferred over a too-large table
    @Test
    void shouldPreferExactCapacityMatch() {
        // Given: a 2-seat and a 6-seat table; group of 2
        RestaurantTable twoSeater = table(1L, 2, Zone.MAIN_HALL);
        RestaurantTable sixSeater = table(2L, 6, Zone.MAIN_HALL);
        when(tableRepository.findAll()).thenReturn(List.of(twoSeater, sixSeater));

        // When
        List<TableRecommendation> results = recommendationService.recommend(
                criteria(2, List.of(), false));

        // Then: 2-seat table is ranked first and has a higher score
        assertThat(results).hasSize(2);
        assertThat(results.get(0).table().getId()).isEqualTo(1L);
        assertThat(results.get(0).score()).isGreaterThan(results.get(1).score());
    }


    // Test 2: Zone preference boosts score
    @Test
    void shouldBoostScoreForPreferredZone() {
        // Given: two identical 4-seat tables, one in WINDOW zone, one in MAIN_HALL
        RestaurantTable windowTable = table(1L, 4, Zone.WINDOW);
        RestaurantTable mainHallTable = table(2L, 4, Zone.MAIN_HALL);
        when(tableRepository.findAll()).thenReturn(List.of(windowTable, mainHallTable));

        // When: customer prefers WINDOW zone
        List<TableRecommendation> results = recommendationService.recommend(
                criteria(4, List.of(Zone.WINDOW), false));

        // Then: WINDOW table should be ranked first and have a higher score
        assertThat(results).hasSize(2);
        assertThat(results.get(0).table().getId()).isEqualTo(1L);
        assertThat(results.get(0).score()).isGreaterThan(results.get(1).score());
        assertThat(results.get(0).reasons()).anyMatch(r -> r.contains("WINDOW") || r.contains("Window"));
    }


    // Test 3: Booked tables are excluded from recommendations
    @Test
    void shouldExcludeBookedTables() {
        // Given: two available 4-seat tables, but table 1 has an overlapping booking
        RestaurantTable bookedTable = table(1L, 4, Zone.MAIN_HALL);
        RestaurantTable availableTable = table(2L, 4, Zone.MAIN_HALL);

        Booking overlappingBooking = Booking.builder()
                .id(99L)
                .table(bookedTable)
                .customerName("Alice")
                .groupSize(3)
                .date(TODAY)
                .startTime(START)
                .endTime(START.plusMinutes(120))
                .build();

        when(tableRepository.findAll()).thenReturn(List.of(bookedTable, availableTable));
        // Override the default stub: table 1 is booked during the requested slot
        when(bookingRepository.findOverlapping(TODAY, START, START.plusMinutes(120)))
                .thenReturn(List.of(overlappingBooking));

        // When
        List<TableRecommendation> results = recommendationService.recommend(
                criteria(4, List.of(), false));

        // Then: only the available table is returned
        assertThat(results).hasSize(1);
        assertThat(results.get(0).table().getId()).isEqualTo(2L);
    }
}

