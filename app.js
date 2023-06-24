// Firebase

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

const auth = firebase.auth();

function initializeRecaptchaVerifier() {
  const recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
    'size': 'invisible',
    'callback': (response) => {
      // reCAPTCHA solved, allow signInWithPhoneNumber.
      // Code to execute when reCAPTCHA is solved

      submitLoginForm();
    }
  });

  return recaptchaVerifier;
}

let globalConfirmationResult;

function submitLoginForm() {
  const phoneNumber = document.getElementById('phone-number').value;
  login(phoneNumber)
  .then(function(data) {
    console.log(data);
    window.location.href = '/';
  })
  .catch(function(error) {
    console.log(error);
  });
}

function login(phoneNumber, displayName) {
  return new Promise(function(resolve, reject) {
    const recaptchaVerifier = initializeRecaptchaVerifier();
    firebase.auth().signInWithPhoneNumber(phoneNumber, recaptchaVerifier)
      .then(function(confirmationResult) {
        globalConfirmationResult = confirmationResult;

        const verificationCode = prompt('Please enter the verification code');
        return confirmationResult.confirm(verificationCode);
      })
      .then(function(result) {
        resolve(result);
      }).catch(function(error) {
        reject(error);
      }
    );
  });
}

function renderEvent(container, event) {
  const link = document.createElement('a');
  link.href = `event.html?id=${event.id}`;

  const div = document.createElement('div');
  div.classList.add('event');
  div.innerHTML = `
    <h2>${event.name}</h2>
    <p>${event.cost}</p>
    <p>${event.limit}</p>
    <p>${event.date} ${event.time}</p>
    <p>${event.location}</p>
    <button id="${event.id}" data-join-event>Join</button>
  `;
  // link.appendChild(div);
  container.appendChild(div);
}

function retrieveEventData(eventId, events) {
  const eventData = events.find(event => event.id === eventId);
  return eventData;
}

function displayEventDetails(eventData) {
  const eventDetailsElement = document.getElementById('event-details');
  eventDetailsElement.innerHTML = `
    <h2>${eventData.title}</h2>
    <p>${eventData.description}</p>
    <p>${eventData.date} ${eventData.time}</p>
    <p>${eventData.location}</p>
  `;
}

document.addEventListener('DOMContentLoaded', function() {
  const currentPage = window.location.pathname;

  let events;

  const eventsRef = firebase.database().ref('events');
  eventsRef.once('value')
  .then(function(snapshot) {

    const eventsData = snapshot.val();

    if (!eventsData) return;

    events = Object.keys(eventsData).map(key => {
      return {
        id: key,
        ...eventsData[key]
      }
    });


    if (currentPage == '/') {
      const container = document.getElementById('main');

      for (data in events) {
        renderEvent(container, events[data]);
      }
    }

    const joinEventButtons = document.querySelectorAll('[data-join-event]');
    joinEventButtons.forEach(button => {
      button.addEventListener('click', function(event) {
        event.preventDefault();

        const eventId = event.target.getAttribute('id');

        const user = firebase.auth().currentUser;
        const usersRef = firebase.database().ref('users');
        usersRef.child(user.uid).child('events').child(eventId).set(true)
        .then(() => {
          console.log('User event saved to database');
        })
        .catch(function(error) {
          console.log(error);
        });
      })
    });
  })
  .catch(function(error) {
    console.log(error);
  });

  if (currentPage == '/') {
    const container = document.getElementById('main');

    for (data in events) {
      renderEvent(container, events[data]);
    }

    const eventLinks = container.querySelectorAll('.event a');
    eventLinks.forEach(link => {
      link.addEventListener('click', handleEventClick);
    });
  }

  if (currentPage === '/event.html') {
    const eventId = parseInt(new URLSearchParams(window.location.search).get('id'), 10);
    const eventData = retrieveEventData(eventId, events);
    displayEventDetails(eventData);
  }

  if (currentPage === '/user.html') {
    console.log('user page');
  }

  const userPageButton = document.querySelector('[data-user-page-button]');

  if (userPageButton) {
    userPageButton.addEventListener('click', function(event) {
      event.preventDefault();

      // if user is logged in, redirect to user page
      const user = firebase.auth().currentUser;
      if (user) {
        window.location.href = '/user.html';
      } else {
        window.localStorage.setItem('loginMessage', 'Please login to view your user page');
        window.location.href = '/login.html';
      }
    });
  }

  if (currentPage === '/login.html') {
    const messageDiv = document.querySelector('[data-message-output]');
    const loginMessage = window.localStorage.getItem('loginMessage');

    if (loginMessage && messageDiv) {
      messageDiv.innerHTML = loginMessage;
      // Clear the message from local storage to prevent it from persisting
      window.localStorage.removeItem('loginMessage');
    }
  }
});

function handleEventClick(event) {
  event.preventDefault();

  const eventId = event.target.getAttribute('href').split('?id=')[1];

  window.location.href = `event.html?id=${eventId}`;
}

const logoutButton = document.querySelector('[data-logout-button]');
const registerForm = document.querySelector('.register-form');
const loginForm = document.querySelector('.login-form');
const createButton = document.querySelector('[data-create-button]');
const createEventForm = document.querySelector('.create-event-form');


logoutButton.addEventListener('click', function(event) {
  event.preventDefault();

  firebase.auth().signOut().then(function() {
    console.log('Signed Out');
    window.location.href = '/';
  }, function(error) {
    console.error('Sign Out Error', error);
  });
});

// Check if user is logged in

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    console.log('User is signed in.');

    // Retrieve the user data from the database
    const usersRef = firebase.database().ref('users');
    usersRef.child(user.uid).once('value')
    .then(function(snapshot) {
      const isAdmin = snapshot.val().isAdmin;

      if (isAdmin) {
        console.log('Current user is an admin');

        if (createButton) {
          createButton.style.display = 'block';
        }
      } else {
        console.log('Current user is not an admin');
      }
    })
    .catch(function(error) {
      console.log(error);
    });

    // show logout button
    if (logoutButton) {
      logoutButton.style.display = 'block';
    }
  } else {
    console.log('No user is signed in.');
  }
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
        window.location.href = '/';
      })
    })
    .catch(function(error) {
      console.log(error);
    });
  });
}

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
    };

    const eventRef = firebase.database().ref('events').push(); // Generate a unique key for the event

    eventRef.set(event);

    event = {
      id: eventRef.key,
      ...event,
    };

    window.location.href = '/';
  });
}
