importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.4.1/workbox-sw.js');
if (typeof idb === 'undefined') {
        self.importScripts('js/idb.js');
    }

var staticCacheName = 'restaurant-app-static';
workbox.precaching.precache([
  '/css/styles.min.css',
  '/js/main.js',
  '/js/dbhelper.js',
  '/js/restaurant_info.js',
  '/js/idb.js',
  '/js/sw-register.js',
  '/restaurant.html',
  '/index.html',
  'images_small/1.webp',
  'images_small/2.webp',
  'images_small/3.webp',
  'images_small/4.webp',
  'images_small/5.webp',
  'images_small/6.webp',
  'images_small/7.webp',
  'images_small/8.webp',
  'images_small/9.webp',
  'images_small/10.webp'
]);

const dbPromise = idb.open('restaurants-db', 2, function(upgradeDb) {
  switch (upgradeDb.oldVersion) {
    case 0:
      upgradeDb.createObjectStore('restaurants', {
        keyPath: 'id'
      });
    case 1:
      const reviewsStore = upgradeDb.createObjectStore("reviews", {
        keyPath: "id"
      });
      reviewsStore.createIndex("restaurant_id", "restaurant_id");
  }
});


self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        '/',
        '/restaurant.html',
        '/index.html',
        'js/main.js',
        'js/dbhelper.js',
        'js/idb.js',
        'js/sw-register.js',
        'js/restaurant_info.js',
        'css/styles.min.css',
        'images_small/1.webp',
        'images_small/2.webp',
        'images_small/3.webp',
        'images_small/4.webp',
        'images_small/5.webp',
        'images_small/6.webp',
        'images_small/7.webp',
        'images_small/8.webp',
        'images_small/9.webp',
        'images_small/10.webp'
      ]);
    })

  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames){
      return Promise.all(
      cacheNames.filter(function(cacheName){
          return cacheName.startsWith('restaurant-') && cacheName != staticCacheName;
        }).map(function(cacheName){
          return cache.delete(cacheName);
        })
    );
    })
  );
});

self.addEventListener('fetch', function(event) {

  let requestToCache = event.request;
  if (event.request.url.indexOf('restaurant.html') > -1) {
    requestToCache = new Request('restaurant.html');
  }
  const Url = new URL(event.request.url);
  if (Url.port === '1337') {
    //splits the url into parts on /
    const parts = Url.pathname.split("/");
    let id = Url.searchParams.get('restaurant_id');

    if (!id) {
      if (Url.pathname.indexOf('restaurants') > -1) {
        //if restaurant exists within the url id is the last part of the url => index is length - 1
        id = parts[parts.length - 1] === "restaurants" ? "-1" : parts[parts.length - 1];
      } else {
        //url for getting reviews
        id = Url.searchParams.get('restaurant_id');
      }
    }
    serverEvent(event, id);
  } else {
    defaultEvent(event, requestToCache);
  }
});

function serverEvent(event, id) {

  if (event.request.method != 'GET') {
    return fetch(event.request).then(function(response){
        return resonse.json();
    }).then(function(data) {
        return data;
    });
  }

  if (event.request.url.indexOf('reviews') > -1) {
    reviewsEvent(event, id);
  } else {
    restaurantEvent(event, id);
  }
}

function restaurantEvent(event, id) {

  event.respondWith(dbPromise.then(function(db) {
    return db.transaction("restaurants").objectStore("restaurants").get(id);
    }).then(function (data) {
      return data && data.data || fetch(event.request).then(function(response) {
        return response.json();
      }).then(function(data) {
        return dbPromise.then(function(db) {
          var tx = db.transaction("restaurants", "readwrite");
          tx.objectStore("restaurants").put({
            id: id,
            data: data
          });
          return data;
        });
      });
    }).then(finalResponse => {
      return new Response(JSON.stringify(finalResponse));
    })
    .catch(error => {
      return new Response("Error fetching data", {
        status: 500
      });
    })
  );
};
function reviewsEvent(event, id) {

  event.respondWith(dbPromise.then(function(db) {
    return db.transaction("reviews").objectStore("reviews").index("restaurant_id").getAll(id);
  }).then(function (data) {
    return data.length && data || fetch(event.request).then(function(response) {
      return response.json();
    })
  }).then(finalResponse => {
        var mapResponse = finalResponse.map(review => {
        return review.data;
      });
      return new Response(JSON.stringify(mapResponse));
  }).catch(error => {
    return new Response("Error fetching data", {
      status: 500
    });
  }));
};

function defaultEvent(event, requestToCache) {

  event.respondWith(caches.match(requestToCache).then(function(response) {
    return response || fetch(event.request).then(function(response) {
      return caches.open(staticCacheName).then(function(cache) {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch(function(error) {
      console.log(error);
    });
  }));
};
