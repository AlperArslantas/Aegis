/**
 * Repository Interfaces
 * Data access layer için temel interface'ler
 */

export interface IRepository<T, ID> {
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(entity: Omit<T, 'id'>): Promise<T>;
  update(id: ID, entity: Partial<T>): Promise<T | null>;
  delete(id: ID): Promise<boolean>;
  count(): Promise<number>;
}

export interface ISensorDataRepository extends IRepository<SensorData, string> {
  findByDateRange(startDate: Date, endDate: Date): Promise<SensorData[]>;
  findLatest(): Promise<SensorData | null>;
  findBySensorType(type: SensorType): Promise<SensorData[]>;
}

export interface IUserRepository extends IRepository<User, string> {
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByDeviceNumber(deviceNumber: string): Promise<User | null>;
  updateLastLogin(id: string): Promise<void>;
}

export interface IDoorEventRepository extends IRepository<DoorEvent, string> {
  findByDateRange(startDate: Date, endDate: Date): Promise<DoorEvent[]>;
  findByEventType(type: DoorEventType): Promise<DoorEvent[]>;
  findUnansweredCalls(): Promise<DoorEvent[]>;
}

export interface IVideoRecordingRepository extends IRepository<VideoRecording, string> {
  findByDateRange(startDate: Date, endDate: Date): Promise<VideoRecording[]>;
  findByDuration(minDuration: number, maxDuration?: number): Promise<VideoRecording[]>;
  findUnprocessed(): Promise<VideoRecording[]>;
}

// Domain Models
export interface SensorData {
  id: string;
  temperature: number;
  humidity: number;
  airQuality: 'excellent' | 'good' | 'moderate' | 'poor' | 'hazardous';
  fireDetected: boolean;
  motionDetected: boolean;
  timestamp: Date;
  sensorType: SensorType;
}

export interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  deviceNumber: string;
  name: string;
  role: 'admin' | 'user';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DoorEvent {
  id: string;
  eventType: DoorEventType;
  caller?: string;
  isAnswered: boolean;
  timestamp: Date;
  duration?: number;
  userId?: string | undefined;
}

export interface VideoRecording {
  id: string;
  filename: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  size: number;
  isProcessed: boolean;
  thumbnailPath?: string;
}

export type SensorType = 'temperature' | 'humidity' | 'air_quality' | 'fire' | 'motion';
export type DoorEventType = 'ring' | 'unlock' | 'lock' | 'motion_detected';
