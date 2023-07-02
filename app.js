// Firebase initialization
// TODO: Sensitive information should be stored in a .env file and accessed through process.env
const firebaseConfig = {
  apiKey: "AIzaSyDHqeCL5yWiUGnAqr_KA7_ho2KJuiUwUb4",
  authDomain: "ezbook-cf3d9.firebaseapp.com",
  projectId: "ezbook-cf3d9",
  storageBucket: "ezbook-cf3d9.appspot.com",
  messagingSenderId: "298078561094",
  appId: "1:298078561094:web:08135bc3a332d26ff4fb47",
  measurementId: "G-F529Z6XKQD"
}

firebase.initializeApp(firebaseConfig);

// Firebase Recaptcha initialization
function initializeRecaptchaVerifier() {
  const recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
    'size': 'invisible',
    'callback': () => {
      submitLoginForm();
    }
  });

  return recaptchaVerifier;
}

// Global variables
let globalConfirmationResult;
let events = [];

// Submits login form and calls login function with phone number
async function submitLoginForm() {
  const phoneNumber = document.getElementById('phone-number').value;

  try {
    await login(phoneNumber);
    navigateTo('/');
  } catch (error) {
    console.log(error);
  }
}

// Logs in user with phone number using Firebase Auth
async function login(phoneNumber) {
  try {
    const recaptchaVerifier = initializeRecaptchaVerifier();

    const confirmationResult = firebase.auth().signInWithPhoneNumber(phoneNumber, recaptchaVerifier);

    globalConfirmationResult = confirmationResult;

    const verificationCode = prompt('Please enter the verification code');

    const result = await globalConfirmationResult.confirm(verificationCode);

    return result;

  } catch (error) {
    throw(error);
  }
}

// When app loads, let's retrieve all events from Firebase
// and store them in a variable called events

async function retrieveEvents() {
  const eventsRef = firebase.database().ref('events');
  if (!eventsRef) return null;

  try {
    const snapshot = await eventsRef.once('value');
    const eventsData = snapshot.val();
    if (!eventsData) return null;

    // Events in DB are stored as an object, but we want an array
    // so we can iterate over it
    const events = Object.keys(eventsData).map(key => {
      return {
        id: key,
        ...eventsData[key]
      }
    });

    return events;
  } catch (error) {
    console.log(error);
  }
}

async function retrieveUsers() {
  const usersRef = firebase.database().ref('users');
  if (!usersRef) return null;

  try {
    const snapshot = await usersRef.once('value');
    const usersData = snapshot.val();
    if (!usersData) return null;

    return usersData;
  } catch (error) {
    console.log(error);
  }
}

async function checkUser() {
  return new Promise ((resolve, reject) => {
    const unsubscribe = firebase.auth().onAuthStateChanged(user => {
      unsubscribe();
      resolve(user);
    }, error => {
      reject(error);
    });
  });
}

function renderEventsToPage(event) {
  const currentPage = window.location.pathname;

  const eventWrapper = document.createElement('div');
  eventWrapper.classList.add('event');

  const link = document.createElement('a');
  link.classList.add('event-link');
  link.href = '#';
  link.id = event.id;

  link.addEventListener('click', event => {
    event.preventDefault();

    navigateTo(`/event/${event.currentTarget.id}`);
  });

  eventWrapper.innerHTML = `
    <h3 class="title">${event.name.toUpperCase()}</h3>
    <p>Cost: ${event.cost}</p>
    <p>Limit: ${event.limit}</p>
    <p>${event.date.toUpperCase()} ${event.time.toUpperCase()}</p>
    <p>IN ${event.location.toUpperCase()}</p>
    ${currentPage != '/user' ? `<button class="join-btn" id="${event.id}" data-join-event>Join</button>` : ''}
    ${currentPage === '/user' ? `<button class="delete-btn" id="${event.id}" data-delete-event>Remove RSVP</button>` : ''}
    ${event.hostId === currentUser.uid ? '<button class="host-badge">HOST</button>' : ''}
  `;

  link.appendChild(eventWrapper);

  const container = document.getElementById('main');
  container.appendChild(link);
}

function displayUserEvents(events) {
  const eventsUserHasJoined = events.filter(event => {
    if (currentUser && event.users) {
      event.users = Object.keys(event.users).map(key => ({
          id: key,
          ...event.users[key]
        }));
      return event.users.some(user => user.id === currentUser.uid)
    }

    // If event has no users, return false
    // because the user has not joined
    if (!event.users) {
      return false;
    }
  });

  eventsUserHasJoined.forEach(event => {
    // Render event to page
    renderEventsToPage(event);
  });
}

