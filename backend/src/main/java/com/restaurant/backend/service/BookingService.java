package com.restaurant.backend.service;

import com.restaurant.backend.dto.BookingRequest;
import com.restaurant.backend.dto.BookingResponse;
import com.restaurant.backend.model.Booking;
import com.restaurant.backend.model.RestaurantTable;
import com.restaurant.backend.repository.BookingRepository;
import com.restaurant.backend.repository.TableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final TableRepository tableRepository;

    /** Return all bookings for a given date. */
    public List<BookingResponse> getBookings(LocalDate date) {
        return bookingRepository.findByDate(date).stream()
                .map(BookingResponse::from)
                .toList();
    }

    /**
     * Create a new booking.
     * Validates:
     * - table exists
     * - group fits at the table (capacity check)
     * - table is not already booked for the requested time slot
     */
    public BookingResponse createBooking(BookingRequest request) {
        // 1. Validate table exists
        RestaurantTable table = tableRepository.findById(request.tableId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Table not found: " + request.tableId()));

        // 2. Capacity check
        if (table.getCapacity() < request.groupSize()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Table capacity (" + table.getCapacity() + ") is less than group size ("
                            + request.groupSize() + ")");
        }

        LocalTime endTime = request.startTime().plusMinutes(request.durationMinutes());

        // 3. Overlap check
        boolean alreadyBooked = bookingRepository
                .findOverlapping(request.date(), request.startTime(), endTime)
                .stream()
                .anyMatch(b -> b.getTable().getId().equals(request.tableId()));

        if (alreadyBooked) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Table " + table.getLabel() + " is already booked for that time slot");
        }

        Booking booking = Booking.builder()
                .table(table)
                .customerName(request.customerName())
                .groupSize(request.groupSize())
                .date(request.date())
                .startTime(request.startTime())
                .endTime(endTime)
                .build();

        return BookingResponse.from(bookingRepository.save(booking));
    }

    /** Cancel (delete) a booking by id, or 404 if it doesn't exist. */
    public void cancelBooking(Long id) {
        if (!bookingRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found: " + id);
        }
        bookingRepository.deleteById(id);
    }
}

