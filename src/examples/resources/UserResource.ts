import { z } from 'zod';
import { Resource } from '../../types/index.js';

/**
 * Schema for user data
 */
export const UserSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "user", "guest"]).default("user"),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

/**
 * Type for user data
 */
export type User = z.infer<typeof UserSchema>;

/**
 * Example custom tool schemas for user-specific operations
 */
export const ActivateUserArgsSchema = z.object({
  resourceUri: z.string().describe('URI of the user resource'),
  userId: z.string().describe('ID of the user to activate'),
});

export const DeactivateUserArgsSchema = z.object({
  resourceUri: z.string().describe('URI of the user resource'),
  userId: z.string().describe('ID of the user to deactivate'),
});

export const FilterUsersByRoleArgsSchema = z.object({
  resourceUri: z.string().describe('URI of the user resource'),
  role: z.enum(["admin", "user", "guest"]).describe('Role to filter by'),
});

/**
 * User resource configuration
 */
export const USER_RESOURCE: Resource = {
  uri: 'mcp://users',
  name: 'Users',
  description: 'User management resource',
};

/**
 * Sample user data for seeding
 */
export const SAMPLE_USERS: User[] = [
  {
    id: "usr_001",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    role: "admin",
    isActive: true
  },
  {
    id: "usr_002",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    role: "user",
    isActive: true
  },
  {
    id: "usr_003",
    firstName: "Bob",
    lastName: "Johnson",
    email: "bob.johnson@example.com",
    role: "guest",
    isActive: false
  },
  {
    id: "usr_004",
    firstName: "Alice",
    lastName: "Williams",
    email: "alice.williams@example.com",
    role: "user",
    isActive: true
  },
  {
    id: "usr_005",
    firstName: "Charlie",
    lastName: "Brown",
    email: "charlie.brown@example.com",
    role: "user",
    isActive: false
  }
];

