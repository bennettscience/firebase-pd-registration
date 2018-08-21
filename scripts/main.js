'use strict'
let codes = [];

/**
 * PDReg - Main function Class
 *
 */
function PDReg() {
  this.checkSetup();

  // Interact with the document
  this.signInButton = document.getElementById('sign-in-button');
  this.signOutButton = document.getElementById('sign-out-button');
  this.userPic = document.getElementById('user-pic');
  this.stringName = document.getElementById('string-name');
  this.userName = document.getElementById('user-name');
  this.userEmail = document.getElementById('user-email');
  this.courseForm = document.getElementById('course-form');
  this.submitButton = document.getElementById('submit');
  this.userCoursesButton = document.getElementById('collection');
  this.hideUserCoursesButton = document.getElementById('hide-user-courses');
  this.userCoursesBadge = document.getElementById('user-courses-badge');
  this.userCourses = document.getElementById('user-courses-list')
  this.allCourses = document.getElementById('allCourses');
  this.search = document.getElementById('search-wrap');
  this.userInput = document.getElementById('user-input');
  this.subscribeButton = document.getElementById('push-button');
  this.sorting = document.getElementById('sorting')
  this.sidebar = document.getElementById('slide-out')
  this.building = document.getElementById('user-building-select')
  this.registerBuilding = document.getElementById('user-building-splash')
  this.registerBuildingButton = document.getElementById('user-building-splash-submit')

  // Do stuff when buttons are clicked
  this.signOutButton.addEventListener('click', this.signOut.bind(this));
  this.signInButton.addEventListener('click', this.signIn.bind(this));
  this.userCoursesButton.addEventListener('click', this.showUserClasses.bind(this));
  this.hideUserCoursesButton.addEventListener('click', this.hideUserClasses.bind(this))
  this.registerBuildingButton.addEventListener('click', this.registerUserBuilding.bind(this))


  // listen for the registration button
  this.courseForm.addEventListener('submit', this.register.bind(this));

  this.initFirebase();
}

PDReg.prototype.registerUserBuilding = function() {
  console.log(this.building.value)
}.bind(this)

/**
 * PDReg.prototype.initFirebase - Connect to firebase
 *
 */
PDReg.prototype.initFirebase = function() {
  this.auth = firebase.auth();
  this.database = firebase.database();

  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
};

/**
 * PDReg.prototype.signOut - Sign out of the current user
 */
PDReg.prototype.signOut = function() {
  this.auth.signOut();
};

/**
 * PDReg.prototype.signIn - Sign into a Google account with Firebase OAuth2 API
 *
 */
PDReg.prototype.signIn = function() {
  var provider = new firebase.auth.GoogleAuthProvider();
  this.auth.signInWithPopup(provider);
};

/**
 * PDReg.prototype.checkSignedInWithMessage - Check that a user is signed in.
 *
 * @return {Boolean}
 */
PDReg.prototype.checkSignedInWithMessage = function() {
  if (this.auth.currentUser) {
    return true;
  }
};

// TODO: onboarding for first time user
// TODO: require ECS email domain for login - add to rules manifest

/**
 * PDReg.prototype.onAuthStateChanged - Listen for sign in/out events
 *
 * @param  {Object} user authenticated user object from the firebase auth API
 */
