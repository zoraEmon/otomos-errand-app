import { z } from 'zod';

export const ErrandStatusEnum = z.enum([
    'pending_acceptance',
    'active',
    'rejected',
    'completed_by_runner',
    'closed'
]);

export const CreateErrandItemSchema = z.object({
    itemName: z.string().min(1, 'Item name is required.'),
    quantity: z.number().int().positive().default(1),
})

export const CreateErrandSchema = z.object({
  runnerId: z.string().uuid('Invalid Runner ID'),
  items: z.array(CreateErrandItemSchema).min(1, 'At least one item is required'),
});

export const UpdateErrandStatusSchema = z.object({
  status: ErrandStatusEnum,
});

export const UpdateErrandItemSchema = z.object({
  isBought: z.boolean(),
});

export type CreateErrandInput = z.infer<typeof CreateErrandSchema>;
export type UpdateErrandStatusInput = z.infer<typeof UpdateErrandStatusSchema>;
export type UpdateErrandItemInput = z.infer<typeof UpdateErrandItemSchema>;
export type ErrandStatus = z.infer<typeof ErrandStatusEnum>;

export interface ErrandItemDTO {
  id: string;
  errandId: string;
  itemName: string;
  quantity: number;
  isBought: boolean;
  updatedAt: string;
}

export interface ErrandDTO {
  id: string;
  commanderId: string;
  runnerId: string;
  status: ErrandStatus;
  createdAt: string;
  updatedAt: string;
  items: ErrandItemDTO[];
}