function displayOtherEvents(events) {
  const eventsUserHasNotJoined = events.filter(event => {
    if (currentUser && event.users) {
      event.users = Object.keys(event.users).map(key => ({
          id: key,
          ...event.users[key]
        }));
      return !event.users.some(user => user.id === currentUser.uid)
    }

    // If event has no users, return true
    // because the user has not joined
    if (!event.users) {
      return true;
    }
  })

  eventsUserHasNotJoined.forEach(event => {
    // Render event to page
    renderEventsToPage(event);
  });

  if (eventsUserHasNotJoined.length === 0) {
    const container = document.getElementById('main');
    container.innerHTML = '<h3>You are registered for all of the upcoming events!</h3>';
  }
}

function displayEvents(events) {
  // Display events on the page

  const currentPage = window.location.pathname;

  // Clear out the main container
  const container = document.getElementById('main');
  container.innerHTML = '';

  if (currentPage === '/user') {
    displayUserEvents(events);
  } else {
    displayOtherEvents(events);
  }

  // Add event listeners to join buttons
  setupJoinButtonListeners(events);

  // Add event listeners to remove RSVP buttons
  setupRemoveRSVPButtonListeners(events);
}

function setupJoinButtonListeners(events) {
  // Add event listeners to buttons
  const joinEventButtons = document.querySelectorAll('[data-join-event]');

  // When user clicks join button, add event to user's events
  // and add user to event's users

  // Make these changes with local data first
  // then make changes to database

  joinEventButtons.forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();

      const eventToJoin = events.find(event => event.id === button.id);

      if (!eventToJoin.users) {
        eventToJoin.users = [];
      }

      events[events.indexOf(eventToJoin)].users.push(
        {
          id: currentUser.uid,
          name: currentUser.displayName,
          phoneNumber: currentUser.phoneNumber
        }
      );

      // Find user in users array
      const user = this.users.find(user => user.id === currentUser.uid);
      if (!user.events) {
        user.events = [];
      }

      user.events.push(
        {
          id: eventToJoin.id,
          name: eventToJoin.name,
        }
      );

      // Update database
      updateDatabase(events, this.users);
    })
  });
}

function setupRemoveRSVPButtonListeners(events) {
  // Add event listeners to buttons
  const removeRSVPButtons = document.querySelectorAll('[data-delete-event]');
  removeRSVPButtons.forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();

      const eventToRemove = events.find(event => event.id === button.id);

      events[events.indexOf(eventToRemove)].users.pop(
        {
          id: currentUser.uid,
          name: currentUser.displayName,
          phoneNumber: currentUser.phoneNumber
        }
      );

      // Find user in users array
      const user = this.users.find(user => user.id === currentUser.uid);

      user.events.pop(
        {
          id: eventToRemove.id,
          name: eventToRemove.name,
        }
      );

      // Update database
      updateDatabase(events, this.users);
    })
  });

}

async function updateDatabase(events, users) {
  // Update database with new events and users
  const eventsRef = firebase.database().ref('events');
  const usersRef = firebase.database().ref('users');

  try {
    await eventsRef.set(events);
    await usersRef.set(users);
  }

  catch (error) {
    console.log(error);
  }
}

function listenForDBChanges() {
  // Listen for changes to database
  // Update app when changes occur

  const eventsRef = firebase.database().ref('events');
  const usersRef = firebase.database().ref('users');

  eventsRef.on('value', snapshot => {
    const events = snapshot.val();
    displayEvents(events);

    // TODO: Have events in a local variable as well that we can update
    // whenever we fetch from the database
  });

  usersRef.on('value', snapshot => {
    const users = snapshot.val();
    this.users = users;
  });
}

async function loadApp() {
  console.log('Loading app...');
  let currentUser;

  this.users = [];

  // Retrieve events from Firebase
  const pulledEvents = await retrieveEvents();

  // Retrieve users from Firebase
  const pulledUsers = await retrieveUsers();

  // Retrieve current user from Firebase
  // Store current user in currentUser variable
  currentUser = await checkUser();

  // If there are events, store them in the events variable
  if (pulledEvents) {
    events = pulledEvents;
  }

  // If there are events, display them
  if (events.length) {
    displayEvents(events);
  }

  // If there are no events, display a message
  if (!events.length) {
    const container = document.getElementById('main');
    container.innerHTML = '<p>No events to show</p>';
  }

  // If there are users, store them in the users variable
  if (pulledUsers) {
    this.users = pulledUsers;
  }

  // Does user exist in users array?
  // If not, add user to users array
  if (!this.users.some(user => user.id === currentUser.uid)) {
    this.users.push({
      id: currentUser.uid,
      name: currentUser.displayName,
      phoneNumber: currentUser.phoneNumber
    });
  }

  // TODO: Update database with new users array

  const currentPage = window.location.pathname;

  if (currentPage === '/user') {
    loadUserPageDetails(currentUser);
  }

  updateHeaderNav(currentUser);

  listenForDBChanges();
}

