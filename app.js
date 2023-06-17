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
    total_spots: 5
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
    total_spots: 20
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
    total_spots: 4
  },
]

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
    total_spots
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
    id: Math.random().toString(36).substr(2, 9),
  }
}

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

function retrieveEventData(eventId) {
  const eventData = rawEvents.find(event => event.id === eventId);

  return eventData;
}

if (rawEvents.length > 0) {
  const events = rawEvents.map(createEvent);
  console.log(events);

  const container = document.getElementById('main');
  events.forEach(event => renderEvent(container, event));

  const eventLinks = container.querySelectorAll('.event a');
  eventLinks.forEach(link => {
    link.addEventListener('click', handleEventClick);
  });
}

function handleEventClick(event) {
  event.preventDefault();

  const eventId = event.target.href.split('?id=')[1];
  const eventData = retrieveEventData(eventId);

  window.location.href = `event.html?id=${eventId}`;
}
