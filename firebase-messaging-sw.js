// KPSS NET — web bildirim servis çalışanı
//
// ⚠️ NEDEN AYRI BİR DOSYA: tarayıcı, sekme KAPALIYKEN gelen bildirimi
// buradan gösteriyor. Uygulamanın kendi kodu o anda çalışmıyor. Bu
// dosya olmadan bildirim yalnızca uygulama açıkken görünürdü — ki
// bildirimin bütün amacı kapalıyken hatırlatmak.
//
// ⚠️ Bu dosya sitenin KÖKÜNDE durmalı (`/firebase-messaging-sw.js`).
// Firebase tam olarak bu adı ve bu yeri arıyor; başka bir yere
// konursa sessizce hiçbir şey olmuyor.
//
// Buradaki değerler gizli değil — web yapılandırması tarayıcıya zaten
// iniyor. Gerçek sır olan servis hesabı anahtarı sunucuda duruyor.

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAgZf9pic72U_ROvjKzEpJ7rmi5RJo1n6I',
  authDomain: 'kpps-net.firebaseapp.com',
  projectId: 'kpps-net',
  storageBucket: 'kpps-net.firebasestorage.app',
  messagingSenderId: '948366463860',
  appId: '1:948366463860:web:f75ef5615f479d7f835221'
});

const messaging = firebase.messaging();

// Sekme kapalıyken gelen bildirim.
messaging.onBackgroundMessage(function (payload) {
  const n = payload.notification || {};
  self.registration.showNotification(n.title || 'KPSS NET', {
    body: n.body || '',
    icon: '/icons/Icon-192.png',
    badge: '/icons/Icon-192.png',
    // Aynı etiketli bildirim üst üste birikmesin; ikinci gelen
    // birincinin yerini alır.
    tag: (payload.data && payload.data.route) || 'kpss-net',
    data: payload.data || {}
  });
});

// Bildirime dokununca uygulamayı öne getir; zaten açık bir sekme
// varsa yenisini açmak yerine ona odaklan.
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (list) {
        for (const c of list) {
          if ('focus' in c) return c.focus();
        }
        if (clients.openWindow) return clients.openWindow('/');
      })
  );
});
