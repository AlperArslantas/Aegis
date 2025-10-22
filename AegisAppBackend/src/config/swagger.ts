/**
 * Swagger Configuration
 * API dokümantasyonu için Swagger ayarları
 */

import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Aegis App Backend API',
      version: '1.0.0',
      description: 'Akıllı kapı zili ve yangın tespit sistemi için REST API',
      contact: {
        name: 'Aegis Team',
        email: 'support@aegis.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.aegis.com',
        description: 'Production server'
      }
    ],
    components: {
      schemas: {
        SensorData: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Sensör verisi benzersiz ID'
            },
            temperature: {
              type: 'number',
              description: 'Sıcaklık değeri (°C)',
              example: 24.5
            },
            humidity: {
              type: 'number',
              description: 'Nem değeri (%)',
              example: 45.2
            },
            airQuality: {
              type: 'string',
              enum: ['excellent', 'good', 'moderate', 'poor', 'hazardous'],
              description: 'Hava kalitesi durumu',
              example: 'good'
            },
            fireDetected: {
              type: 'boolean',
              description: 'Yangın tespit edildi mi',
              example: false
            },
            motionDetected: {
              type: 'boolean',
              description: 'Hareket tespit edildi mi',
              example: false
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Veri kayıt zamanı',
              example: '2025-10-22T14:41:54.945Z'
            }
          }
        },
        DoorStatus: {
          type: 'object',
          properties: {
            isLocked: {
              type: 'boolean',
              description: 'Kapı kilitli mi',
              example: true
            },
            isRinging: {
              type: 'boolean',
              description: 'Kapı zili çalıyor mu',
              example: false
            },
            lastEvent: {
              type: 'object',
              description: 'Son kapı olayı',
              properties: {
                id: { type: 'string' },
                eventType: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        DoorEvent: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Olay benzersiz ID'
            },
            eventType: {
              type: 'string',
              enum: ['ring', 'unlock', 'lock', 'motion_detected'],
              description: 'Olay tipi',
              example: 'ring'
            },
            caller: {
              type: 'string',
              description: 'Çağıran kişi',
              example: 'Test User'
            },
            isAnswered: {
              type: 'boolean',
              description: 'Çağrı cevaplandı mı',
              example: false
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Olay zamanı',
              example: '2025-10-22T14:42:06.274Z'
            },
            userId: {
              type: 'string',
              description: 'İşlemi yapan kullanıcı ID'
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'İşlem başarılı mı',
              example: true
            },
            message: {
              type: 'string',
              description: 'İşlem mesajı',
              example: 'Operation completed successfully'
            },
            data: {
              type: 'object',
              description: 'Dönen veri'
            },
            error: {
              type: 'string',
              description: 'Hata mesajı (sadece development)'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            error: {
              type: 'string',
              description: 'Detaylı hata (sadece development)'
            }
          }
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Health',
        description: 'Sistem sağlık kontrolü'
      },
      {
        name: 'Sensors',
        description: 'Sensör verileri yönetimi'
      },
      {
        name: 'Door',
        description: 'Kapı kontrolü ve zil yönetimi'
      }
    ]
  },
  apis: ['./src/controllers/*.ts', './src/routes/*.ts'], // API route dosyaları
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: any): void => {
  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Aegis API Documentation'
  }));

  // JSON format
  app.get('/api-docs.json', (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};

export default specs;
