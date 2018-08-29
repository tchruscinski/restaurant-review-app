let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
  updateRestaurants()
  initMap();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    option.setAttribute('aria-label', 'Select ' + neighborhood + ' neighborhood');
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    option.setAttribute('aria-label', 'Select ' + cuisine + ' cuisine');
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
initMap = () => {
  self.newMap = L.map('map', {
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false
  });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1IjoibXJwdW1wa2luZyIsImEiOiJjamoyNXUzcDIwenpyM2tsZm03MDJnOHFqIn0.K5wTgEieIuewCzBwoLVGRw',
    maxZoom: 18,
    attribution: '',
    id: 'mapbox.streets'
  }).addTo(newMap);
  updateRestaurants();
}

// document.getElementById("load-map").addEventListener('click', function() {
//   let loc = {
//     lat: 40.722216,
//     lng: -73.987501
//   };
//   self.map = new google.maps.Map(document.getElementById('map'), {
//     zoom: 12,
//     center: loc,
//     scrollwheel: false
//   });
//   updateRestaurants();
// });

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Creating restaurant HTMl with <picture> element.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');


    // IntersectionObserver for loading images
    const image = document.createElement('img');
    image.alt = 'Photo taken in ' + restaurant.name + ' restaurant.';
    ////add margin
    const options = {
      threshold: 0.1
    };

    let observer;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(onChange, options);
      observer.observe(image);
    } else {
      console.log('Intersection Observers not supported', 'color: red');
      loadImage(image);
    }
    const loadImage = image => {
      image.className = 'restaurant-img';
      image.src = DBHelper.imageUrlForRestaurant(restaurant);
    }

    function onChange(changes, observer) {
      changes.forEach(change => {
        if (change.intersectionRatio > 0) {
          loadImage(change.target);
          observer.unobserve(change.target);
        }
      });
    }

  // const picture = document.createElement('picture');
  // const source1 = document.createElement('source');
  // const source2 = document.createElement('source');
  // const source3 = document.createElement('source');
  // picture.className = 'restaurant-img';
  // source1.media = '(min-width: 1000px) and (max-width: 1199px)';
  // source2.media = '(min-width: 1200px)';
  // source3.media = '(min-width: 520px) and (max-width: 749px)';
  // source1.srcset = DBHelper.imageUrlForRestaurantmedium(restaurant);
  // source2.srcset = DBHelper.imageUrlForRestaurant(restaurant);
  // source3.srcset = DBHelper.imageUrlForRestaurantmedium(restaurant);
  //
  // picture.append(source1);
  // picture.append(source2);
  // picture.append(source3)
  // picture.append(image);
  // li.append(picture)
  li.append(image);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('aria-label', 'View more details about ' + restaurant.name + ' restaurant');
  li.append(more)


  const favorite = document.createElement("button");
  favorite.className = "favorite-button";
  favorite.innerHTML = '❤';
  //let favoriteStatus;
  // fetch(`${DBHelper.DATABASE_RESTAURANT_URL}?id=${restaurant.id}`).then((response) => {
  //     favoriteStatus = response.is_favorite;
  // });
  // favorite.className = restaurant.is_favorite
  //   ? `favorite`
  //   : `not-favorite`;
  //console.log(restaurant.name, restaurant.is_favorite);
  favorite.setAttribute('aria-label', 'Mark/Unmark the restaurant as favorite');
  favorite.onclick = function() {
    const isFavorite = !restaurant.is_favorite;
    DBHelper.updateFavoriteStatus(restaurant.id, isFavorite);
    restaurant.is_favorite = !restaurant.is_favorite
    toggleFavorite(favorite, restaurant.is_favorite)
  };
  toggleFavorite(favorite, restaurant.is_favorite)
  li.append(favorite);

  return li;
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);

    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });
}


toggleFavorite = (el, favorite) => {
  if (!favorite) {
    el.classList.remove('favorite');
    el.classList.add('not-favorite');
    el.setAttribute('aria-label', 'Mark as favorite');

  } else {
    el.classList.remove('not-favorite');
    el.classList.add('favorite');
    el.setAttribute('aria-label', 'Remove favorite mark');
  }
}
