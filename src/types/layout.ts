export interface LayoutTile {
  x: number;
  y: number;
  width: number;
  height: number;
  isWide: boolean;
}

export interface RowConfig {
  tiles: LayoutTile[];
  height: number;
} 