package com.restaurant.backend.controller;

import com.restaurant.backend.Entity.RestaurantTable;
import com.restaurant.backend.service.TableService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/tables")
@RequiredArgsConstructor
public class TableController {

    private final TableService tableService;

    /** GET /api/tables — all tables (used for floor plan rendering). */
    @GetMapping
    public List<RestaurantTable> getAllTables() {
        return tableService.getAllTables();
    }

    /** GET /api/tables/{id} — single table details. */
    @GetMapping("/{id}")
    public RestaurantTable getTableById(@PathVariable Long id) {
        return tableService.getTableById(id);
    }

    /**
     * GET /api/tables/available?date=&start=&end=&groupSize=
     * Returns tables that are free for the given slot and can seat the group.
     */
    @GetMapping("/available")
    public List<RestaurantTable> getAvailableTables(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime end,
            @RequestParam int groupSize) {
        return tableService.getAvailableTables(date, start, end, groupSize);
    }
}

