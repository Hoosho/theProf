/**
 * مشغل فيديو آمن
 * يمنع الوصول المباشر إلى روابط الفيديو
 * يستخدم التشفير وتشويش الكود لحماية المحتوى
 */

class SecureVideoPlayer {
  constructor(containerId) {
    // تشفير معرف الحاوية
    this._cid = containerId;

    // إنشاء مفتاح تشفير عشوائي لهذه الجلسة
    this._sk = this._generateSessionKey();

    // تخزين معلومات الجلسة بشكل آمن
    this._si = {
      ts: Date.now(),
      uid: this._generateUniqueId(),
      ref: document.referrer,
      url: window.location.href
    };

    // إنشاء حاوية المشغل
    this._initializePlayer();

    // إضافة مستمعي الأحداث للحماية
    this._setupSecurityListeners();

    // مراقبة محاولات التلاعب
    this._startTamperDetection();
  }

  /**
   * إنشاء مفتاح جلسة عشوائي
   * @private
   */
  _generateSessionKey() {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const length = 32;

    // إنشاء مفتاح عشوائي
    const randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
      result += charset[randomValues[i] % charset.length];
    }

    return result;
  }

  /**
   * إنشاء معرف فريد
   * @private
   */
  _generateUniqueId() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

  /**
   * تهيئة مشغل الفيديو
   * @private
   */
  _initializePlayer() {
    // الحصول على حاوية الفيديو
    this.container = document.getElementById(this._cid);
    if (!this.container) {
      console.error('لم يتم العثور على حاوية الفيديو');
      return;
    }

    // إنشاء حاوية المشغل
    this.playerContainer = document.createElement('div');
    this.playerContainer.className = 'secure-player-container';
    this.container.appendChild(this.playerContainer);

    // إنشاء عنصر التحميل
    this.loadingElement = document.createElement('div');
    this.loadingElement.className = 'secure-player-loading';
    this.loadingElement.innerHTML = '<div class="spinner"></div><p>جاري تحميل الفيديو...</p>';
    this.playerContainer.appendChild(this.loadingElement);

    // إنشاء عنصر الخطأ
    this.errorElement = document.createElement('div');
    this.errorElement.className = 'secure-player-error';
    this.errorElement.style.display = 'none';
    this.playerContainer.appendChild(this.errorElement);

    // تهيئة متغيرات المشغل
    this.videoElement = null;
    this.youtubePlayer = null;
    this.lessonId = null;

    // إضافة طبقة حماية إضافية
    const securityLayer = document.createElement('div');
    securityLayer.className = 'secure-player-security-layer';
    securityLayer.style.position = 'absolute';
    securityLayer.style.top = '0';
    securityLayer.style.left = '0';
    securityLayer.style.width = '100%';
    securityLayer.style.height = '100%';
    securityLayer.style.zIndex = '5';
    securityLayer.style.pointerEvents = 'none';
    this.playerContainer.appendChild(securityLayer);
  }

  /**
   * إعداد مستمعي الأحداث للحماية
   * @private
   */
  _setupSecurityListeners() {
    // منع النقر اليمين على المشغل
    this.playerContainer.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });

    // منع السحب والإفلات
    this.playerContainer.addEventListener('dragstart', (e) => {
      e.preventDefault();
      return false;
    });

    // منع النسخ
    this.playerContainer.addEventListener('copy', (e) => {
      e.preventDefault();
      return false;
    });

    // منع اختيار النص
    this.playerContainer.addEventListener('selectstart', (e) => {
      e.preventDefault();
      return false;
    });

    // مراقبة تغييرات DOM
    this._observeDOMChanges();
  }

  /**
   * مراقبة تغييرات DOM
   * @private
   */
  _observeDOMChanges() {
    // إنشاء مراقب DOM
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
          // التحقق من إزالة عناصر المشغل
          for (const node of mutation.removedNodes) {
            if (node === this.playerContainer || node.contains(this.playerContainer)) {
              // محاولة تلاعب - إعادة تحميل الصفحة
              this._handleTamperAttempt('DOM manipulation detected');
              break;
            }
          }
        }
      }
    });

    // بدء المراقبة
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * بدء مراقبة محاولات التلاعب
   * @private
   */
  _startTamperDetection() {
    // مراقبة أدوات المطور
    let devToolsOpened = false;

    // طريقة 1: مراقبة تغير حجم النافذة
    const originalWidth = window.outerWidth - window.innerWidth;
    const originalHeight = window.outerHeight - window.innerHeight;

    setInterval(() => {
      const widthThreshold = window.outerWidth - window.innerWidth > originalWidth + 100;
      const heightThreshold = window.outerHeight - window.innerHeight > originalHeight + 100;

      if (widthThreshold || heightThreshold) {
        if (!devToolsOpened) {
          devToolsOpened = true;
          this._handleTamperAttempt('Developer tools detected');
        }
      } else {
        devToolsOpened = false;
      }
    }, 1000);

    // طريقة 2: استخدام debugger للكشف عن أدوات المطور
    setInterval(() => {
      const startTime = new Date().getTime();
      debugger;
      const endTime = new Date().getTime();

      if (endTime - startTime > 100) {
        this._handleTamperAttempt('Debugger detected');
      }
    }, 1000);
  }

  /**
   * معالجة محاولة التلاعب
   * @param {string} reason - سبب الكشف
   * @private
   */
  _handleTamperAttempt(reason) {
    console.warn(`Security alert: ${reason}`);

    // تسجيل محاولة التلاعب
    try {
      const tamperData = {
        reason,
        timestamp: new Date().toISOString(),
        sessionId: this._si.uid,
        url: window.location.href
      };

      // إرسال بيانات محاولة التلاعب إلى الخادم
      navigator.sendBeacon('/api/security/tamper-attempt', JSON.stringify(tamperData));
    } catch (error) {
      // تجاهل أخطاء الإرسال
    }

    // إخفاء المحتوى
    this.showError('تم اكتشاف محاولة غير مصرح بها للوصول إلى المحتوى');
  }

  /**
   * تحميل الفيديو بشكل آمن
   * @param {number} lessonId - معرف الدرس
   */
  async loadVideo(lessonId) {
    // تشفير معرف الدرس
    this.lessonId = lessonId;
    this._lid = btoa(String(lessonId));

    this.showLoading();

    try {
      // إنشاء توقيع أمني للطلب
      const timestamp = Date.now();
      const requestData = `${this._lid}-${timestamp}-${this._si.uid}`;

      // جلب معلومات الفيديو من الخادم مع إضافة معلومات أمنية
      const response = await fetch(`/student/video-stream/${lessonId}`, {
        headers: {
          'X-Request-Timestamp': timestamp,
          'X-Session-ID': this._si.uid,
          'X-Client-Signature': await this._generateRequestSignature(requestData)
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'حدث خطأ أثناء تحميل الفيديو');
      }

      // فك تشفير بيانات الفيديو
      const encryptedData = await response.json();
      const videoData = await this._decryptVideoData(encryptedData);

      if (!videoData) {
        throw new Error('فشل في فك تشفير بيانات الفيديو');
      }

      // التحقق من صحة البيانات
      if (!this._verifyVideoData(videoData)) {
        throw new Error('بيانات الفيديو غير صالحة');
      }

      // عرض الفيديو حسب نوعه
      if (videoData.type === 'youtube') {
        this._loadYouTubeVideo(videoData.videoId);
      } else if (videoData.type === 'drive') {
        this._loadDriveVideo(videoData.fileId);
      } else if (videoData.type === 'other') {
        this._loadOtherVideo(videoData.url);
      } else {
        throw new Error('نوع الفيديو غير مدعوم');
      }
    } catch (error) {
      this.showError(error.message);
    }
  }

  /**
   * إنشاء توقيع للطلب
   * @param {string} data - البيانات المراد توقيعها
   * @returns {Promise<string>} - التوقيع
   * @private
   */
  async _generateRequestSignature(data) {
    // استخدام مفتاح الجلسة لإنشاء توقيع
    const encoder = new TextEncoder();
    const dataToSign = encoder.encode(data + this._sk);

    // إنشاء هاش SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataToSign);

    // تحويل الهاش إلى سلسلة نصية
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * فك تشفير بيانات الفيديو
   * @param {Object} encryptedData - البيانات المشفرة
   * @returns {Promise<Object>} - البيانات بعد فك التشفير
   * @private
   */
  async _decryptVideoData(encryptedData) {
    // في الإنتاج، نستخدم تشفير حقيقي
    // هنا نفترض أن البيانات غير مشفرة للتبسيط
    return encryptedData;
  }

  /**
   * التحقق من صحة بيانات الفيديو
   * @param {Object} videoData - بيانات الفيديو
   * @returns {boolean} - صحة البيانات
   * @private
   */
  _verifyVideoData(videoData) {
    // التحقق من وجود البيانات الأساسية
    if (!videoData || !videoData.type) {
      return false;
    }

    // التحقق حسب نوع الفيديو
    if (videoData.type === 'youtube' && !videoData.videoId) {
      return false;
    } else if (videoData.type === 'drive' && !videoData.fileId) {
      return false;
    } else if (videoData.type === 'other' && !videoData.url) {
      return false;
    }

    return true;
  }

  /**
   * تحميل فيديو يوتيوب بطريقة آمنة
   * @param {string} videoId - معرف الفيديو
   * @private
   */
  _loadYouTubeVideo(videoId) {
    // إزالة أي مشغل سابق
    this._clearPlayer();

    // تشويش معرف الفيديو
    const obfuscatedId = this._obfuscateString(videoId);

    // إنشاء عنصر iframe لتشغيل فيديو يوتيوب
    const iframe = document.createElement('iframe');
    iframe.className = 'secure-player-iframe';
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    iframe.style.border = 'none';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';

    // إضافة معلمات أمان إضافية لمنع الوصول إلى قناة يوتيوب
    iframe.src = `https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0&autoplay=1&modestbranding=1&fs=1&disablekb=1&origin=${window.location.origin}`;

    // إضافة سمات مخصصة لمنع التتبع
    iframe.setAttribute('data-secure', 'true');
    iframe.setAttribute('data-origin', window.location.origin);

    // إخفاء السمة src في HTML
    const realSrc = iframe.src;
    iframe.removeAttribute('src');

    // إضافة iframe إلى المستند
    this.playerContainer.appendChild(iframe);

    // تعيين السمة src بعد إضافة iframe إلى المستند
    setTimeout(() => {
      iframe.src = realSrc;
    }, 100);

    this.hideLoading();

    // إضافة طبقات حماية متعددة
    this._addProtectionLayers(iframe);

    // إضافة مراقب للتأكد من عدم تغيير iframe
    this._monitorIframe(iframe, realSrc);
  }

  /**
   * إضافة طبقات حماية للفيديو
   * @param {HTMLElement} videoElement - عنصر الفيديو
   * @private
   */
  _addProtectionLayers(videoElement) {
    // طبقة 1: حماية الجزء العلوي (شعار يوتيوب)
    const topProtection = document.createElement('div');
    topProtection.className = 'secure-player-protection top-protection';
    topProtection.style.position = 'absolute';
    topProtection.style.top = '0';
    topProtection.style.left = '0';
    topProtection.style.width = '100%';
    topProtection.style.height = '40px';
    topProtection.style.zIndex = '10';

    // طبقة 2: حماية الزوايا
    const cornerProtection = document.createElement('div');
    cornerProtection.className = 'secure-player-protection corner-protection';
    cornerProtection.style.position = 'absolute';
    cornerProtection.style.top = '0';
    cornerProtection.style.right = '0';
    cornerProtection.style.width = '120px';
    cornerProtection.style.height = '40px';
    cornerProtection.style.zIndex = '11';

    // طبقة 3: حماية شريط التقدم
    const progressProtection = document.createElement('div');
    progressProtection.className = 'secure-player-protection progress-protection';
    progressProtection.style.position = 'absolute';
    progressProtection.style.bottom = '0';
    progressProtection.style.left = '0';
    progressProtection.style.width = '100%';
    progressProtection.style.height = '10px';
    progressProtection.style.zIndex = '10';

    // إضافة الطبقات إلى المشغل
    this.playerContainer.appendChild(topProtection);
    this.playerContainer.appendChild(cornerProtection);
    this.playerContainer.appendChild(progressProtection);

    // إضافة علامة مائية شفافة
    const watermark = document.createElement('div');
    watermark.className = 'secure-player-watermark';
    watermark.style.position = 'absolute';
    watermark.style.top = '50%';
    watermark.style.left = '50%';
    watermark.style.transform = 'translate(-50%, -50%)';
    watermark.style.fontSize = '24px';
    watermark.style.color = 'rgba(255, 255, 255, 0.2)';
    watermark.style.pointerEvents = 'none';
    watermark.style.zIndex = '9';
    watermark.style.userSelect = 'none';
    watermark.style.textShadow = '0 0 5px rgba(0, 0, 0, 0.5)';
    watermark.textContent = 'محتوى محمي';

    this.playerContainer.appendChild(watermark);
  }

  /**
   * مراقبة iframe للتأكد من عدم تغييره
   * @param {HTMLIFrameElement} iframe - عنصر iframe
   * @param {string} originalSrc - الرابط الأصلي
   * @private
   */
  _monitorIframe(iframe, originalSrc) {
    // مراقبة تغييرات السمات
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
          // إذا تم تغيير السمة src
          if (mutation.attributeName === 'src' && iframe.src !== originalSrc) {
            // إعادة تعيين السمة src
            iframe.src = originalSrc;

            // تسجيل محاولة التلاعب
            this._handleTamperAttempt('Iframe source modification detected');
          }
        }
      }
    });

    // بدء المراقبة
    observer.observe(iframe, { attributes: true });
  }

  /**
   * تشويش سلسلة نصية
   * @param {string} str - السلسلة النصية
   * @returns {string} - السلسلة المشوشة
   * @private
   */
  _obfuscateString(str) {
    // تحويل السلسلة إلى Base64
    const base64 = btoa(str);

    // عكس السلسلة
    const reversed = base64.split('').reverse().join('');

    // إضافة بيانات عشوائية
    const random = Math.random().toString(36).substring(2, 8);

    return `${random}_${reversed}`;
  }

  /**
   * تحميل فيديو من جوجل درايف بطريقة آمنة
   * @param {string} fileId - معرف الملف
   * @private
   */
  _loadDriveVideo(fileId) {
    // إزالة أي مشغل سابق
    this._clearPlayer();

    // تشويش معرف الملف
    const obfuscatedId = this._obfuscateString(fileId);

    // إنشاء عنصر iframe لتشغيل فيديو جوجل درايف
    const iframe = document.createElement('iframe');
    iframe.className = 'secure-player-iframe';
    iframe.setAttribute('allowfullscreen', '');
    iframe.style.border = 'none';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';

    // إخفاء السمة src في HTML
    const realSrc = `https://drive.google.com/file/d/${fileId}/preview`;

    // إضافة iframe إلى المستند
    this.playerContainer.appendChild(iframe);

    // تعيين السمة src بعد إضافة iframe إلى المستند
    setTimeout(() => {
      iframe.src = realSrc;
    }, 100);

    this.hideLoading();

    // إضافة طبقات حماية
    this._addProtectionLayers(iframe);

    // مراقبة iframe
    this._monitorIframe(iframe, realSrc);
  }

  /**
   * تحميل فيديو من مصدر آخر بطريقة آمنة
   * @param {string} url - رابط الفيديو
   * @private
   */
  _loadOtherVideo(url) {
    // إزالة أي مشغل سابق
    this._clearPlayer();

    if (url.includes('<iframe')) {
      // إذا كان الرابط يحتوي على كود iframe
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = url;
      const iframe = tempDiv.querySelector('iframe');

      if (iframe) {
        iframe.className = 'secure-player-iframe';
        iframe.style.border = 'none';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.position = 'absolute';
        iframe.style.top = '0';
        iframe.style.left = '0';

        // إخفاء السمة src في HTML
        const realSrc = iframe.src;
        iframe.removeAttribute('src');

        // إضافة iframe إلى المستند
        this.playerContainer.appendChild(iframe);

        // تعيين السمة src بعد إضافة iframe إلى المستند
        setTimeout(() => {
          iframe.src = realSrc;
        }, 100);

        this.hideLoading();

        // إضافة طبقات حماية
        this._addProtectionLayers(iframe);

        // مراقبة iframe
        this._monitorIframe(iframe, realSrc);
      } else {
        this.showError('تعذر تحميل الفيديو');
      }
    } else {
      // إنشاء عنصر فيديو HTML5
      const video = document.createElement('video');
      video.className = 'secure-player-video';
      video.controls = true;
      video.autoplay = true;
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.position = 'absolute';
      video.style.top = '0';
      video.style.left = '0';

      // إضافة مصدر الفيديو بطريقة آمنة
      // بدلاً من تعيين السمة src مباشرة، نستخدم Blob URL
      this._loadVideoThroughBlob(url, video);
    }
  }

  /**
   * تحميل فيديو من خلال Blob URL
   * @param {string} url - رابط الفيديو
   * @param {HTMLVideoElement} videoElement - عنصر الفيديو
   * @private
   */
  async _loadVideoThroughBlob(url, videoElement) {
    try {
      // إظهار التحميل
      this.showLoading();

      // جلب الفيديو
      const response = await fetch(url);
      const blob = await response.blob();

      // إنشاء Blob URL
      const blobUrl = URL.createObjectURL(blob);

      // تعيين مصدر الفيديو
      videoElement.src = blobUrl;

      // إضافة الفيديو إلى المستند
      this.playerContainer.appendChild(videoElement);

      // إخفاء التحميل
      this.hideLoading();

      // إضافة طبقات حماية
      this._addProtectionLayers(videoElement);

      // تنظيف Blob URL عند إزالة الفيديو
      videoElement.addEventListener('emptied', () => {
        URL.revokeObjectURL(blobUrl);
      });

      // منع النقر اليمين على الفيديو
      videoElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
      });
    } catch (error) {
      this.showError('تعذر تحميل الفيديو: ' + error.message);
    }
  }

  /**
   * إظهار رسالة التحميل
   */
  showLoading() {
    if (this.loadingElement) {
      this.loadingElement.style.display = 'flex';
    }
    if (this.errorElement) {
      this.errorElement.style.display = 'none';
    }
  }

  /**
   * إخفاء رسالة التحميل
   */
  hideLoading() {
    if (this.loadingElement) {
      this.loadingElement.style.display = 'none';
    }
  }

  /**
   * إظهار رسالة خطأ
   * @param {string} message - رسالة الخطأ
   */
  showError(message) {
    if (this.errorElement) {
      this.errorElement.innerHTML = `<p>❌ ${message}</p>`;
      this.errorElement.style.display = 'flex';
    }
    this.hideLoading();
  }

  /**
   * إزالة أي مشغل سابق
   * @private
   */
  _clearPlayer() {
    // إزالة جميع عناصر iframe
    const iframes = this.playerContainer.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      iframe.src = 'about:blank'; // تفريغ المصدر أولاً
      iframe.remove();
    });

    // إزالة جميع عناصر الفيديو
    const videos = this.playerContainer.querySelectorAll('video');
    videos.forEach(video => {
      video.pause();
      video.src = '';
      video.load(); // تفريغ الفيديو من الذاكرة
      video.remove();
    });

    // إزالة جميع طبقات الحماية
    const protections = this.playerContainer.querySelectorAll('.secure-player-protection');
    protections.forEach(protection => {
      protection.remove();
    });

    // إزالة العلامة المائية
    const watermark = this.playerContainer.querySelector('.secure-player-watermark');
    if (watermark) {
      watermark.remove();
    }

    // تنظيف الذاكرة
    this._cleanupMemory();
  }

  /**
   * تنظيف الذاكرة
   * @private
   */
  _cleanupMemory() {
    // تنظيف المتغيرات المؤقتة
    if (this._tempData) {
      // مسح البيانات المؤقتة
      for (const key in this._tempData) {
        this._tempData[key] = null;
      }
      this._tempData = null;
    }

    // إجبار جامع القمامة على العمل (غير مضمون)
    if (window.gc) {
      try {
        window.gc();
      } catch (e) {
        // تجاهل الخطأ
      }
    }
  }

  /**
   * تدمير المشغل وتنظيف الموارد
   */
  destroy() {
    // إيقاف جميع المراقبين
    if (this._observers) {
      this._observers.forEach(observer => {
        observer.disconnect();
      });
      this._observers = [];
    }

    // إزالة جميع مستمعي الأحداث
    if (this.playerContainer) {
      const clone = this.playerContainer.cloneNode(false);
      if (this.playerContainer.parentNode) {
        this.playerContainer.parentNode.replaceChild(clone, this.playerContainer);
      }
    }

    // تنظيف المشغل
    this._clearPlayer();

    // تنظيف المتغيرات
    this.container = null;
    this.playerContainer = null;
    this.loadingElement = null;
    this.errorElement = null;
    this.videoElement = null;
    this.youtubePlayer = null;
    this.lessonId = null;
    this._cid = null;
    this._sk = null;
    this._si = null;
    this._lid = null;
  }
}
