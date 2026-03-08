package com.restaurant.backend.service;

import com.restaurant.backend.Entity.RestaurantTable;
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
public class TableService {

    private final TableRepository tableRepository;
    private final BookingRepository bookingRepository;

    /** Return every table (used for floor plan rendering). */
    public List<RestaurantTable> getAllTables() {
        return tableRepository.findAll();
    }

    /** Return a single table by id, or 404 if not found. */
    public RestaurantTable getTableById(Long id) {
        return tableRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Table not found: " + id));
    }

    /**
     * Return tables that are available for the given time slot and can seat the group.
     *
     * @param date      the booking date
     * @param startTime start of the desired slot
     * @param endTime   end of the desired slot
     * @param groupSize minimum seating capacity required
     */
    public List<RestaurantTable> getAvailableTables(LocalDate date,
                                                     LocalTime startTime,
                                                     LocalTime endTime,
                                                     int groupSize) {
        Set<Long> bookedIds = bookingRepository
                .findOverlapping(date, startTime, endTime)
                .stream()
                .map(b -> b.getTable().getId())
                .collect(Collectors.toSet());

        return tableRepository.findAll().stream()
                .filter(t -> !bookedIds.contains(t.getId()))
                .filter(t -> t.getCapacity() >= groupSize)
                .toList();
    }
}

