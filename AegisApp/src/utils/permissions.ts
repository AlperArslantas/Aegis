/**
 * AegisApp - İzin Yönetimi
 * iOS ve Android için çeşitli izin yönetimi
 */

import { Platform, Alert, PermissionsAndroid } from 'react-native';
import { request, check, PERMISSIONS, RESULTS } from 'react-native-permissions';

export interface PermissionResult {
  granted: boolean;
  canAskAgain: boolean;
  message?: string;
}

/**
 * Bildirim izni iste
 */
export const requestNotificationPermission = async (): Promise<PermissionResult> => {
  try {
    if (Platform.OS === 'android') {
      // Android için bildirim izni
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Bildirim İzni',
            message: 'Aegis güvenlik uygulaması, güvenlik uyarıları için bildirim izni gereklidir.',
            buttonNeutral: 'Daha Sonra Sor',
            buttonNegative: 'İptal',
            buttonPositive: 'İzin Ver',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return {
            granted: true,
            canAskAgain: false,
            message: 'Android bildirim izni verildi',
          };
        } else {
          return {
            granted: false,
            canAskAgain: granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ? false : true,
            message: 'Android bildirim izni reddedildi',
          };
        }
      } catch (error) {
        console.error('Android bildirim izni hatası:', error);
        return {
          granted: false,
          canAskAgain: true,
          message: 'Android bildirim izni hatası',
        };
      }
    } else {
      // iOS için react-native-permissions kullan
      try {
        console.log('iOS bildirim izni isteniyor...');
        
        const result = await request(PERMISSIONS.IOS.USER_NOTIFICATIONS);
        console.log('iOS bildirim izni sonucu:', result);

        switch (result) {
          case RESULTS.GRANTED:
            return {
              granted: true,
              canAskAgain: false,
              message: 'iOS bildirim izni gerçekten verildi',
            };
          case RESULTS.DENIED:
            return {
              granted: false,
              canAskAgain: true,
              message: 'iOS bildirim izni reddedildi',
            };
          case RESULTS.BLOCKED:
            return {
              granted: false,
              canAskAgain: false,
              message: 'iOS bildirim izni bloke edildi - ayarlardan etkinleştirin',
            };
          case RESULTS.UNAVAILABLE:
            return {
              granted: false,
              canAskAgain: false,
              message: 'iOS bildirim izni mevcut değil',
            };
          default:
            return {
              granted: false,
              canAskAgain: true,
              message: 'iOS bildirim izni bilinmeyen durum',
            };
        }
      } catch (error) {
        console.error('iOS bildirim izni hatası:', error);
        return {
          granted: false,
          canAskAgain: true,
          message: `iOS bildirim izni hatası: ${error}`,
        };
      }
    }
  } catch (error) {
    console.error('Bildirim izni genel hatası:', error);
    return {
      granted: false,
      canAskAgain: true,
      message: `Bildirim izni hatası: ${error}`,
    };
  }
};

/**
 * Mevcut bildirim izni durumunu kontrol et
 */
export const checkNotificationPermission = async (): Promise<PermissionResult> => {
  try {
    if (Platform.OS === 'android') {
      // Android için izin kontrolü
      try {
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        
        return {
          granted: hasPermission,
          canAskAgain: !hasPermission,
          message: hasPermission ? 'Android bildirim izni aktif' : 'Android bildirim izni gerekli',
        };
      } catch (error) {
        console.error('Android izin kontrol hatası:', error);
        return {
          granted: false,
          canAskAgain: true,
          message: 'Android izin kontrol hatası',
        };
      }
    } else {
      // iOS için react-native-permissions kontrolü
      try {
        console.log('iOS bildirim izni kontrol ediliyor...');
        
        const result = await check(PERMISSIONS.IOS.USER_NOTIFICATIONS);
        console.log('iOS bildirim izni kontrol sonucu:', result);
        
        switch (result) {
          case RESULTS.GRANTED:
            return {
              granted: true,
              canAskAgain: false,
              message: 'iOS bildirim izni zaten verilmiş',
            };
          case RESULTS.DENIED:
            return {
              granted: false,
              canAskAgain: true,
              message: 'iOS bildirim izni henüz verilmemiş',
            };
          case RESULTS.BLOCKED:
            return {
              granted: false,
              canAskAgain: false,
              message: 'iOS bildirim izni bloke edilmiş',
            };
          case RESULTS.UNAVAILABLE:
            return {
              granted: false,
              canAskAgain: false,
              message: 'iOS bildirim izni mevcut değil',
            };
          default:
            return {
              granted: false,
              canAskAgain: true,
              message: 'iOS bildirim izni bilinmeyen durum',
            };
        }
      } catch (error) {
        console.error('iOS izin kontrol hatası:', error);
        return {
          granted: false,
          canAskAgain: true,
          message: `iOS izin kontrol hatası: ${error}`,
        };
      }
    }
  } catch (error) {
    console.error('Bildirim izni kontrol genel hatası:', error);
    return {
      granted: false,
      canAskAgain: true,
      message: `Bildirim izni kontrol hatası: ${error}`,
    };
  }
};

/**
 * Kullanıcıya bildirim izni dialog'u göster
 */
export const showNotificationPermissionDialog = (): Promise<PermissionResult> => {
  return new Promise((resolve) => {
    Alert.alert(
      'Bildirim İzni',
      'Aegis güvenlik uygulaması, güvenlik uyarıları ve sistem bildirimleri için bildirim izni gereklidir. İzin verilsin mi?',
      [
        {
          text: 'İptal',
          style: 'cancel',
          onPress: () => resolve({
            granted: false,
            canAskAgain: true,
            message: 'Kullanıcı izni reddetti',
          }),
        },
        {
          text: 'İzin Ver',
          onPress: async () => {
            const result = await requestNotificationPermission();
            resolve(result);
          },
        },
      ]
    );
  });
};