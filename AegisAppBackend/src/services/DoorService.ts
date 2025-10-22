/**
 * Door Service
 * Kapı kontrolü ve zil yönetimi business logic katmanı
 */

import { IDoorService } from '../interfaces/IGPIOService';
import { IDoorEventRepository, DoorEvent, DoorEventType } from '../interfaces/IRepository';
import { IUnitOfWork } from '../interfaces/IUnitOfWork';

export class DoorService {
  constructor(
    private doorService: IDoorService,
    private unitOfWorkFactory: any
  ) {}

  /**
   * Kapıyı aç
   */
  async unlockDoor(userId?: string): Promise<void> {
    const unitOfWork = await this.unitOfWorkFactory.create();
    try {
      await unitOfWork.beginTransaction();

      // Kapıyı aç
      await this.doorService.unlockDoor();

      // Olayı kaydet
      const doorEvent: Omit<DoorEvent, 'id'> = {
        eventType: 'unlock',
        isAnswered: true,
        timestamp: new Date(),
        userId
      };

      await unitOfWork.doorEventRepository.create(doorEvent);
      await unitOfWork.commit();

      console.log('🔓 Door unlocked successfully');
    } catch (error) {
      await unitOfWork.rollback();
      throw error;
    }
  }

  /**
   * Kapıyı kilitle
   */
  async lockDoor(userId?: string): Promise<void> {
    const unitOfWork = await this.unitOfWorkFactory.create();
    try {
      await unitOfWork.beginTransaction();

      // Kapıyı kilitle
      await this.doorService.lockDoor();

      // Olayı kaydet
      const doorEvent: Omit<DoorEvent, 'id'> = {
        eventType: 'lock',
        isAnswered: true,
        timestamp: new Date(),
        userId
      };

      await unitOfWork.doorEventRepository.create(doorEvent);
      await unitOfWork.commit();

      console.log('🔒 Door locked successfully');
    } catch (error) {
      await unitOfWork.rollback();
      throw error;
    }
  }

  /**
   * Kapı zilini çal
   */
  async ringDoorbell(caller?: string): Promise<void> {
    const unitOfWork = await this.unitOfWorkFactory.create();
    try {
      await unitOfWork.beginTransaction();

      // Zili çal
      await this.doorService.ringDoorbell();

      // Olayı kaydet
      const doorEvent: Omit<DoorEvent, 'id'> = {
        eventType: 'ring',
        caller: caller || 'Unknown',
        isAnswered: false,
        timestamp: new Date()
      };

      await unitOfWork.doorEventRepository.create(doorEvent);
      await unitOfWork.commit();

      console.log(`🔔 Doorbell rang by: ${caller || 'Unknown'}`);
      
      // TODO: Push notification gönder
      // TODO: Video kaydı başlat
    } catch (error) {
      await unitOfWork.rollback();
      throw error;
    }
  }

  /**
   * Kapı durumunu kontrol et
   */
  async getDoorStatus(): Promise<{
    isLocked: boolean;
    isRinging: boolean;
    lastEvent?: DoorEvent;
  }> {
    const isLocked = await this.doorService.isDoorLocked();
    const isRinging = await this.doorService.isDoorbellRinging();
    
    // Son olayı getir
    const unitOfWork = await this.unitOfWorkFactory.create();
    const recentEvents = await unitOfWork.doorEventRepository.findByDateRange(
      new Date(Date.now() - 24 * 60 * 60 * 1000), // Son 24 saat
      new Date()
    );
    
    const lastEvent = recentEvents.length > 0 ? recentEvents[recentEvents.length - 1] : undefined;

    return {
      isLocked,
      isRinging,
      ...(lastEvent && { lastEvent })
    };
  }

  /**
   * Cevaplanmamış çağrıları getir
   */
  async getUnansweredCalls(): Promise<DoorEvent[]> {
    const unitOfWork = await this.unitOfWorkFactory.create();
    return await unitOfWork.doorEventRepository.findUnansweredCalls();
  }

  /**
   * Kapı olaylarını tarih aralığına göre getir
   */
  async getDoorEventsByDateRange(startDate: Date, endDate: Date): Promise<DoorEvent[]> {
    const unitOfWork = await this.unitOfWorkFactory.create();
    return await unitOfWork.doorEventRepository.findByDateRange(startDate, endDate);
  }

  /**
   * Kapı olaylarını tipine göre getir
   */
  async getDoorEventsByType(type: DoorEventType): Promise<DoorEvent[]> {
    const unitOfWork = await this.unitOfWorkFactory.create();
    return await unitOfWork.doorEventRepository.findByEventType(type);
  }

  /**
   * Çağrıyı cevapla
   */
  async answerCall(eventId: string, userId: string): Promise<void> {
    const unitOfWork = await this.unitOfWorkFactory.create();
    try {
      await unitOfWork.beginTransaction();

      const event = await unitOfWork.doorEventRepository.findById(eventId);
      if (!event) {
        throw new Error('Door event not found');
      }

      if (event.eventType !== 'ring') {
        throw new Error('Event is not a doorbell ring');
      }

      // Olayı cevaplandı olarak işaretle
      const updatedEvent = await unitOfWork.doorEventRepository.update(eventId, {
        isAnswered: true,
        userId
      });

      await unitOfWork.commit();

      console.log(`📞 Call answered by user: ${userId}`);
    } catch (error) {
      await unitOfWork.rollback();
      throw error;
    }
  }

  /**
   * Kapı güvenlik durumunu kontrol et
   */
  async checkDoorSecurity(): Promise<{
    isSecure: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    try {
      const isLocked = await this.doorService.isDoorLocked();
      
      if (!isLocked) {
        issues.push('Door is unlocked');
      }

      // Son 24 saatteki olayları kontrol et
      const recentEvents = await this.getDoorEventsByDateRange(
        new Date(Date.now() - 24 * 60 * 60 * 1000),
        new Date()
      );

      const unansweredCalls = recentEvents.filter(event => 
        event.eventType === 'ring' && !event.isAnswered
      );

      if (unansweredCalls.length > 5) {
        issues.push('Too many unanswered calls');
      }

      return {
        isSecure: issues.length === 0,
        issues
      };
    } catch (error) {
      issues.push('Unable to check door status');
      return {
        isSecure: false,
        issues
      };
    }
  }
}
