package com.restaurant.backend.controller;

import com.restaurant.backend.dto.BookingRequest;
import com.restaurant.backend.dto.BookingResponse;
import com.restaurant.backend.dto.SearchCriteria;
import com.restaurant.backend.dto.TableRecommendation;
import com.restaurant.backend.service.BookingService;
import com.restaurant.backend.service.RecommendationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final RecommendationService recommendationService;

    /**
     * GET /api/bookings?date=YYYY-MM-DD
     * Returns all bookings for the given date.
     */
    @GetMapping
    public List<BookingResponse> getBookings(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return bookingService.getBookings(date);
    }

    /**
     * POST /api/bookings
     * Creates a new booking. Returns 201 Created on success.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponse createBooking(@Valid @RequestBody BookingRequest request) {
        return bookingService.createBooking(request);
    }

    /**
     * DELETE /api/bookings/{id}
     * Cancels a booking. Returns 204 No Content on success.
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelBooking(@PathVariable Long id) {
        bookingService.cancelBooking(id);
    }

    /**
     * POST /api/bookings/recommend
     * Returns a ranked list of table recommendations for the given criteria.
     */
    @PostMapping("/recommend")
    public List<TableRecommendation> recommend(@Valid @RequestBody SearchCriteria criteria) {
        return recommendationService.recommend(criteria);
    }
}

