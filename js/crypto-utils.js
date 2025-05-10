/**
 * أدوات التشفير وفك التشفير للمحتوى
 * يستخدم للحماية المتقدمة للفيديوهات والمحتوى
 */

class CryptoUtils {
  /**
   * إنشاء مفتاح تشفير من كلمة سر
   * @param {string} password - كلمة السر المستخدمة لإنشاء المفتاح
   * @returns {Promise<CryptoKey>} - مفتاح التشفير
   */
  static async generateKey(password) {
    // تحويل كلمة السر إلى بيانات ثنائية
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    
    // استخراج مفتاح من كلمة السر
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      passwordData,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    // إنشاء مفتاح AES-GCM
    const salt = encoder.encode('secure-video-player-salt');
    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
  
  /**
   * تشفير نص
   * @param {string} text - النص المراد تشفيره
   * @param {string} password - كلمة السر المستخدمة للتشفير
   * @returns {Promise<string>} - النص المشفر بتنسيق Base64
   */
  static async encrypt(text, password) {
    try {
      const key = await this.generateKey(password);
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      
      // إنشاء متجه التهيئة (IV)
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      // تشفير البيانات
      const encryptedData = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );
      
      // دمج IV مع البيانات المشفرة
      const result = new Uint8Array(iv.length + encryptedData.byteLength);
      result.set(iv);
      result.set(new Uint8Array(encryptedData), iv.length);
      
      // تحويل النتيجة إلى Base64
      return btoa(String.fromCharCode(...result));
    } catch (error) {
      console.error('خطأ في التشفير:', error);
      return null;
    }
  }
  
  /**
   * فك تشفير نص
   * @param {string} encryptedText - النص المشفر بتنسيق Base64
   * @param {string} password - كلمة السر المستخدمة لفك التشفير
   * @returns {Promise<string>} - النص الأصلي بعد فك التشفير
   */
  static async decrypt(encryptedText, password) {
    try {
      const key = await this.generateKey(password);
      
      // تحويل النص المشفر من Base64 إلى مصفوفة بايت
      const encryptedData = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
      
      // استخراج IV من البيانات المشفرة
      const iv = encryptedData.slice(0, 12);
      const ciphertext = encryptedData.slice(12);
      
      // فك تشفير البيانات
      const decryptedData = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );
      
      // تحويل البيانات المفكوكة إلى نص
      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error('خطأ في فك التشفير:', error);
      return null;
    }
  }
  
  /**
   * تشفير كائن JSON
   * @param {Object} obj - الكائن المراد تشفيره
   * @param {string} password - كلمة السر المستخدمة للتشفير
   * @returns {Promise<string>} - النص المشفر بتنسيق Base64
   */
  static async encryptObject(obj, password) {
    const jsonString = JSON.stringify(obj);
    return this.encrypt(jsonString, password);
  }
  
  /**
   * فك تشفير كائن JSON
   * @param {string} encryptedText - النص المشفر بتنسيق Base64
   * @param {string} password - كلمة السر المستخدمة لفك التشفير
   * @returns {Promise<Object>} - الكائن الأصلي بعد فك التشفير
   */
  static async decryptObject(encryptedText, password) {
    const jsonString = await this.decrypt(encryptedText, password);
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('خطأ في تحليل JSON:', error);
      return null;
    }
  }
  
  /**
   * إنشاء توقيع أمني للتحقق من صحة البيانات
   * @param {string} data - البيانات المراد توقيعها
   * @param {string} secret - المفتاح السري للتوقيع
   * @returns {Promise<string>} - التوقيع بتنسيق Base64
   */
  static async sign(data, secret) {
    const encoder = new TextEncoder();
    const secretData = encoder.encode(secret);
    const dataToSign = encoder.encode(data);
    
    // إنشاء مفتاح HMAC
    const key = await window.crypto.subtle.importKey(
      'raw',
      secretData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // إنشاء التوقيع
    const signature = await window.crypto.subtle.sign(
      'HMAC',
      key,
      dataToSign
    );
    
    // تحويل التوقيع إلى Base64
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }
  
  /**
   * التحقق من صحة التوقيع
   * @param {string} data - البيانات الأصلية
   * @param {string} signature - التوقيع بتنسيق Base64
   * @param {string} secret - المفتاح السري للتوقيع
   * @returns {Promise<boolean>} - صحة التوقيع
   */
  static async verify(data, signature, secret) {
    const calculatedSignature = await this.sign(data, secret);
    return calculatedSignature === signature;
  }
}
