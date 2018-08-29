let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
 document.addEventListener('DOMContentLoaded', (event) => {
   initMap();
 });

initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const picture = document.querySelector('picture');
  const source1 = document.getElementById('source1');
  const source2 = document.getElementById('source2');
  const source3 = document.getElementById('source3');
  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'

  source1.srcset = DBHelper.imageUrlForRestaurantlargex2(restaurant) + ' 2x, '+ DBHelper.imageUrlForRestaurantlargex1(restaurant) + ' 1x';
  source2.srcset = DBHelper.imageUrlForRestaurantlargex2(restaurant);
  source3.srcset = DBHelper.imageUrlForRestaurantmedium(restaurant);
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = 'Photo taken in ' + restaurant.name + ' restaurant.';

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  DBHelper.fetchReviewsById(restaurant.id, fillReviewsHTML);
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (error, reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  const hr1 = document.createElement('hr');
  const hr2 = document.createElement('hr');
  const hr3 = document.createElement('hr');
  hr1.align = 'left';
  hr2.align = 'left';
  hr3.align = 'left';

  name.innerHTML = review.name;
  li.appendChild(name);
  li.appendChild(hr1);

  const date = document.createElement('p');
  const createdAt = review.createdAt;
  date.innerHTML = new Date(createdAt).toLocaleString();
  li.appendChild(date);
  li.appendChild(hr2);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);
  li.appendChild(hr3);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}


addReviewFromWeb = () => {
  let restarantId = getParameterByName('id');
  let name = document.getElementById('review-name').value;
  let rating = document.querySelector('#rating-select option:checked').value;
  let comment = document.getElementById('comment').value;
  let date = new Date();
  const webReview = {
    restaurant_id: parseInt(restarantId),
    name: name,
    createdAt: date,
    updatedAt: date,
    rating: parseInt(rating),
    comments: comment.substring(0, 500)
  };
  document.getElementById('add-review').reset();
  //window.location.replace('http://localhost:8080/restaurant.html?id=' + restarantId);
  console.log(webReview);
  DBHelper.addReview(webReview);
  addReviewHTML(webReview);

}

addReviewHTML = (review) => {
    const ul = document.getElementById('reviews-list');
    const container = document.getElementById('reviews-container');
    ul.appendChild(createReviewHTML(review));
    container.appendChild(ul);
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  const a = document.createElement('a');

  a.innerHTML = restaurant.name;
  a.href = '#';
  a.setAttribute('aria-label', 'Refresh the current page.');
  a.setAttribute('aria-current', 'page');
  li.append(a);
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