PDReg.prototype.onAuthStateChanged = function(user) {
  if(!user) {
    document.getElementById('login-splash').classList.remove('hidden');

    document.getElementById('user-building-splash').classList.add('hidden')
    this.courseForm.classList.add('hidden');
    this.search.classList.add('hidden');

    this.sidebar.classList.add('hidden')
    this.signInButton.classList.remove('hidden');
  } else {
    return firebase.database().ref('users/' + user.uid).once('value')
    .then(function(snap) {
      const userData = snap.val()
      if(user && !snap.hasChild('building')) {
        // buildSchools()
        document.getElementById('login-splash').classList.add('hidden')
        document.getElementById('user-building-splash').classList.remove('hidden')
        this.courseForm.classList.add('hidden');
        this.search.classList.add('hidden');

        this.sidebar.classList.add('hidden')
      }
      else if (user && snap.hasChild('building')) { // User is signed in!
        // Get profile pic and user's name from the Firebase user object.
        var stringName = user.displayName;
        var userName = user.email.split('@')[0];
        console.log(user)

        // Set the user's profile picture and name.
        // this.userPic.setAttribute('src', profilePicUrl);
        this.userEmail.textContent = user.email;

        this.stringName.textContent = stringName;
        this.courseForm['name'].value = stringName;
        this.courseForm['email'].value = user.email;
        this.courseForm['userName'].value = userName;

        // Show user's profile and sign-out button.
        this.stringName.classList.remove('hidden');
        this.userPic.innerHTML = '<img class="circle" src="'+ user.photoURL +'"/>';
        this.userEmail.classList.remove('hidden');
        this.signOutButton.classList.remove('hidden');
        this.courseForm.classList.remove('hidden');
        this.search.classList.remove('hidden');
        this.userInput.classList.remove('hidden');
        this.subscribeButton.classList.remove('hidden')
        this.sorting.classList.remove('hidden')
        this.sidebar.classList.remove('hidden')

        // Hide sign-in button.
        this.signInButton.classList.add('hidden');

        document.getElementById('login-splash').classList.add('hidden')

        // this.userClasses(userName);
        this.getAllClasses(userName);
      } else { // User is signed out!

      }
    }.bind(this))
  }
}


/**
 * PDReg.prototype.register - description
 *
 * Push checked inputs to /users and /courses tables in firebase
 * This is pushing plaintext usernames right now.
 *
 * @param  {Object} e form data
 */
PDReg.prototype.register = function(e) {
  e.preventDefault();
  var form = this.courseForm;
  var classes = [];
  var user = firebase.auth().currentUser;

  for (var i=0; i<form.elements.length; i++) {
    if (form.elements[i].checked) {
      var title = form.elements[i].parentElement.querySelector('.card-title').innerHTML
      var id = form.elements[i].value;
      var code = form.elements[i].parentElement.nextSibling.nextSibling.childNodes[1].childNodes[0].value
      if(code.length === 0) {
        code = "Code"
      }
      classes.push({title, id, code});
    }
  }

  var buildNewRegCourse = function(snapshot) {
    var course = snapshot.val();
    course.key = snapshot.key;

    var parentDiv = document.getElementById("user-courses-list");

    if(!parentDiv.querySelector("[id='user_" + course.key + "']")) {
      var container = document.createElement('div');
      container.innerHTML = PDReg.USER_TEMPLATE;
      container.setAttribute("id", "user_" + course.key)
      container.setAttribute("class", "collection-item");
      container.getElementsByTagName("a")[0].setAttribute("id", "cancel_"+course.key);

      container.querySelector('.title').textContent = course.title;
      container.querySelector('.date').textContent = smallFormat(course.start);
      container.querySelector('.location').textContent = course.loc;
      container.querySelector('.contact').innerHTML = `<a href='mailto:${course.pocEmail}'>${course.poc}</a>`


      parentDiv.appendChild(container);

      container.querySelector(".cancel").addEventListener('click', this.cancel.bind(this));
    }
  }.bind(this)

  var postTheClass = function(classes) {
    var promises = [];
    classes.forEach(function(item) {
       firebase.database().ref('courses/' + item['id'] + '/members/' + user.uid).set({'code': item['code'], 'email': user.email})
      .then(function() {
        firebase.database().ref('courses/' + item['id']).once('value').then(function(snap) {
          document.getElementById('allCourses').removeChild(document.getElementById(snap.key))
          M.toast({html: "Successfully registered for " + item['title']})
          firebase.database().ref('users/' + user.uid + '/regs/' + item['id']).set(true)
          buildNewRegCourse(snap)
        })
      })
      .catch(function(e) {
        console.log('error!', e)
        M.toast({html: "Registration failed for " + item['title'] + ". Please check your registration code", classes: 'red'})
      })
    })
  }

  postTheClass(classes);

  // Update the UI with the number of user registrations
  this.database.ref('users/' + user.uid + '/regs').on('child_changed',
    function(snapshot) {
      this.userCoursesBadge.textContent = snapshot.numChildren();
  }.bind(this));

};

