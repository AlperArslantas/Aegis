/**
 * Door Controller
 * Kapı kontrolü için HTTP endpoint'leri
 */

import { Request, Response } from 'express';
import { DoorService } from '../services/DoorService';
import { container, SERVICE_IDENTIFIERS } from '../infrastructure/Container';
import { getSocketInstance } from '../utils/socketInstance';

export class DoorController {
  private doorService: DoorService;

  constructor() {
    // Dependency injection ile servisleri al
    const doorService = container.resolve(SERVICE_IDENTIFIERS.DOOR_SERVICE) as any;
    const unitOfWorkFactory = container.resolve(SERVICE_IDENTIFIERS.UNIT_OF_WORK_FACTORY) as any;
    
    // Her request için yeni UnitOfWork oluştur
    this.doorService = new DoorService(doorService, unitOfWorkFactory);
  }

  /**
   * @swagger
   * /api/door/status:
   *   get:
   *     summary: Kapı durumunu getir
   *     description: Kapının kilit durumu ve zil durumunu döndürür
   *     tags: [Door]
   *     responses:
   *       200:
   *         description: Başarılı
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/DoorStatus'
   *       500:
   *         description: Sunucu hatası
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getDoorStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await this.doorService.getDoorStatus();
      
      res.json({
        success: true,
        data: status
      });
    } catch (error: any) {
      console.error('Error getting door status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get door status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * POST /api/door/unlock
   * Kapıyı aç
   */
  async unlockDoor(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.body.userId || (req as any).user?.id;
      await this.doorService.unlockDoor(userId);
      
      // Socket.IO ile Raspberry Pi'ye kapı açma komutu gönder
      const io = getSocketInstance();
      if (io) {
        io.to('pi-cihazlari').emit('kapi-komut', true);
        console.log('✅ Kapı açma komutu gönderildi (Socket.IO: pi-cihazlari -> kapi-komut: true)');
      } else {
        console.warn('⚠️ Socket.IO instance bulunamadı, kapı komutu gönderilemedi');
      }
      
      res.json({
        success: true,
        message: 'Door unlocked successfully'
      });
    } catch (error: any) {
      console.error('Error unlocking door:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unlock door',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * POST /api/door/lock
   * Kapıyı kilitle
   */
  async lockDoor(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.body.userId || (req as any).user?.id;
      await this.doorService.lockDoor(userId);
      
      // Socket.IO ile Raspberry Pi'ye kapı kilitleme komutu gönder
      const io = getSocketInstance();
      if (io) {
        io.to('pi-cihazlari').emit('kapi-komut', false);
        console.log('✅ Kapı kilitleme komutu gönderildi (Socket.IO: pi-cihazlari -> kapi-komut: false)');
      } else {
        console.warn('⚠️ Socket.IO instance bulunamadı, kapı komutu gönderilemedi');
      }
      
      res.json({
        success: true,
        message: 'Door locked successfully'
      });
    } catch (error: any) {
      console.error('Error locking door:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to lock door',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * @swagger
   * /api/door/ring:
   *   post:
   *     summary: Kapı zilini çal
   *     description: Kapı zilini çalar ve olayı kaydeder
   *     tags: [Door]
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               caller:
   *                 type: string
   *                 description: Çağıran kişi adı
   *                 example: "Test User"
   *     responses:
   *       200:
   *         description: Başarılı
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *       500:
   *         description: Sunucu hatası
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async ringDoorbell(req: Request, res: Response): Promise<void> {
    try {
      const { caller } = req.body;
      await this.doorService.ringDoorbell(caller);
      
      res.json({
        success: true,
        message: 'Doorbell rang successfully'
      });
    } catch (error: any) {
      console.error('Error ringing doorbell:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to ring doorbell',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /api/door/calls
   * Cevaplanmamış çağrıları getir
   */
  async getUnansweredCalls(req: Request, res: Response): Promise<void> {
    try {
      const calls = await this.doorService.getUnansweredCalls();
      
      res.json({
        success: true,
        data: calls,
        count: calls.length
      });
    } catch (error: any) {
      console.error('Error getting unanswered calls:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get unanswered calls',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * POST /api/door/calls/:id/answer
   * Çağrıyı cevapla
   */
  async answerCall(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.body.userId || (req as any).user?.id;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
        return;
      }

      await this.doorService.answerCall(id, userId!);
      
      res.json({
        success: true,
        message: 'Call answered successfully'
      });
    } catch (error: any) {
      console.error('Error answering call:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to answer call',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /api/door/events
   * Kapı olaylarını getir
   */
  async getDoorEvents(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate, type } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'startDate and endDate are required'
        });
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
        return;
      }

      let events;
      if (type) {
        events = await this.doorService.getDoorEventsByType(type as any);
      } else {
        events = await this.doorService.getDoorEventsByDateRange(start, end);
      }

      res.json({
        success: true,
        data: events,
        count: events.length
      });
    } catch (error: any) {
      console.error('Error getting door events:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get door events',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /api/door/security
   * Kapı güvenlik durumunu kontrol et
   */
  async checkDoorSecurity(req: Request, res: Response): Promise<void> {
    try {
      const security = await this.doorService.checkDoorSecurity();
      
      res.json({
        success: true,
        data: security
      });
    } catch (error: any) {
      console.error('Error checking door security:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check door security',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}
