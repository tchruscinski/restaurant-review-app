/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_RESTAURANT_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static get DATABASE_REVIEWS_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/reviews`;
  }
  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback, id) {
    let Url = DBHelper.DATABASE_RESTAURANT_URL;
    if (id) {
      Url = Url + '/' + id;
    }
    fetch(Url).then(response => {
        response.json().then(restaurants => {
          callback(null, restaurants);
        });
      }).catch(error => {
        callback(error, null);
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }



  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }


  /**
   * Fetch reviews for restaurant by id.
   */
   static fetchReviewsById(id, callback) {
     let Url = DBHelper.DATABASE_REVIEWS_URL;
     if (id) {
       Url = Url + '/?restaurant_id=' + id;
     }

    fetch(Url).then(response => {
      if (!response.clone().ok && !response.clone().redirected) {
        throw "No reviews available";
      }
      response.json().then(result => {
          callback(null, result);
          this.dbPromise().then(db => {
            if(!db) {
              return;
            }
            let tx = db.transaction('reviews', 'readwrite');
            const reviewsStore = tx.objectStore('reviews');
            if (Array.isArray(result)) {
              result.forEach(function(review) {
                reviewsStore.put(review);
             });
            } else {
              store.put(result);
            }
          });
          return Promise.resolve(result);
        })
    }).catch(error => {
      callback(error, null);
    });
   }



///////////////////////////////////////////
//Handling posting the review test verision

static addReview(review) {
    let dataObj = {
      name: 'addReview',
      data: review,
    }

    if(dataObj.data == null){
      return;
    }
    if (!navigator.onLine && dataObj.name == 'addReview') {
      DBHelper.submitWhenOnline(dataObj);
      return;
    }
    console.log(data);
    let reviewToSend = {
      'restaurant_id': review.restaurant_id,
      'name': review.name,
      'createdAt': review.createdAt,
      'updatedAt': review.updatedAt,
      'rating': review.rating,
      'comments': review.comments
    };
    let Url = DBHelper.DATABASE_REVIEWS_URL;

    fetch(Url, {
        method: 'POST',
        body: JSON.stringify(reviewToSend),
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      }).then(response => {
        const contentType = response.headers.get('Content-Type');
        if (contentType && contentType.indexOf('application/json') != -1) {
          return response.json();
        } else {
          return 'Fetch Successful';
        }
      }).catch(error => {
        console.log(error);
      });
}


//LOCAL STORAGE web API

static submitWhenOnline(dataObj) {
  localStorage.setItem('data', JSON.stringify(dataObj.data));
  console.log('You\'ve got data stored in your Local Storage');

  window.addEventListener('online', (event) => {
    let data = JSON.parse(localStorage.getItem('data'));
  });

  DBHelper.addReview(dataObj.data);
  localStorage.removeItem('data');

  console.log('Your Local Storage has been cleared');
}
//////////////////////////////////////



  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL for small images.
   */
  static imageUrlForRestaurant(restaurant) {
      return (`/images_small/${restaurant.photograph}.jpg`);
  }


  /**
   * Restaurant image URL for medium images.
   */
  static imageUrlForRestaurantmedium(restaurant) {
    //TODO: return url depending on viewport width -15 (scrollbar width)
      return (`/images_medium/${restaurant.photograph}.jpg`);
    }

    /**
   * Restaurant image URL for large x2 images.
   */
  static imageUrlForRestaurantlargex2(restaurant) {
    //TODO: return url depending on viewport width -15 (scrollbar width)
      return (`/images_largex2/${restaurant.photograph}.jpg`);
    }

    /**
   * Restaurant image URL for large x1 images.
   */
  static imageUrlForRestaurantlargex1(restaurant) {
    //TODO: return url depending on viewport width -15 (scrollbar width)
      return (`/images_largex1/${restaurant.photograph}.jpg`);
    }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}
