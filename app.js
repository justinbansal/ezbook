const rawEvents = [
  {
    title: 'Movies',
    location: 'VIP Cineplex',
    date: '29/06/23',
    time: '8-10pm',
    cost: 20,
    tags: ['chill'],
    host: 'Sally',
    description: 'Drink, Eat, Bowl',
    people: ['Jane', 'Sally'],
    total_spots: 5,
    id: 1
  },
  {
    title: 'Biking',
    location: 'Caledon',
    date: '1/07/23',
    time: '8-10am',
    cost: 0,
    tags: ['active', 'social'],
    host: 'Martin',
    description: 'Biking on the Caledon Trail',
    people: ['Martin'],
    total_spots: 20,
    id: 2,
  },
  {
    title: 'Bowling',
    location: 'Yorkdale',
    date: '20/06/23',
    time: '7-9pm',
    cost: 25,
    tags: ['active', 'social'],
    host: 'John',
    description: 'Drink, Eat, Bowl',
    people: ['John', 'Martin', 'Jane', 'Sally'],
    total_spots: 4,
    id: 3,
  },
];

function createEvent(options) {
  const {
    title,
    location,
    date,
    time,
    cost,
    tags,
    host,
    description,
    people,
    total_spots,
    id,
  } = options;

  return {
    title,
    location,
    date,
    time,
    cost,
    tags,
    host,
    description,
    people,
    total_spots,
    status: people.length < total_spots ? 'open' : 'full',
    id,
  }
}

let events;

function renderEvent(container, event) {
  const link = document.createElement('a');
  link.href = `event.html?id=${event.id}`;

  const div = document.createElement('div');
  div.classList.add('event');
  div.innerHTML = `
    <h2>${event.title}</h2>
    <p>${event.description}</p>
    <p>${event.date} ${event.time}</p>
    <p>${event.location}</p>
  `;
  link.appendChild(div);
  container.appendChild(link);
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
  const currentPage = window.location.pathname.split('/').pop();
  events = rawEvents.map(createEvent);

  if (currentPage == 'index.html') {
    const container = document.getElementById('main');
    events.forEach(event => renderEvent(container, event));

    const eventLinks = container.querySelectorAll('.event a');
    eventLinks.forEach(link => {
      link.addEventListener('click', handleEventClick);
    });
  }

  if (currentPage === 'event.html') {
    const eventId = parseInt(new URLSearchParams(window.location.search).get('id'), 10);
    const eventData = retrieveEventData(eventId, events);
    displayEventDetails(eventData);
  }
});

function handleEventClick(event) {
  event.preventDefault();

  const eventId = event.target.getAttribute('href').split('?id=')[1];

  window.location.href = `event.html?id=${eventId}`;
}
