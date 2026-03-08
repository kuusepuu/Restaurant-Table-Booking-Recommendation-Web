package com.restaurant.backend.dto;

import com.restaurant.backend.Entity.Zone;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Input criteria for the table recommendation endpoint.
 */
public record SearchCriteria(

        @NotNull
        LocalDate date,

        @NotNull
        LocalTime startTime,

        @Min(30)
        int durationMinutes,   // default 120 minutes

        @Min(1)
        int groupSize,

        List<Zone> preferredZones,  // can be empty or null

        boolean needsAccessible
) {
    /** Convenience method — computes endTime from startTime + durationMinutes. */
    public LocalTime endTime() {
        return startTime.plusMinutes(durationMinutes);
    }
}

