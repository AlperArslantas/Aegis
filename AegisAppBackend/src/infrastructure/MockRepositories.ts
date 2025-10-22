/**
 * Mock Repository Implementations
 * Database implementasyonu gelmeden önce test için
 */

import { 
  ISensorDataRepository, 
  IUserRepository, 
  IDoorEventRepository, 
  IVideoRecordingRepository,
  SensorData,
  User,
  DoorEvent,
  VideoRecording,
  SensorType,
  DoorEventType
} from '../interfaces/IRepository';

export class MockSensorDataRepository implements ISensorDataRepository {
  private data: SensorData[] = [];

  async findById(id: string): Promise<SensorData | null> {
    return this.data.find(item => item.id === id) || null;
  }

  async findAll(): Promise<SensorData[]> {
    return [...this.data];
  }

  async create(entity: Omit<SensorData, 'id'>): Promise<SensorData> {
    const newEntity: SensorData = {
      ...entity,
      id: `sensor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    this.data.push(newEntity);
    return newEntity;
  }

  async update(id: string, entity: Partial<SensorData>): Promise<SensorData | null> {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    this.data[index] = { ...this.data[index], ...entity };
    return this.data[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) return false;
    
    this.data.splice(index, 1);
    return true;
  }

  async count(): Promise<number> {
    return this.data.length;
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<SensorData[]> {
    return this.data.filter(item => 
      item.timestamp >= startDate && item.timestamp <= endDate
    );
  }

  async findLatest(): Promise<SensorData | null> {
    if (this.data.length === 0) return null;
    return this.data[this.data.length - 1];
  }

  async findBySensorType(type: SensorType): Promise<SensorData[]> {
    return this.data.filter(item => item.sensorType === type);
  }
}

export class MockUserRepository implements IUserRepository {
  private data: User[] = [
    {
      id: '1',
      email: 'admin@aegis.com',
      username: 'admin',
      password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K', // password123
      deviceNumber: 'AEGIS-001',
      name: 'Sistem Yöneticisi',
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  async findById(id: string): Promise<User | null> {
    return this.data.find(item => item.id === id) || null;
  }

  async findAll(): Promise<User[]> {
    return [...this.data];
  }

  async create(entity: Omit<User, 'id'>): Promise<User> {
    const newEntity: User = {
      ...entity,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.data.push(newEntity);
    return newEntity;
  }

  async update(id: string, entity: Partial<User>): Promise<User | null> {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    this.data[index] = { ...this.data[index], ...entity, updatedAt: new Date() };
    return this.data[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) return false;
    
    this.data.splice(index, 1);
    return true;
  }

  async count(): Promise<number> {
    return this.data.length;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.data.find(item => item.email === email) || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.data.find(item => item.username === username) || null;
  }

  async findByDeviceNumber(deviceNumber: string): Promise<User | null> {
    return this.data.find(item => item.deviceNumber === deviceNumber) || null;
  }

  async updateLastLogin(id: string): Promise<void> {
    const user = await this.findById(id);
    if (user) {
      await this.update(id, { lastLogin: new Date() });
    }
  }
}

export class MockDoorEventRepository implements IDoorEventRepository {
  private data: DoorEvent[] = [];

  async findById(id: string): Promise<DoorEvent | null> {
    return this.data.find(item => item.id === id) || null;
  }

  async findAll(): Promise<DoorEvent[]> {
    return [...this.data];
  }

  async create(entity: Omit<DoorEvent, 'id'>): Promise<DoorEvent> {
    const newEntity: DoorEvent = {
      ...entity,
      id: `door_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    this.data.push(newEntity);
    return newEntity;
  }

  async update(id: string, entity: Partial<DoorEvent>): Promise<DoorEvent | null> {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    this.data[index] = { ...this.data[index], ...entity };
    return this.data[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) return false;
    
    this.data.splice(index, 1);
    return true;
  }

  async count(): Promise<number> {
    return this.data.length;
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<DoorEvent[]> {
    return this.data.filter(item => 
      item.timestamp >= startDate && item.timestamp <= endDate
    );
  }

  async findByEventType(type: DoorEventType): Promise<DoorEvent[]> {
    return this.data.filter(item => item.eventType === type);
  }

  async findUnansweredCalls(): Promise<DoorEvent[]> {
    return this.data.filter(item => 
      item.eventType === 'ring' && !item.isAnswered
    );
  }
}

export class MockVideoRecordingRepository implements IVideoRecordingRepository {
  private data: VideoRecording[] = [];

  async findById(id: string): Promise<VideoRecording | null> {
    return this.data.find(item => item.id === id) || null;
  }

  async findAll(): Promise<VideoRecording[]> {
    return [...this.data];
  }

  async create(entity: Omit<VideoRecording, 'id'>): Promise<VideoRecording> {
    const newEntity: VideoRecording = {
      ...entity,
      id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    this.data.push(newEntity);
    return newEntity;
  }

  async update(id: string, entity: Partial<VideoRecording>): Promise<VideoRecording | null> {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    this.data[index] = { ...this.data[index], ...entity };
    return this.data[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) return false;
    
    this.data.splice(index, 1);
    return true;
  }

  async count(): Promise<number> {
    return this.data.length;
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<VideoRecording[]> {
    return this.data.filter(item => 
      item.startTime >= startDate && item.endTime <= endDate
    );
  }

  async findByDuration(minDuration: number, maxDuration?: number): Promise<VideoRecording[]> {
    return this.data.filter(item => {
      if (maxDuration) {
        return item.duration >= minDuration && item.duration <= maxDuration;
      }
      return item.duration >= minDuration;
    });
  }

  async findUnprocessed(): Promise<VideoRecording[]> {
    return this.data.filter(item => !item.isProcessed);
  }
}
