import { z } from 'zod';
import { Code7Schema } from './common.contract';

export const AddConnectionSchema = z.object({
    code7: Code7Schema,
})

export type AddConnectionInput = z.infer<typeof AddConnectionSchema>;

export interface UserConnection {
    id: string;
    username: string;
    code7: string;
    createdAt: string;
}