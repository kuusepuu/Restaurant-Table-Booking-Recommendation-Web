package com.restaurant.backend.repository;

import com.restaurant.backend.Entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    /**
     * Find all bookings that overlap with a given time range on a given date.
     * Two intervals overlap when one starts before the other ends AND ends after the other starts.
     */
    @Query("SELECT b FROM Booking b WHERE b.date = :date " +
           "AND b.startTime < :endTime AND b.endTime > :startTime")
    List<Booking> findOverlapping(
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    List<Booking> findByDate(LocalDate date);

    void deleteAll();
}

