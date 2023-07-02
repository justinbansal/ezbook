function handleRoute(route) {
  // Handle route changes

  if (route === '/home') {
    // Display events on the page
    // loadApp();
    console.log('home');
  } else if (route === '/user') {
    // Display user's details and events
  } else if (route === '/event') {
    // Display event details
  } else if (route === '/') {
  console.log('home page');
  }
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

export { handleRoute, navigateTo };