// Model for registrations
PDReg.USER_TEMPLATE = `
  <div class="info"><span class="title"></span><span class="date"></span><span class="location"></span><span class="contact"></span></div><a class="cancel secondary-content">cancel<i class="material-icons">cancel</i></a></div>
`;

// Model for classes available for registration.
// TODO: FIX FORM CHECKBOXES
PDReg.CLASS_TEMPLATE =
  '<div class="card large class-container">' +
    '<div class="card-image waves-effect waves-block waves-light"></div>' +
    '<div class="card-content">' +
      '<label for="">' +
        '<input name="course" class="filled-in" value="" id="" type="checkbox" />' +
        '<span class="sort-title card-title grey-text text-darken-4"></span>' +
      '</label>' +
      '<div class="date grey-text text-darken-1"></div>' +
      '<div class="code hidden"><i class="material-icons prefix">lock</i><div class="input-field inline"><input name="code" type="text" value="" /><label for="code">Registration code</label></div></div>' +
    '</div>'+
    '<div class="card-action">' +
      '<a class="btn btn-grey activator">More Information</a>' +
    '</div>' +
    '<div class="card-reveal">' +
      '<span class="card-title grey-text text-darken-4"><i class="material-icons right">close</i></span>' +
      '<span class="card-desc"></span>' +
      '<hr />' +
      '<div class="details">' +
        '<span class="seats"></span>' +
        '<span class="contact"></span>' +
        '<span class="location"></span>' +
      '</div>'
    '</div>' +
  '</div>';


/**
 * PDReg.prototype.buildUserClasses - Create all classes the user is registered for to populate the sidebar
 *
 * @param  {Object} course Course object data as JSON to create DOM elements
 */
PDReg.prototype.buildUserClasses = function(course) {
  console.log("Got a new course, ", course)
  var parentDiv = document.getElementById("user-courses-list");

  if(!parentDiv.querySelector("[id='user_" + course.key + "']")) {
    var container = document.createElement('div');
    container.innerHTML = PDReg.USER_TEMPLATE;
    container.setAttribute("id", "user_" + course.key)
    container.setAttribute("class", "collection-item");
    container.getElementsByTagName("a")[0].setAttribute("id", "cancel_"+course.key);

    container.querySelector('.title').textContent = course.title;
    container.querySelector('.date').textContent = smallFormat(course.start);
    container.querySelector('.location').textContent = course.loc;
    container.querySelector('.contact').innerHTML = `<a href='mailto:${course.pocEmail}'>${course.poc}</a>`

    parentDiv.appendChild(container);

    container.querySelector(".cancel").addEventListener('click', this.cancel.bind(this));
  }
}

PDReg.prototype.showUserClasses = function() {
  document.getElementById('user-courses-head').innerHTML = "<h2>" + firebase.auth().currentUser.displayName + "</h2>";
  document.getElementById('user-courses-wrap').classList.toggle('hidden');
  this.userCoursesButton.classList.toggle('active');
}

PDReg.prototype.hideUserClasses = function() {
  document.getElementById('user-courses-wrap').classList.toggle('hidden');
}

/**
 * PDReg.prototype.buildAllClasses - Create DOM elements for all courses open for registration
 *
 * @param  {Object} course JSON object with course data to create a DOM element
 */
