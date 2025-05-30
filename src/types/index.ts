import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { z } from 'zod';

/**
 * Generic resource representation for MCP
 */
export interface Resource {
  uri: string;
  name: string;
  description?: string;
  metadata?: { [key: string]: unknown };
}

/**
 * Basic interface for a data service
 */
export interface IDataService {
  /**
   * Get all available resources
   */
  listResources(): Promise<Resource[]>;
  
  /**
   * Get a specific resource by URI
   */
  getResource(_uri: string): Promise<Resource>;
  
  /**
   * Query data from a resource
   */
  queryResource(_uri: string, _query: { [key: string]: unknown }): Promise<unknown[]>;
  
  /**
   * Create a record in a resource
   */
  createRecord(_uri: string, _data: { [key: string]: unknown }): Promise<{ [key: string]: unknown }>;
  
  /**
   * Update a record in a resource
   */
  updateRecord(_uri: string, _id: string, _data: { [key: string]: unknown }): Promise<{ [key: string]: unknown }>;
  
  /**
   * Delete a record from a resource
   */
  deleteRecord(_uri: string, _id: string): Promise<boolean>;
}

/**
 * Interface for the MCP Server
 */
export interface IMCPServer {
  connect(_transport: Transport): Promise<void>;
  close(): Promise<void>;
}

// Example schema for a generic record
export const RecordSchema = z.object({
  id: z.string(),
  // Allow any fields in the record
  data: z.record(z.unknown()),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// Example schemas for tool arguments
export const ListRecordsArgsSchema = z.object({
  resourceUri: z.string().describe('URI of the resource to query'),
  maxRecords: z.number().optional().describe('Maximum number of records to return. Defaults to 100.'),
  filter: z.record(z.unknown()).optional().describe('Filter criteria'),
  sort: z.array(z.object({
    field: z.string().describe('Field name to sort by'),
    direction: z.enum(['asc', 'desc']).optional().describe('Sort direction. Defaults to asc (ascending)'),
  })).optional().describe('Specifies how to sort the records'),
});

export const GetRecordArgsSchema = z.object({
  resourceUri: z.string().describe('URI of the resource'),
  recordId: z.string().describe('ID of the record to retrieve'),
});

export const CreateRecordArgsSchema = z.object({
  resourceUri: z.string().describe('URI of the resource'),
  data: z.record(z.unknown()).describe('Record data to create'),
});

export const UpdateRecordArgsSchema = z.object({
  resourceUri: z.string().describe('URI of the resource'),
  recordId: z.string().describe('ID of the record to update'),
  data: z.record(z.unknown()).describe('New record data'),
});

export const DeleteRecordArgsSchema = z.object({
  resourceUri: z.string().describe('URI of the resource'),
  recordId: z.string().describe('ID of the record to delete'),
});

export const SearchRecordsArgsSchema = z.object({
  resourceUri: z.string().describe('URI of the resource'),
  searchTerm: z.string().describe('Text to search for in records'),
  fields: z.array(z.string()).optional().describe('Specific fields to search in. If not provided, searches all text fields.'),
  maxRecords: z.number().optional().describe('Maximum number of records to return. Defaults to 100.'),
});

// Generic types derived from the schemas
export type Record = z.infer<typeof RecordSchema>;
export type ListRecordsArgs = z.infer<typeof ListRecordsArgsSchema>;
export type GetRecordArgs = z.infer<typeof GetRecordArgsSchema>;
export type CreateRecordArgs = z.infer<typeof CreateRecordArgsSchema>;
export type UpdateRecordArgs = z.infer<typeof UpdateRecordArgsSchema>;
export type DeleteRecordArgs = z.infer<typeof DeleteRecordArgsSchema>;
export type SearchRecordsArgs = z.infer<typeof SearchRecordsArgsSchema>;

