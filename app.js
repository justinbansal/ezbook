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

function renderEvent(container, event, currentPage) {
  const link = document.createElement('a');
  link.href = `event.html?id=${event.id}`;

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
    ${currentPage != '/user.html' ? `<button class="join-btn" id="${event.id}" data-join-event>Join</button>` : ''}
    ${currentPage === '/user.html' ? `<button class="delete-btn" id="${event.id}" data-delete-event>Remove RSVP</button>` : ''}
    ${hosted ? '<button class="host-badge">HOST</button>' : ''}
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

let currentUser;

const currentPage = window.location.pathname;

// let events;

// const eventsRef = firebase.database().ref('events');
// eventsRef.once('value')
// .then(function(snapshot) {

//   const eventsData = snapshot.val();

//   if (!eventsData) return;

//   events = Object.keys(eventsData).map(key => {
//     return {
//       id: key,
//       ...eventsData[key]
//     }
//   });

//   if (currentPage == '/') {
//     const container = document.getElementById('main');

//     for (data in events) {
//       renderEvent(container, events[data]);
//     }
//   }

document.addEventListener('DOMContentLoaded', function() {
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      console.log('User is signed in.');
      currentUser = user;

      const currentPage = window.location.pathname;

      if (currentPage === '/user.html') {
        const userRef = firebase.database().ref('users');
        userRef.child(user.uid).once('value')
        .then(function(snapshot) {
          const userData = snapshot.val();

          const userElement = document.getElementById('user');
          userElement.innerHTML = `
            <h2>${userData.displayName}</h2>
            <p>${userData.phoneNumber}</p>
          `;

          const eventsRef = firebase.database().ref('events');
          eventsRef.once('value')
          .then(function(snapshot) {
            const eventsData = snapshot.val();

            if (!eventsData) return;

            const userEvents = userData.events;
            const events = Object.keys(eventsData).map(key => {
              return {
                id: key,
                ...eventsData[key]
              }
            });

            const userEventsData = events.filter(event => {
              return userEvents[event.id];
            });

            const container = document.querySelector('[data-user-events-list]');

            for (data in userEventsData) {
              renderEvent(container, userEventsData[data], currentPage);
            }

            const removeRSVPButtons = document.querySelectorAll('[data-delete-event]');
            removeRSVPButtons.forEach(button => {
              button.addEventListener('click', function(event) {
                event.preventDefault();

                console.log('Remove RSVP button clicked');

                const eventId = event.target.getAttribute('id');

                const user = firebase.auth().currentUser;
                const usersRef = firebase.database().ref('users');
                usersRef.child(user.uid).child('events').child(eventId).remove()
                .then(() => {
                  console.log('User event removed from database');

                  // Remove user from event
                  const eventsRef = firebase.database().ref('events');
                  eventsRef.child(eventId).child('users').child(user.uid).remove()
                  .then(() => {
                    console.log('User removed from event');
                    window.location.reload();
                  })
                })
                .catch(function(error) {
                  console.log(error);
                });
              })
            });
          })
        })
      }

      if (currentPage === '/create.html') {

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

            window.location.href = '/';
          });
        }
      }

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

      // Hide login button
      if (loginButton) {
        loginButton.style.display = 'none';
      }

      // Hide signup button
      if (registerButton) {
        registerButton.style.display = 'none';
      }
    } else {
      currentUser = null;
      console.log('No user is signed in.');
    }
  });

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

        // Add user to event
        const eventRef = firebase.database().ref('events');
        eventRef.child(eventId).child('users').child(user.uid).set(true)
        .then(() => {
          console.log('User added to event');
        })
        .catch(function(error) {
          console.log(error);
        });
      })
      .catch(function(error) {
        console.log(error);
      });
    })
  });

  if (currentPage === '/event.html') {
    const eventId = parseInt(new URLSearchParams(window.location.search).get('id'), 10);
    const eventData = retrieveEventData(eventId, events);
    displayEventDetails(eventData);
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
const loginButton = document.querySelector('[data-login-button]');
const registerButton = document.querySelector('[data-register-button]');


logoutButton.addEventListener('click', function(event) {
  event.preventDefault();

  firebase.auth().signOut().then(function() {
    console.log('Signed Out');
    window.location.href = '/';
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
        window.location.href = '/';
      })
    })
    .catch(function(error) {
      console.log(error);
    });
  });
}
