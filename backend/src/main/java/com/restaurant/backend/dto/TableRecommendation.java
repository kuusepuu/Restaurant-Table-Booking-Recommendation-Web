package com.restaurant.backend.dto;

import com.restaurant.backend.model.RestaurantTable;

import java.util.List;

/**
 * Output from the recommendation endpoint — a table with a computed score and reasons.
 */
public record TableRecommendation(
        RestaurantTable table,
        int score,           // 0–100
        List<String> reasons // e.g. ["Perfect size match", "Window zone as requested"]
) {}

