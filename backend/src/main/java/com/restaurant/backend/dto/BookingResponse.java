package com.restaurant.backend.dto;

import com.restaurant.backend.model.Booking;
import com.restaurant.backend.model.RestaurantTable;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Response body for booking endpoints — flattens the Booking entity for the API.
 */
public record BookingResponse(
        Long id,
        RestaurantTable table,
        String customerName,
        int groupSize,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime
) {
    /** Factory method to build a response from an entity. */
    public static BookingResponse from(Booking booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getTable(),
                booking.getCustomerName(),
                booking.getGroupSize(),
                booking.getDate(),
                booking.getStartTime(),
                booking.getEndTime()
        );
    }
}

