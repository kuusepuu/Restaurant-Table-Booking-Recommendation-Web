package com.restaurant.backend.service;

import com.restaurant.backend.dto.SearchCriteria;
import com.restaurant.backend.dto.TableRecommendation;
import com.restaurant.backend.Entity.RestaurantTable;
import com.restaurant.backend.repository.BookingRepository;
import com.restaurant.backend.repository.TableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Scores and ranks available tables based on SearchCriteria.
 *
 * Scoring breakdown (max 100 pts):
 *   - Capacity fit       : 40 pts  — penalises wasted seats
 *   - Zone match         : 30 pts  — rewards preferred zone
 *   - Accessibility      : 20 pts  — rewards accessible when required; neutral when not needed
 *   - Low utilisation    : 10 pts  — distributes bookings evenly across tables
 */
@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final TableRepository tableRepository;
    private final BookingRepository bookingRepository;

    public List<TableRecommendation> recommend(SearchCriteria criteria) {
        var endTime = criteria.endTime();

        // ── Step 1: booked table IDs for the requested slot ──────────────────
        Set<Long> bookedIds = bookingRepository
                .findOverlapping(criteria.date(), criteria.startTime(), endTime)
                .stream()
                .map(b -> b.getTable().getId())
                .collect(Collectors.toSet());

        // ── Step 2: bookings-today count per table (utilisation bonus) ────────
        Map<Long, Long> bookingsToday = bookingRepository
                .findByDate(criteria.date())
                .stream()
                .collect(Collectors.groupingBy(b -> b.getTable().getId(), Collectors.counting()));

        long maxBookings = bookingsToday.values().stream()
                .mapToLong(Long::longValue)
                .max()
                .orElse(1);

        // ── Step 3: filter ineligible tables, then score & sort ──────────────
        return tableRepository.findAll().stream()
                .filter(t -> !bookedIds.contains(t.getId()))
                .filter(t -> t.getCapacity() >= criteria.groupSize())
                .map(t -> scoreTable(t, criteria, bookingsToday.getOrDefault(t.getId(), 0L), maxBookings))
                .sorted(Comparator.comparingInt(TableRecommendation::score).reversed())
                .toList();
    }

    // ── Scoring ───────────────────────────────────────────────────────────────

    private TableRecommendation scoreTable(RestaurantTable table,
                                            SearchCriteria criteria,
                                            long tableBookingsToday,
                                            long maxBookings) {
        int score = 0;
        List<String> reasons = new ArrayList<>();

        // 1. Capacity fit (0–40 pts) — 10 pt penalty per unused seat over group size
        int waste = table.getCapacity() - criteria.groupSize();
        int capacityScore = Math.max(0, 40 - waste * 10);
        score += capacityScore;
        if (capacityScore == 40) {
            reasons.add("Perfect size match");
        } else if (capacityScore >= 20) {
            reasons.add("Good size match");
        }

        // 2. Zone preference (0–30 pts)
        List<com.restaurant.backend.Entity.Zone> preferred = criteria.preferredZones();
        if (preferred != null && !preferred.isEmpty() && preferred.contains(table.getZone())) {
            score += 30;
            reasons.add(table.getZone().name().replace('_', ' ') + " zone as requested");
        }

        // 3. Accessibility (0–20 pts)
        if (!criteria.needsAccessible() || table.isAccessible()) {
            score += 20;
            if (criteria.needsAccessible() && table.isAccessible()) {
                reasons.add("Wheelchair accessible");
            }
        }

        // 4. Low-utilisation bonus (0–10 pts)
        int utilisationBonus = (int) Math.round(10.0 * (1.0 - (double) tableBookingsToday / maxBookings));
        score += utilisationBonus;
        if (utilisationBonus == 10) {
            reasons.add("Lightly booked today");
        }

        return new TableRecommendation(table, score, reasons);
    }
}

