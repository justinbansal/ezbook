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

export { setupJoinButtonListeners, setupRemoveRSVPButtonListeners };
