import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RestaurantTable, TableRecommendation } from '../../models/table.model';
import { Booking } from '../../models/booking.model';

@Component({
  selector: 'app-floor-plan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './floor-plan.component.html',
  styleUrls: ['./floor-plan.component.css']
})
export class FloorPlanComponent {
  // Inputs: data from parent component
  @Input() tables: RestaurantTable[] = [];
  @Input() recommendations: TableRecommendation[] = [];
  @Input() bookings: Booking[] = [];
  @Input() selectedGroupSize: number = 2;

  // Output: events to parent component
  @Output() tableSelected = new EventEmitter<RestaurantTable>();

  // Layout config
  cellSize = 90;
  gridPadding = 24;
  /** Extra top padding inside each zone rect to fit the zone label */
  zoneLabelHeight = 24;
  /** Horizontal gap inserted between distinct x-band zone groups */
  zoneXGap = 24;
  /** Outward padding on each side of a zone rect, giving tables equal breathing room */
  zonePad = 8;

  get gridWidth(): number {
    if (this.tables.length === 0) return 400;
    const maxX = Math.max(...this.tables.map(t => t.gridX));
    const xGroups = this.zoneBandXOffsets;
    const maxXOffset = xGroups.size > 0 ? Math.max(...xGroups.values()) : 0;
    return (maxX + 1) * this.cellSize + this.gridPadding * 2 + maxXOffset + this.zonePad;
  }

  // Check table status
  isOccupied(table: RestaurantTable): boolean {
    return this.bookings.some(b => b.table.id === table.id);
  }

  isRecommended(table: RestaurantTable): boolean {
    return this.recommendations.some(r => r.table.id === table.id);
  }

  isTooSmall(table: RestaurantTable): boolean {
    return table.capacity < this.selectedGroupSize;
  }

  getScore(table: RestaurantTable): number {
    const rec = this.recommendations.find(r => r.table.id === table.id);
    return rec ? rec.score : 0;
  }

  selectTable(table: RestaurantTable): void {
    if (!this.isOccupied(table) && !this.isTooSmall(table)) {
      this.tableSelected.emit(table);
    }
  }

  // Zone color mapping for backgrounds
  getZoneColor(zone: string): string {
    const colors: Record<string, string> = {
      'MAIN_HALL': '#e8f4fd',
      'WINDOW': '#fff8ed',
      'PRIVATE': '#f5eeff',
      'PATIO': '#edf7ed'
    };
    return colors[zone] || '#f5f5f5';
  }

  getZoneStroke(zone: string): string {
    const strokes: Record<string, string> = {
      'MAIN_HALL': '#90caf9',
      'WINDOW': '#ffcc80',
      'PRIVATE': '#ce93d8',
      'PATIO': '#a5d6a7'
    };
    return strokes[zone] || '#ccc';
  }

  getZoneLabelColor(zone: string): string {
    const colors: Record<string, string> = {
      'MAIN_HALL': '#1565c0',
      'WINDOW': '#e65100',
      'PRIVATE': '#6a1b9a',
      'PATIO': '#2e7d32'
    };
    return colors[zone] || '#555';
  }

  // Zone label display
  formatZone(zone: string): string {
    return zone.replace(/_/g, ' ');
  }

  // Get unique zones
  get zones(): string[] {
    return [...new Set(this.tables.map(t => t.zone))];
  }

  getTablesForZone(zone: string): RestaurantTable[] {
    return this.tables.filter(t => t.zone === zone);
  }

  /*NOTE: AI Helped me with this logic*/
  /**
   * Each "x-band" is a group of zones that share the same gridX column range.
   * Zones in different x-bands get cumulative X offsets so they don't touch.
   *
   * Returns a map of zone → extra X pixels to add.
   */
  private get zoneBandXOffsets(): Map<string, number> {
    if (this.tables.length === 0) return new Map();
    // Group zones by their minimum gridX (x-band key)
    const bandZones = new Map<number, string[]>();
    for (const zone of this.zones) {
      const zoneTables = this.getTablesForZone(zone);
      if (zoneTables.length === 0) continue;
      const minX = Math.min(...zoneTables.map(t => t.gridX));
      const existing = bandZones.get(minX) ?? [];
      existing.push(zone);
      bandZones.set(minX, existing);
    }

    // Sort bands by their gridX
    const sortedBands = [...bandZones.keys()].sort((a, b) => a - b);

    // Assign cumulative extra X per band
    const offsets = new Map<string, number>();
    let cumulativeExtra = 0;

    for (const bandX of sortedBands) {
      // After the first band each subsequent band gets additional gap
      if (bandX !== sortedBands[0]) {
        cumulativeExtra += this.zoneXGap;
      }
      const zonesInBand = bandZones.get(bandX)!;
      for (const zone of zonesInBand) {
        offsets.set(zone, cumulativeExtra);
      }
    }

    return offsets;
  }

