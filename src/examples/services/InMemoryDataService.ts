import { v4 as uuidv4 } from 'uuid';
import { IDataService, Resource } from '../../types/index.js';
import { logger } from '../../utils/index.js';

/**
 * Simple in-memory data service implementation
 */
export class InMemoryDataService implements IDataService {
  private resources: Map<string, Resource> = new Map();
  private data: Map<string, Map<string, Record<string, unknown>>> = new Map();

  /**
   * Constructor
   * 
   * @param resourcePrefix - Prefix for resource URIs
   */
  constructor(private resourcePrefix: string = 'mcp://') {}

  /**
   * Register a new resource with the service
   * 
   * @param name - Name of the resource
   * @param description - Optional description
   * @returns The created resource
   */
  public registerResource(name: string, description?: string): Resource {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const uri = `${this.resourcePrefix}${id}`;
    
    const resource: Resource = {
      uri,
      name,
      description,
    };
    
    this.resources.set(uri, resource);
    this.data.set(uri, new Map());
    
    logger.info(`Registered resource: ${name} (${uri})`);
    return resource;
  }

  /**
   * Get all resources
   */
  public async listResources(): Promise<Resource[]> {
    return Array.from(this.resources.values());
  }

  /**
   * Get a specific resource by URI
   */
  public async getResource(uri: string): Promise<Resource> {
    const resource = this.resources.get(uri);
    if (!resource) {
      throw new Error(`Resource not found: ${uri}`);
    }
    return resource;
  }

  /**
   * Query data from a resource
   */
  public async queryResource(
    uri: string, 
    query: Record<string, unknown>
  ): Promise<unknown[]> {
    this.validateResource(uri);
    
    const resourceData = this.data.get(uri)!;
    let records = Array.from(resourceData.values());
    
    // Apply search if provided
    if (typeof query.searchTerm === 'string' && query.searchTerm) {
      const searchTerm = query.searchTerm.toLowerCase();
      const fields = Array.isArray(query.fields) ? query.fields : null;
      
      records = records.filter(record => {
        return Object.entries(record)
          .filter(([key]) => !fields || fields.includes(key))
          .some(([, value]) => {
            if (typeof value === 'string') {
              return value.toLowerCase().includes(searchTerm);
            }
            if (typeof value === 'number' || typeof value === 'boolean') {
              return String(value).toLowerCase().includes(searchTerm);
            }
            return false;
          });
      });
    }
    
    // Apply filter if provided
    if (query.filter && typeof query.filter === 'object') {
      records = records.filter(record => {
        return Object.entries(query.filter as Record<string, unknown>)
          .every(([key, value]) => record[key] === value);
      });
    }
    
    // Apply sort if provided
    if (Array.isArray(query.sort) && query.sort.length > 0) {
      records.sort((a, b) => {
        for (const sortItem of query.sort as Array<{ field: string, direction?: 'asc' | 'desc' }>) {
          const { field, direction = 'asc' } = sortItem;
          const aValue = a[field];
          const bValue = b[field];
          
          if (aValue === bValue) continue;
          
          if (aValue === undefined) return direction === 'asc' ? -1 : 1;
          if (bValue === undefined) return direction === 'asc' ? 1 : -1;
          
          const comparison = String(aValue).localeCompare(String(bValue));
          return direction === 'asc' ? comparison : -comparison;
        }
        return 0;
      });
    }
    
    // Apply maxRecords if provided
    if (typeof query.maxRecords === 'number' && query.maxRecords > 0) {
      records = records.slice(0, query.maxRecords);
    }
    
    return records;
  }

  /**
   * Create a record in a resource
   */
  public async createRecord(
    uri: string, 
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    this.validateResource(uri);
    
    const id = data.id as string || uuidv4();
    const timestamp = new Date().toISOString();
    
    const record = {
      id,
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    this.data.get(uri)!.set(id, record);
    return record;
  }

  /**
   * Update a record in a resource
   */
  public async updateRecord(
    uri: string, 
    id: string, 
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    this.validateResource(uri);
    
    const resourceData = this.data.get(uri)!;
    const existingRecord = resourceData.get(id);
    
    if (!existingRecord) {
      throw new Error(`Record not found: ${id}`);
    }
    
    const updatedRecord = {
      ...existingRecord,
      ...data,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };
    
    resourceData.set(id, updatedRecord);
    return updatedRecord;
  }

  /**
   * Delete a record from a resource
   */
  public async deleteRecord(uri: string, id: string): Promise<boolean> {
    this.validateResource(uri);
    
    const resourceData = this.data.get(uri)!;
    
    if (!resourceData.has(id)) {
      throw new Error(`Record not found: ${id}`);
    }
    
    return resourceData.delete(id);
  }

  /**
   * Seed the service with initial data
   * 
   * @param uri - Resource URI
   * @param records - Records to add
   */
  public seedData(uri: string, records: Record<string, unknown>[]): void {
    this.validateResource(uri);
    
    const resourceData = this.data.get(uri)!;
    const timestamp = new Date().toISOString();
    
    for (const record of records) {
      const id = record.id as string || uuidv4();
      resourceData.set(id, {
        id,
        ...record,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }
    
    logger.info(`Seeded ${records.length} records to ${uri}`);
  }

  /**
   * Validate that a resource exists
   */
  private validateResource(uri: string): void {
    if (!this.resources.has(uri)) {
      throw new Error(`Resource not found: ${uri}`);
    }
  }
}

