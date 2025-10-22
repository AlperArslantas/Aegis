/**
 * Unit of Work Implementation
 * Transaction yönetimi ve repository koordinasyonu
 */

import { IUnitOfWork } from '../interfaces/IUnitOfWork';
import { 
  ISensorDataRepository, 
  IUserRepository, 
  IDoorEventRepository, 
  IVideoRecordingRepository 
} from '../interfaces/IRepository';

export class UnitOfWork implements IUnitOfWork {
  private _inTransaction = false;
  private _transaction: any = null;

  constructor(
    public sensorDataRepository: ISensorDataRepository,
    public userRepository: IUserRepository,
    public doorEventRepository: IDoorEventRepository,
    public videoRecordingRepository: IVideoRecordingRepository
  ) {}

  async beginTransaction(): Promise<void> {
    if (this._inTransaction) {
      throw new Error('Transaction already started');
    }

    // SQLite için transaction başlat
    // Bu kısım database implementasyonunda yapılacak
    this._inTransaction = true;
    console.log('[UnitOfWork] Transaction started');
  }

  async commit(): Promise<void> {
    if (!this._inTransaction) {
      throw new Error('No active transaction');
    }

    // Tüm değişiklikleri commit et
    // Bu kısım database implementasyonunda yapılacak
    this._inTransaction = false;
    console.log('[UnitOfWork] Transaction committed');
  }

  async rollback(): Promise<void> {
    if (!this._inTransaction) {
      throw new Error('No active transaction');
    }

    // Tüm değişiklikleri geri al
    // Bu kısım database implementasyonunda yapılacak
    this._inTransaction = false;
    console.log('[UnitOfWork] Transaction rolled back');
  }

  isInTransaction(): boolean {
    return this._inTransaction;
  }

  async saveChanges(): Promise<void> {
    if (this._inTransaction) {
      await this.commit();
    }
  }

  async dispose(): Promise<void> {
    if (this._inTransaction) {
      await this.rollback();
    }
    console.log('[UnitOfWork] Disposed');
  }
}

export class UnitOfWorkFactory {
  constructor(
    private sensorDataRepository: ISensorDataRepository,
    private userRepository: IUserRepository,
    private doorEventRepository: IDoorEventRepository,
    private videoRecordingRepository: IVideoRecordingRepository
  ) {}

  async create(): Promise<IUnitOfWork> {
    return new UnitOfWork(
      this.sensorDataRepository,
      this.userRepository,
      this.doorEventRepository,
      this.videoRecordingRepository
    );
  }
}
