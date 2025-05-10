# دليل نشر منصة The Prof على استضافة ودومين مجاني

## 1. إعداد قاعدة بيانات MongoDB Atlas (مجانية)

1. قم بإنشاء حساب على [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. بعد تسجيل الدخول، قم بإنشاء مشروع جديد:
   - انقر على "Create a New Project"
   - أدخل اسم المشروع (مثلاً "TheProfProject")
   - انقر على "Next"
   - أضف أعضاء المشروع (اختياري)
   - انقر على "Create Project"

3. إنشاء قاعدة بيانات مجانية:
   - انقر على "Build a Database"
   - اختر "FREE" (الخطة المجانية)
   - اختر مزود السحابة والمنطقة (مثلاً AWS وأقرب منطقة لك)
   - انقر على "Create Cluster"

4. إعداد الأمان:
   - في قسم "Security" اختر "Database Access"
   - انقر على "Add New Database User"
   - أدخل اسم المستخدم وكلمة المرور (احفظهما لاستخدامهما لاحقاً)
   - اختر "Read and Write to Any Database" كصلاحيات
   - انقر على "Add User"

5. إعداد الوصول للشبكة:
   - في قسم "Security" اختر "Network Access"
   - انقر على "Add IP Address"
   - اختر "Allow Access from Anywhere" (للتبسيط، في الإنتاج يفضل تقييد الوصول)
   - انقر على "Confirm"

6. الحصول على رابط الاتصال:
   - انتقل إلى "Database" في القائمة الجانبية
   - انقر على "Connect"
   - اختر "Connect your application"
   - انسخ رابط الاتصال (سيكون بهذا الشكل: `mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`)
   - استبدل `<password>` بكلمة المرور التي أنشأتها
   - استبدل `myFirstDatabase` باسم قاعدة البيانات (مثلاً `theprof`)

## 2. تجهيز المشروع للنشر

1. إنشاء ملف `.env` في المجلد الرئيسي للمشروع:
   ```
   PORT=5000
   MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/theprof?retryWrites=true&w=majority
   JWT_SECRET=your_secure_jwt_secret
   NODE_ENV=production
   ```

2. إنشاء ملف `Procfile` في المجلد الرئيسي (لـ Render):
   ```
   web: node app.js
   ```

3. تعديل ملف `package.json` لإضافة سكريبت البدء:
   ```json
   "scripts": {
     "start": "node app.js",
     "dev": "nodemon app.js"
   }
   ```

4. تأكد من أن التطبيق يستخدم المنفذ من متغيرات البيئة:
   ```javascript
   const PORT = process.env.PORT || 5000;
   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   ```

## 3. نشر المشروع على Render.com (استضافة مجانية)

1. قم بإنشاء حساب على [Render](https://render.com/)
2. قم برفع المشروع إلى GitHub:
   - إنشاء مستودع جديد على GitHub
   - رفع المشروع إلى المستودع:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git remote add origin https://github.com/yourusername/theprof.git
     git push -u origin main
     ```

3. إنشاء خدمة جديدة على Render:
   - انقر على "New" ثم اختر "Web Service"
   - اختر "Connect to GitHub"
   - اختر المستودع الذي رفعت إليه المشروع
   - أدخل اسم الخدمة (مثلاً "theprof-api")
   - اختر "Node" كبيئة
   - أدخل `npm install` كأمر تثبيت
   - أدخل `npm start` كأمر بدء
   - أضف متغيرات البيئة (نفس محتوى ملف `.env`)
   - انقر على "Create Web Service"

4. انتظر حتى يتم نشر التطبيق (قد يستغرق بضع دقائق)
5. بعد الانتهاء، ستحصل على رابط للتطبيق بهذا الشكل: `https://theprof-api.onrender.com`

## 4. الحصول على دومين مجاني من Freenom

1. قم بزيارة [Freenom](https://www.freenom.com/)
2. ابحث عن دومين متاح (يمكنك الحصول على دومين مجاني بنطاقات .tk, .ml, .ga, .cf, .gq)
3. بعد اختيار الدومين، قم بإنشاء حساب وإكمال عملية التسجيل
4. اختر فترة مجانية (تصل إلى 12 شهر)
5. بعد إتمام التسجيل، انتقل إلى "My Domains" ثم "Manage Domain"
6. اختر "Management Tools" ثم "Nameservers"
7. اختر "Use custom nameservers" وأدخل nameservers الخاصة بـ Render:
   ```
   ns1.render.com
   ns2.render.com
   ```
8. انقر على "Change Nameservers"

## 5. ربط الدومين بخدمة Render

1. في لوحة تحكم Render، انتقل إلى خدمة الويب الخاصة بك
2. انتقل إلى تبويب "Settings"
3. انتقل إلى قسم "Custom Domain"
4. انقر على "Add Custom Domain"
5. أدخل الدومين الذي حصلت عليه من Freenom (مثلاً `theprof.tk`)
6. انقر على "Add"
7. اتبع التعليمات لإعداد سجلات DNS:
   - أضف سجل CNAME يشير إلى `theprof-api.onrender.com`
   - أضف سجل A يشير إلى عنوان IP الذي يوفره Render

## 6. بدائل أخرى للدومين المجاني

### استخدام Netlify للحصول على دومين فرعي مجاني

1. قم بإنشاء حساب على [Netlify](https://www.netlify.com/)
2. انقر على "Sites" ثم "Add new site" ثم "Deploy manually"
3. قم بإنشاء ملف HTML بسيط وارفعه
4. بعد النشر، انقر على "Domain settings"
5. قم بتغيير اسم الموقع للحصول على دومين فرعي مخصص (مثلاً `theprof.netlify.app`)
6. انتقل إلى "Redirects & rewrites"
7. أضف قاعدة إعادة توجيه لتوجيه كل الطلبات إلى خدمة Render الخاصة بك:
   ```
   /*    https://theprof-api.onrender.com/:splat    200
   ```

### استخدام GitHub Pages مع دومين فرعي مجاني

1. قم بإنشاء مستودع جديد على GitHub باسم `yourusername.github.io`
2. قم بإنشاء صفحة HTML بسيطة وارفعها إلى المستودع
3. قم بتفعيل GitHub Pages من إعدادات المستودع
4. استخدم نفس تقنية إعادة التوجيه لتوجيه الزوار إلى خدمة Render الخاصة بك

## 7. اختبار الموقع بعد النشر

1. قم بزيارة الدومين الخاص بك (مثلاً `http://theprof.tk` أو `https://theprof-api.onrender.com`)
2. تأكد من أن جميع الميزات تعمل بشكل صحيح:
   - تسجيل الدخول
   - عرض الشهور والدروس
   - مشاهدة الفيديوهات
   - تحميل الملفات

3. قم بفحص السجلات على Render للتأكد من عدم وجود أخطاء

## 8. ملاحظات هامة

1. **الخطة المجانية في Render**:
   - تتوقف الخدمة بعد 15 دقيقة من عدم النشاط
   - تستغرق حوالي 30 ثانية للبدء عند الوصول الأول بعد فترة توقف
   - محدودة بـ 750 ساعة استخدام شهرياً

2. **الخطة المجانية في MongoDB Atlas**:
   - مساحة تخزين محدودة (512 MB)
   - أداء محدود مقارنة بالخطط المدفوعة

3. **الدومين المجاني من Freenom**:
   - يجب تجديده كل 12 شهر
   - قد يتم تعطيله إذا تم اكتشاف نشاط مشبوه

4. **للاستخدام الإنتاجي**:
   - يُنصح بالترقية إلى خطط مدفوعة للحصول على أداء أفضل وموثوقية أعلى
   - استخدام دومين مدفوع (.com, .net, .org, إلخ) للاحترافية

## 9. استكشاف الأخطاء وإصلاحها

1. **مشكلة الاتصال بقاعدة البيانات**:
   - تأكد من صحة رابط الاتصال في متغيرات البيئة
   - تأكد من إضافة عنوان IP الخاص بـ Render إلى قائمة السماح في MongoDB Atlas

2. **مشكلة في تشغيل التطبيق**:
   - تحقق من سجلات Render للاطلاع على تفاصيل الخطأ
   - تأكد من تحديد النسخة الصحيحة من Node.js في إعدادات Render

3. **مشكلة في الدومين**:
   - تأكد من إعداد سجلات DNS بشكل صحيح
   - قد يستغرق انتشار تغييرات DNS حتى 48 ساعة

4. **مشكلة في تحميل الملفات الثابتة**:
   - تأكد من تكوين المجلد العام بشكل صحيح في التطبيق
   - تأكد من استخدام مسارات نسبية للملفات الثابتة
