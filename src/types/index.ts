export interface Inventory {
  inventoryId: string;
  warehouseId: string;
  warehouseName: string;
  totalUnits: number;
  reservedUnits: number;
  availableUnits: number;
}

export interface Product {
  id: string;
  name: string;
  inventories: Inventory[];
}