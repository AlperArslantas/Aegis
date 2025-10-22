/**
 * Unit of Work Interface
 * Transaction yönetimi ve repository koordinasyonu için
 */

import { ISensorDataRepository, IUserRepository, IDoorEventRepository, IVideoRecordingRepository } from './IRepository';

export interface IUnitOfWork {
  // Transaction Management
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  isInTransaction(): boolean;

  // Repositories
  sensorDataRepository: ISensorDataRepository;
  userRepository: IUserRepository;
  doorEventRepository: IDoorEventRepository;
  videoRecordingRepository: IVideoRecordingRepository;

  // Batch Operations
  saveChanges(): Promise<void>;
  dispose(): Promise<void>;
}

export interface IUnitOfWorkFactory {
  create(): Promise<IUnitOfWork>;
}