function handleRoute(route) {
  // Handle route changes

  if (route === '/') {
    // Display events on the page
    loadApp();
  } else if (route === '/user') {
    console.log('User page');
    // Display user's details and events
    loadApp();

    // Clicking on an event should take you to the event page
  } else if (route.startsWith('/event/')) {
    console.log('Event page');

    const eventId = route.split('/event/')[1];
    console.log(eventId);

    // Clear main container
    const container = document.getElementById('main');
    container.innerHTML = '';

    // Display event details
    // Find event in events array
    const event = events.find(event => event.id === eventId);
    console.log(event);

    // Display event details
    displayEventDetails(event);

    // Display users attending event
    // Find users in event object
    if (event.users) {
      displayUsers(event.users);
    }


    // Display event location on map
    // Might need to use Google Maps API
    loadMap(event.location);

  }
}

function loadMap(address) {
  // Load map
  const map = L.map('map', { zoom: 13 });

  // Add a tile layer to display the map
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
  }).addTo(map);

  // Geocode the address to get coordinates
  const geocoder = L.Control.Geocoder.nominatim();
  geocoder.geocode(address, (results) => {
    if (results && results.length > 0) {
      const { lat, lng } = results[0].center;

      // Center map on coordinates
      map.setView([lat, lng]);

      // Add marker to map
      L.marker([lat, lng]).addTo(map);
    } else {
      console.log('Address not found');
    }
  });
}

// Used to change the url and call the handleRoute function
function navigateTo(route) {
  // Navigate to route
  window.history.pushState({}, route, route); // Read upon window.history.pushState()
  handleRoute(route);
}

// Catch when user clicks back or forward buttons
window.addEventListener('popstate', () => { // Read up on popstate
  handleRoute(window.location.pathname);
});

// Initialize route handling
handleRoute(window.location.pathname);

// TODO: Refactor this function
function renderEvent(container, event, currentPage) {
  const link = document.createElement('a');
  link.href = `event?id=${event.id}`;

  const div = document.createElement('div');
  div.classList.add('event');

  let hosted = false;
  if (event.hostId === currentUser.uid) {
    hosted = true;
  }
  div.innerHTML = `
    <div className="title">
      <h3>${event.name.toUpperCase()}</h3>
    </div>

    <p>Cost: ${event.cost}</p>
    <p>Limit: ${event.limit}</p>
    <p>${event.date.toUpperCase()} ${event.time.toUpperCase()}</p>
    <p>IN ${event.location.toUpperCase()}</p>
    ${currentPage != '/user' ? `<button class="join-btn" id="${event.id}" data-join-event>Join</button>` : ''}
    ${currentPage === '/user' ? `<button class="delete-btn" id="${event.id}" data-delete-event>Remove RSVP</button>` : ''}
    ${hosted ? '<button class="host-badge">HOST</button>' : ''}
  `;
  // link.appendChild(div);
  container.appendChild(div);
}

// TODO: Refactor this function
function retrieveEventData(eventId, events) {
  const eventData = events.find(event => event.id === eventId);
  return eventData;
}

// TODO: Refactor this function
function displayEventDetails(eventData) {
  const eventDetailsElement = document.getElementById('main');
  eventDetailsElement.innerHTML = `
    <h2>${eventData.name}</h2>
    <p>${eventData.cost}</p>
    <p>${eventData.date} ${eventData.time}</p>
    <p>${eventData.location}</p>

    <h3>Users attending</h3>
    <div id="users"></div>

    <h3>Location</h3>
    <div id="map"></div>
  `;
}

function displayUsers(users) {
  const usersElement = document.getElementById('users');
  usersElement.innerHTML = '';
  users.forEach(user => {
    const userElement = document.createElement('div');
    userElement.classList.add('user');
    userElement.innerHTML = `
      <p>${user.name}</p>
      <p>${user.phoneNumber}</p>
    `;
    usersElement.appendChild(userElement);
  });
}

let currentUser;

const currentPage = window.location.pathname;

