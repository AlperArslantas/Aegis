/**
 * Dependency Injection Container
 * SOLID prensiplerine uygun bağımlılık yönetimi
 */

import { IGPIOService, ISensorService, IDoorService, IVideoService } from '../interfaces/IGPIOService';
import { IUnitOfWork, IUnitOfWorkFactory } from '../interfaces/IUnitOfWork';
import { 
  ISensorDataRepository, 
  IUserRepository, 
  IDoorEventRepository, 
  IVideoRecordingRepository 
} from '../interfaces/IRepository';

import { MockGPIOService, MockSensorService, MockDoorService, MockVideoService } from './MockGPIOService';
import { UnitOfWorkFactory } from './UnitOfWork';
import { 
  MockSensorDataRepository, 
  MockUserRepository, 
  MockDoorEventRepository, 
  MockVideoRecordingRepository 
} from './MockRepositories';

export type ServiceIdentifier = string | symbol;

export interface ServiceDescriptor {
  identifier: ServiceIdentifier;
  factory: () => any;
  singleton?: boolean;
}

export class Container {
  private services = new Map<ServiceIdentifier, ServiceDescriptor>();
  private instances = new Map<ServiceIdentifier, any>();

  /**
   * Servis kaydet
   */
  register<T>(identifier: ServiceIdentifier, factory: () => T, singleton = true): void {
    this.services.set(identifier, {
      identifier,
      factory,
      singleton
    });
  }

  /**
   * Servis çözümle
   */
  resolve<T>(identifier: ServiceIdentifier): T {
    const descriptor = this.services.get(identifier);
    if (!descriptor) {
      throw new Error(`Service not registered: ${String(identifier)}`);
    }

    // Singleton ise instance'ı döndür
    if (descriptor.singleton && this.instances.has(identifier)) {
      return this.instances.get(identifier);
    }

    // Yeni instance oluştur
    const instance = descriptor.factory();
    
    // Singleton ise cache'le
    if (descriptor.singleton) {
      this.instances.set(identifier, instance);
    }

    return instance;
  }

  /**
   * Servis kayıtlı mı kontrol et
   */
  isRegistered(identifier: ServiceIdentifier): boolean {
    return this.services.has(identifier);
  }

  /**
   * Tüm servisleri temizle
   */
  clear(): void {
    this.services.clear();
    this.instances.clear();
  }
}

// Service Identifiers
export const SERVICE_IDENTIFIERS = {
  // GPIO Services
  GPIO_SERVICE: Symbol('IGPIOService'),
  SENSOR_SERVICE: Symbol('ISensorService'),
  DOOR_SERVICE: Symbol('IDoorService'),
  VIDEO_SERVICE: Symbol('IVideoService'),

  // Repositories
  SENSOR_DATA_REPOSITORY: Symbol('ISensorDataRepository'),
  USER_REPOSITORY: Symbol('IUserRepository'),
  DOOR_EVENT_REPOSITORY: Symbol('IDoorEventRepository'),
  VIDEO_RECORDING_REPOSITORY: Symbol('IVideoRecordingRepository'),

  // Unit of Work
  UNIT_OF_WORK_FACTORY: Symbol('IUnitOfWorkFactory'),
} as const;

/**
 * Container'ı yapılandır
 */
export function configureContainer(container: Container): void {
  // Mock Services (Raspberry Pi gelmeden önce)
  container.register(
    SERVICE_IDENTIFIERS.GPIO_SERVICE,
    () => new MockGPIOService(),
    true
  );

  container.register(
    SERVICE_IDENTIFIERS.SENSOR_SERVICE,
    () => new MockSensorService(),
    true
  );

  container.register(
    SERVICE_IDENTIFIERS.DOOR_SERVICE,
    () => new MockDoorService(),
    true
  );

  container.register(
    SERVICE_IDENTIFIERS.VIDEO_SERVICE,
    () => new MockVideoService(),
    true
  );

  // Repositories (Mock implementasyonlar)
  container.register(
    SERVICE_IDENTIFIERS.SENSOR_DATA_REPOSITORY,
    () => new MockSensorDataRepository(),
    true
  );

  container.register(
    SERVICE_IDENTIFIERS.USER_REPOSITORY,
    () => new MockUserRepository(),
    true
  );

  container.register(
    SERVICE_IDENTIFIERS.DOOR_EVENT_REPOSITORY,
    () => new MockDoorEventRepository(),
    true
  );

  container.register(
    SERVICE_IDENTIFIERS.VIDEO_RECORDING_REPOSITORY,
    () => new MockVideoRecordingRepository(),
    true
  );

  // Unit of Work Factory
  container.register(
    SERVICE_IDENTIFIERS.UNIT_OF_WORK_FACTORY,
    () => new UnitOfWorkFactory(
      container.resolve(SERVICE_IDENTIFIERS.SENSOR_DATA_REPOSITORY),
      container.resolve(SERVICE_IDENTIFIERS.USER_REPOSITORY),
      container.resolve(SERVICE_IDENTIFIERS.DOOR_EVENT_REPOSITORY),
      container.resolve(SERVICE_IDENTIFIERS.VIDEO_RECORDING_REPOSITORY)
    ),
    true
  );
}

// Global container instance
export const container = new Container();
configureContainer(container);
