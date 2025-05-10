/**
 * أداة تشويش الكود لحماية الكود المصدري
 * تستخدم لجعل الكود صعب القراءة والفهم
 */

class CodeObfuscator {
  /**
   * تشويش اسم متغير
   * @param {string} name - اسم المتغير
   * @returns {string} - اسم المتغير المشوش
   */
  static obfuscateVariableName(name) {
    // تحويل الاسم إلى مجموعة من الأحرف العشوائية
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz$_';
    let result = '';
    
    // إنشاء اسم عشوائي بنفس طول الاسم الأصلي
    for (let i = 0; i < name.length + 5; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      result += charset[randomIndex];
    }
    
    return result;
  }
  
  /**
   * تشويش سلسلة نصية
   * @param {string} str - السلسلة النصية
   * @returns {string} - تعبير JavaScript يمثل السلسلة النصية
   */
  static obfuscateString(str) {
    // تحويل السلسلة النصية إلى تمثيل ASCII
    let result = '';
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      result += '\\x' + charCode.toString(16).padStart(2, '0');
    }
    
    return `"${result}"`;
  }
  
  /**
   * تشويش كود JavaScript
   * @param {string} code - الكود المراد تشويشه
   * @returns {string} - الكود المشوش
   */
  static obfuscateCode(code) {
    // هذه نسخة مبسطة للتشويش، في الإنتاج نستخدم مكتبات متخصصة
    
    // إضافة تعليقات مضللة
    const misleadingComments = [
      '/* This is not the actual code */',
      '/* Decoy function */',
      '/* Anti-debugging mechanism */',
      '/* Security layer */',
      '/* Encrypted content */'
    ];
    
    // إضافة متغيرات وهمية
    const decoyVariables = [
      'var _0x1a2b3c = function() { return false; };',
      'var _0x3c2b1a = { secure: true, key: "********" };',
      'var _0x7f8e9d = new Date().getTime();',
      'var _0x2e3d4c = window.location.href;',
      'var _0x5f6e7d = document.referrer;'
    ];
    
    // إضافة وظائف مضادة للتصحيح
    const antiDebuggingCode = `
      (function() {
        setInterval(function() {
          const start = new Date();
          debugger;
          const end = new Date();
          if (end - start > 100) {
            document.body.innerHTML = '';
            window.location.href = '/error';
          }
        }, 1000);
      })();
    `;
    
    // دمج كل شيء معًا
    let obfuscatedCode = '';
    obfuscatedCode += misleadingComments[Math.floor(Math.random() * misleadingComments.length)] + '\n';
    obfuscatedCode += '(function() {\n';
    
    // إضافة متغيرات وهمية
    for (let i = 0; i < 3; i++) {
      obfuscatedCode += '  ' + decoyVariables[Math.floor(Math.random() * decoyVariables.length)] + '\n';
    }
    
    // إضافة الكود الأصلي
    obfuscatedCode += '  ' + code.replace(/\n/g, '\n  ') + '\n';
    
    // إضافة المزيد من المتغيرات الوهمية
    for (let i = 0; i < 2; i++) {
      obfuscatedCode += '  ' + decoyVariables[Math.floor(Math.random() * decoyVariables.length)] + '\n';
    }
    
    // إضافة كود مضاد للتصحيح
    obfuscatedCode += antiDebuggingCode;
    
    obfuscatedCode += '})();';
    
    return obfuscatedCode;
  }
  
  /**
   * تشويش كائن JavaScript
   * @param {Object} obj - الكائن المراد تشويشه
   * @returns {string} - تمثيل مشوش للكائن
   */
  static obfuscateObject(obj) {
    // تحويل الكائن إلى سلسلة نصية
    const jsonString = JSON.stringify(obj);
    
    // تشويش السلسلة النصية
    return this.obfuscateString(jsonString);
  }
  
  /**
   * إنشاء دالة مشوشة
   * @param {Function} func - الدالة المراد تشويشها
   * @returns {Function} - دالة مشوشة تؤدي نفس الوظيفة
   */
  static obfuscateFunction(func) {
    // تحويل الدالة إلى سلسلة نصية
    const funcString = func.toString();
    
    // تشويش السلسلة النصية
    const obfuscatedString = this.obfuscateCode(funcString);
    
    // إنشاء دالة جديدة من السلسلة المشوشة
    return new Function('return ' + obfuscatedString)();
  }
}
