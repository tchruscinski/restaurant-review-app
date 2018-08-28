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
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}

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
  self.markers.forEach(m => m.setMap(null));
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
          //console.log('image in View');
          // Stop watching and load the image
          loadImage(change.target);
          observer.unobserve(change.target);
        } else {
          //console.log('image out View');
        }
      });
    }

  const picture = document.createElement('picture');
  const source1 = document.createElement('source');
  const source2 = document.createElement('source');
  const source3 = document.createElement('source');
  picture.className = 'restaurant-img';
  source1.media = '(min-width: 1000px) and (max-width: 1199px)';
  source2.media = '(min-width: 1200px)';
  source3.media = '(min-width: 520px) and (max-width: 749px)';
  source1.srcset = DBHelper.imageUrlForRestaurantmedium(restaurant);
  source2.srcset = DBHelper.imageUrlForRestaurant(restaurant);
  source3.srcset = DBHelper.imageUrlForRestaurantmedium(restaurant);

  picture.append(source1);
  picture.append(source2);
  picture.append(source3)
  picture.append(image);
  li.append(picture)

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
  //
  // const isFavorite = (restaurant["is_favorite"]) ? true : false;
  // const favorite = document.createElement("button");
  // favorite.className = "favorite";
  // ///////////////////////////////////////////////////////////CHANGE
  // favorite.style.background = isFavorite
  //   ? `url("/icons/002-like.svg") no-repeat`
  //   : `url("icons/001-like-1.svg") no-repeat`;
  // favorite.innerHTML = isFavorite
  //   ? restaurant.name + " is a favorite"
  //   : restaurant.name + " is not a favorite";
  // favorite.id = "favorite-" + restaurant.id;
  // favorite.onclick = event => handleFavoriteClick(restaurant.id, !isFavorite);
  // li.append(favorite);

  return li;
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}




///////////////////////////////////////////////////////////
// const handleFavoriteClick = (id, newState) => {
//   // Update properties of the restaurant data object
//   const favorite = document.getElementById("favorite-" + id);
//   const restaurant = self
//     .restaurants
//     .filter(r => r.id === id)[0];
//   if (!restaurant)
//     return;
//   restaurant["is_favorite"] = newState;
//   favorite.onclick = event => handleFavoriteClick(restaurant.id, !restaurant["is_favorite"]);
//   DBHelper.handleFavoriteClick(id, newState);
// };
//////////////////////////////////////////////////////////




/**
 * Registering the serviceworker
 */

if (navigator.serviceWorker) {
    navigator.serviceWorker.register('sw.js')
      .then(() => console.log('Service worker successfully registered.'))
}