PDReg.prototype.buildAllClasses = function(course) {
  var parentDiv = document.getElementById("allCourses");

  if(!parentDiv.querySelector("[id='" + course.key + "']")) {
    var container = document.createElement('div');
    container.innerHTML = PDReg.CLASS_TEMPLATE;
    var div = container.children[0];
    div.setAttribute('id', course.key);
    div.getElementsByTagName('input')[0].setAttribute('value', course.key);
    div.getElementsByTagName('input')[0].setAttribute('id', "card-"+course.key);
    div.getElementsByTagName('label')[0].setAttribute('for', "card-"+course.key);
    div.getElementsByTagName('input')[1].setAttribute('id', "code-"+course.key);
    div.getElementsByTagName('label')[1].setAttribute('for', "code-"+course.key);
    div.setAttribute('data-dan', course.dan);
    div.setAttribute('data-date', course.start)
    div.setAttribute('data-title', course.title)
    parentDiv.appendChild(div);

    div.querySelector('.card-title').textContent = course.title;
    div.querySelector('.date').textContent = format(course.start);
    div.querySelector('.card-desc').innerHTML = course.desc;
    div.querySelector('.card-image').innerHTML = "<img class='activator' src='" + getBg() + "' />'";
    div.querySelector('.seats').textContent = "Seats: " + course.seats;
    div.querySelector('.contact').innerHTML = `Contact: <a href='mailto:${course.pocEmail}'>${course.poc}</a>`
    div.querySelector('.location').textContent = "Location: " + course.loc;
    codes.push({
      'id': course.key,
      'code': course.code
    })

    if(course.code !== 'Code') {
      div.querySelector('.code').classList.remove('hidden');
    }
  }
}

/**
 * PDReg.prototype.checkSetup - Display an error message if firebase is not configured correctly
 *
 * @returns {type}  description
 */
PDReg.prototype.checkSetup = function() {
  if (!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions and make ' +
        'sure you are running the codelab using `firebase serve`');
  }
}

/**
 * PDReg.prototype.getAllClasses - Get the user's courses as an array of JSON objects from Firebase
 *
 * @param  {String} userName The current signed in user
 */
PDReg.prototype.getAllClasses = function() {
  this.database = firebase.database()
  var uid = firebase.auth().currentUser.uid;
  var courses = [];
  var today = new Date().toISOString();

  this.classesRef = this.database.ref('courses');

  this.userRef = this.database.ref('users/' + uid + "/regs");

    var setClass = function(snapshot) {
      var course = snapshot.val();
      course.key = snapshot.key;

      if(course.members) {
        console.log("There are members")
        if(course.members.hasOwnProperty(uid)) {
          console.log("You are the member, building a class")
          this.buildUserClasses(course);
        } else {
          this.buildAllClasses(course)
        }
      } else {
        this.buildAllClasses(course)
      }
    }.bind(this);

    this.userRef.on('value', function(snapshot) {
       document.getElementById('user-courses-badge').textContent = snapshot.numChildren();
    });

    this.classesRef.orderByChild('start').startAt(today).on('child_added', setClass);
    //this.classesRef.on('child_changed', setClass);
};



/**
 * PDReg.prototype.cancel - Remove a user's course from the databse
 *
 * @param  {Object} e Course data to remove from Firebase
 * @returns {type}   description
 */
