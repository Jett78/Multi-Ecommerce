import { BaseEntity } from "./base-entity";

export interface Brand extends BaseEntity {
  name: string;
  imageKey?: string;
  sortOrder: number;
  isActive: boolean;
}
