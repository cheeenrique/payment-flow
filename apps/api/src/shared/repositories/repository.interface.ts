/**
 * Generic port for aggregate repositories.
 * Domain modules define concrete interfaces that extend or mirror this contract.
 * Infrastructure implements; domain depends on the interface only.
 */
export interface IRepository<T> {
  create(entity: T): Promise<void>;
  findById(id: string): Promise<T | null>;
  update(entity: T): Promise<void>;
}