// TODO: Refactor this function
document.addEventListener('DOMContentLoaded', function() {
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      console.log('User is signed in.');
      currentUser = user;

      const currentPage = window.location.pathname;

      if (currentPage === '/create') {

        // Create event
        if (createEventForm) {
          createEventForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Get form data
            const formData = new FormData(createEventForm);
            const name = formData.get('name');
            const location = formData.get('location');
            const date = formData.get('date');
            const time = formData.get('time');
            const cost = formData.get('cost');
            const limit = formData.get('limit');

            // Create event object
            let event = {
              name,
              location,
              date,
              time,
              cost,
              limit,
              hostId: currentUser.uid,
            };

            const eventRef = firebase.database().ref('events').push(); // Generate a unique key for the event

            eventRef.set(event);

            event = {
              id: eventRef.key,
              ...event,
            };

            navigateTo('/');
          });
        }
      }

    } else {
      currentUser = null;
      console.log('No user is signed in.');
      updateHeaderNav(user);
    }
  });

  if (currentPage === '/event') {
    // const eventId = parseInt(new URLSearchParams(window.location.search).get('id'), 10);
    // const eventData = retrieveEventData(eventId, events);
    // displayEventDetails(eventData);
  }

  // const userPageButton = document.querySelector('[data-user-page-button]');

  // if (userPageButton) {
  //   userPageButton.addEventListener('click', function(event) {
  //     event.preventDefault();

  //     // if user is logged in, redirect to user page
  //     const user = firebase.auth().currentUser;
  //     if (user) {
  //       navigateTo('/user');
  //     } else {
  //       window.localStorage.setItem('loginMessage', 'Please login to view your user page');
  //       navigateTo('/login');
  //     }
  //   });
  // }

  if (currentPage === '/login') {
    const messageDiv = document.querySelector('[data-message-output]');
    const loginMessage = window.localStorage.getItem('loginMessage');

    if (loginMessage && messageDiv) {
      messageDiv.innerHTML = loginMessage;
      // Clear the message from local storage to prevent it from persisting
      window.localStorage.removeItem('loginMessage');
    }
  }
});

function loadUserPageDetails(currentUser) {
  console.log('Loading user page details');

  // Fetch user details from database or local data

  console.log(this.users);

  // Find user in users array
  const user = this.users.find(user => user.id === currentUser.uid);

  const userElement = document.querySelector('.user-details');
  userElement.innerHTML = `
    <h2>${user.name ? user.name : 'User'}</h2>
    <p>${user.phoneNumber}</p>
  `;

  // Events are getting displayed through the loadApp function
}

function updateHeaderNav(user) {
  // Updates nav links based on whether user is logged in or not

  if (logoutButton) {
    logoutButton.style.display = user ? 'block' : 'none';
  }

  if (loginButton) {
    loginButton.style.display = user ? 'none' : 'block';
  }

  if (registerButton) {
    registerButton.style.display = user ? 'none' : 'block';
  }
}

function handleEventClick(event) {
  event.preventDefault();

  const eventId = event.target.getAttribute('href').split('?id=')[1];

  navigateTo(`/event?id=${eventId}`);
}

// TODO: Refactor these functions

const logoutButton = document.querySelector('[data-logout-button]');
const registerForm = document.querySelector('.register-form');
const loginForm = document.querySelector('.login-form');
const createButton = document.querySelector('[data-create-button]');
const createEventForm = document.querySelector('.create-event-form');
const loginButton = document.querySelector('[data-login-button]');
const registerButton = document.querySelector('[data-register-button]');


logoutButton.addEventListener('click', function(event) {
  event.preventDefault();

  firebase.auth().signOut().then(function() {
    console.log('Signed Out');
    navigateTo('/');
  }, function(error) {
    console.error('Sign Out Error', error);
  });
});

// Login
if (loginForm) {
  loginForm.addEventListener('submit', function(event) {
    event.preventDefault();

    submitLoginForm();
  });
}

// Register
if (registerForm) {
  registerForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const phoneNumber = document.getElementById('phone-number').value;
    const displayName = document.getElementById('name').value;

    login(phoneNumber, displayName)
    .then(function(data) {

      // Save name to database
      const user = firebase.auth().currentUser;
      const usersRef = firebase.database().ref('users');
      usersRef.child(user.uid).set({
        displayName,
        phoneNumber,
      })
      .then(() => {
        console.log('User saved to database');
        navigateTo('/');
      })
    })
    .catch(function(error) {
      console.log(error);
    });
  });
}