PDReg.prototype.cancel = function(e) {
  var uid = firebase.auth().currentUser.uid;
  this.auth = firebase.auth().currentUser.email;

  var id = e.target.parentNode.id.split("_")[1];

  // All classes database and user registration child
  this.classesRef = this.database.ref('courses/' + id + '/members/' + uid);

  // User registrations index and child
  this.userRef = this.database.ref('users/' + uid + '/regs/' + id);
  this.userChild = this.userRef.child('users/' + uid);

  this.classesRef.set(null);
  this.userRef.set(null);

  document.getElementById('user-courses-list').removeChild(document.getElementById('user_' + id));

  var buildCourse = function(snap) {
    var course = snap.val();
    course.key = snap.key;
    // reused from main object methods. Hacky, but it works.
    //TODO: Refactor someday.
    var parentDiv = document.getElementById("allCourses");

    if(!parentDiv.querySelector("[id='" + course.key + "']")) {
      var container = document.createElement('div');
      container.innerHTML = PDReg.CLASS_TEMPLATE;
      var div = container.children[0];
      div.setAttribute('id', course.key);
      div.getElementsByTagName('input')[0].setAttribute('value', course.key);
      div.getElementsByTagName('input')[0].setAttribute('id', "card-"+course.key);
      div.getElementsByTagName('label')[0].setAttribute('for', "card-"+course.key);
      div.getElementsByTagName('input')[1].setAttribute('id', "code-"+course.key);
      div.getElementsByTagName('label')[1].setAttribute('for', "code-"+course.key);
      div.setAttribute('data-dan', course.dan);
      div.setAttribute('data-date', course.start)
      div.setAttribute('data-title', course.title)
      parentDiv.appendChild(div);

      div.querySelector('.card-title').textContent = course.title;
      div.querySelector('.date').textContent = format(course.start);
      div.querySelector('.card-desc').innerHTML = course.desc;
      div.querySelector('.card-image').innerHTML = "<img class='activator' src='" + getBg() + "' />'";
      div.querySelector('.seats').textContent = "Seats: " + course.seats;
      div.querySelector('.contact').innerHTML = `<a href='mailto:${course.pocEmail}'>${course.poc}</a>`
      div.querySelector('.location').textContent = "Location: " + course.loc;

      codes.push({
        'id': course.key,
        'code': course.code
      })

      if(course.code !== 'Code') {
        div.querySelector('.code').classList.remove('hidden');
      }
    }
  }

  // TODO: This is hacky. Debug child element addition from events.
  // document.getElementById(id).classList.remove('hidden')
  // document.getElementById(id).getElementsByTagName('input')[0].checked = false;

  this.database.ref('users/' + uid + '/regs').on('value', function(snapshot) {
    this.userCoursesBadge.textContent = snapshot.numChildren();
  }.bind(this));

  this.database.ref('courses/' + id).on('value', buildCourse)
}

/**
 *  Load the PDReg Class and initialize Firebase.
 */
window.onload = function() {
  window.pdReg = new PDReg();
}

const messaging = firebase.messaging(),
      database  = firebase.database(),
      pushBtn   = document.getElementById('push-button')

let userToken    = null,
    isSubscribed = false

window.addEventListener('load', () => {

    if ('serviceWorker' in navigator) {

        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
              console.log(registration)
                messaging.useServiceWorker(registration)

                initializePush()
            })
            .catch(err => console.log('Service Worker Error', err))

    } else {
        pushBtn.textContent = 'Push not supported.'
    }

})

function initializePush() {

    userToken = localStorage.getItem('pushToken')

    isSubscribed = userToken !== null
    updateBtn()

    pushBtn.addEventListener('click', () => {
        pushBtn.disabled = true

        if (isSubscribed) return unsubscribeUser()

        return subscribeUser()
    })
}

function updateBtn() {

    if (Notification.permission === 'denied') {
        pushBtn.textContent = 'Subscription blocked'
        return
    }

    pushBtn.textContent = isSubscribed ? 'Unsubscribe' : 'Subscribe'
    pushBtn.disabled = false
}

function subscribeUser() {

    messaging.requestPermission()
        .then(() => messaging.getToken())
        .then(token => {

            updateSubscriptionOnServer(token)
            isSubscribed = true
            userToken = token
            localStorage.setItem('pushToken', token)
            updateBtn()
        })
        .catch(err => console.log('Denied', err))

}

function updateSubscriptionOnServer(token) {
    if (isSubscribed) {
        return database.ref('device_ids').once('value').then(snap => {
          snap.forEach(device => {
            if (device.val() === token) {
              device.ref.remove();
            }
          })
        })
    }

    database.ref('device_ids').once('value')
        .then(snapshots => {
            let deviceExists = false

            snapshots.forEach(childSnapshot => {
                if (childSnapshot.val() === token) {
                    deviceExists = true
                    return console.log('Device already registered.');
                }

            })

            if (!deviceExists) {
                M.toast({html: 'Successfully subscribed to reminders'})
                return database.ref('device_ids').push(token)
            }
        })
}

function unsubscribeUser() {

    messaging.deleteToken(userToken)
        .then(() => {
            updateSubscriptionOnServer(userToken)
            isSubscribed = false
            userToken = null
            localStorage.removeItem('pushToken')
            updateBtn()
            M.toast({ html: 'Successfully unsubscribed from notifications.' })
        })
        .catch(err => console.log('Error unsubscribing', err))
}
