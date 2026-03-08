package com.restaurant.backend.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "restaurant_table")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantTable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String label;      // "T1", "W3", "P1"
    private int capacity;      // 2, 4, 6, 8

    @Enumerated(EnumType.STRING)
    private Zone zone;         // MAIN_HALL, WINDOW, PRIVATE, PATIO

    private boolean accessible; // wheelchair accessible
    private int gridX;          // column position on floor plan
    private int gridY;          // row position on floor plan
}

