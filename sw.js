// sw.js
// オフラインでアプリを起動・動作させるためのサービスワーカー

// ★ファイルの中身を更新したときは、この番号を変更してください(例: v1 -> v2)。
// 番号を変えないと、ブラウザ/スマホに残っている古いキャッシュのファイルが
// 使われ続けてしまい、修正が反映されません。
const CACHE_NAME = 'zh-fill-in-app-v3';

// オフラインで使うためにキャッシュ(保存)しておくファイルの一覧
const FILES_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './questions.js',
  './manifest.json',
  './lib/vue.global.prod.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// インストール時: 上記ファイルをすべてキャッシュに保存する
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 有効化時: 古いバージョンのキャッシュを削除する
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// リクエスト時: まずキャッシュを探し、なければネットワークから取得する
// (オフラインのときはキャッシュのファイルがそのまま使われる)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // オフラインかつキャッシュにも無い場合は、トップページを返す
        return caches.match('./index.html');
      });
    })
  );
});