  private getZoneXOffset(zone: string): number {
    return this.zoneBandXOffsets.get(zone) ?? 0;
  }

  /*NOTE: AI Helped me with this logic*/
  /**
   * Each "band" is a set of zones that share the same gridY rows.
   * We group zones by their minGridY and add cumulative Y offsets
   * so each band has extra space (zoneLabelHeight) above it for the label.
   *
   * Zones in the same band (same rows) share that offset — their labels
   * are differentiated by X position.
   *
   * Returns a map of zone → extra Y pixels to add.
   */
  private get zoneBandOffsets(): Map<string, number> {
    if (this.tables.length === 0) return new Map();
    // Group zones by their minimum gridY (band key)
    const bandZones = new Map<number, string[]>();
    for (const zone of this.zones) {
      const zoneTables = this.getTablesForZone(zone);
      if (zoneTables.length === 0) continue;
      const minY = Math.min(...zoneTables.map(t => t.gridY));
      const existing = bandZones.get(minY) ?? [];
      existing.push(zone);
      bandZones.set(minY, existing);
    }

    // Sort bands by their gridY
    const sortedBands = [...bandZones.keys()].sort((a, b) => a - b);

    // Assign cumulative extra Y per band (each band gets +zoneLabelHeight)
    const offsets = new Map<string, number>();
    let cumulativeExtra = 0;

    for (const bandY of sortedBands) {
      // Add label height for this band
      cumulativeExtra += this.zoneLabelHeight;
      const zonesInBand = bandZones.get(bandY)!;
      for (const zone of zonesInBand) {
        offsets.set(zone, cumulativeExtra);
      }
    }

    return offsets;
  }

  private getZoneYOffset(zone: string): number {
    return this.zoneBandOffsets.get(zone) ?? 0;
  }

  /*NOTE: AI Helped me with this logic*/
  // Get bounding box for a zone (for background rect)
  getZoneBounds(zone: string): { x: number; y: number; width: number; height: number } {
    const zoneTables = this.getTablesForZone(zone);
    if (zoneTables.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
    const minX = Math.min(...zoneTables.map(t => t.gridX));
    const minY = Math.min(...zoneTables.map(t => t.gridY));
    const maxX = Math.max(...zoneTables.map(t => t.gridX));
    const maxY = Math.max(...zoneTables.map(t => t.gridY));
    const padY = 8;
    const yOffset = this.getZoneYOffset(zone);
    const xOffset = this.getZoneXOffset(zone);
    return {
      x: minX * this.cellSize + this.gridPadding + xOffset - this.zonePad,
      y: minY * this.cellSize + this.gridPadding - padY + yOffset - this.zoneLabelHeight,
      width: (maxX - minX + 1) * this.cellSize + this.zonePad * 2,
      height: (maxY - minY + 1) * this.cellSize + padY * 2 + this.zoneLabelHeight
    };
  }

  getZoneLabelX(zone: string): number {
    const bounds = this.getZoneBounds(zone);
    return bounds.x + 12;
  }

  getZoneLabelY(zone: string): number {
    const bounds = this.getZoneBounds(zone);
    // Place label inside the label header strip — vertically centered in the strip
    return bounds.y + this.zoneLabelHeight - 6;
  }

  tableX(table: RestaurantTable): number {
    const xOffset = this.getZoneXOffset(table.zone);
    return table.gridX * this.cellSize + this.gridPadding + xOffset;
  }

  tableY(table: RestaurantTable): number {
    const yOffset = this.getZoneYOffset(table.zone);
    return table.gridY * this.cellSize + this.gridPadding + yOffset;
  }

  get gridHeightWithOffsets(): number {
    if (this.tables.length === 0) return 300;
    const maxRenderedY = Math.max(...this.tables.map(t => this.tableY(t)));
    return maxRenderedY + this.cellSize + this.gridPadding;
  }
}

