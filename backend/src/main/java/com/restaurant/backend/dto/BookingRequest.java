package com.restaurant.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Request body for creating a new booking.
 */
public record BookingRequest(

        @NotNull
        Long tableId,

        @NotBlank
        String customerName,

        @Min(1)
        int groupSize,

        @NotNull
        LocalDate date,

        @NotNull
        LocalTime startTime,

        @Min(30)
        int durationMinutes
) {}

