// client/js/app.js
document.addEventListener('DOMContentLoaded', () => {
    // Auth UI Elements
    const userStatusEl = document.getElementById('user-status');
    const authFormsContainer = document.getElementById('auth-forms-container');
    const loginFormContainer = document.getElementById('login-form-container');
    const signupFormContainer = document.getElementById('signup-form-container');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignupLink = document.getElementById('show-signup');
    const showLoginLink = document.getElementById('show-login');
    const logoutButton = document.getElementById('logout-button');
    const loginErrorMessageEl = document.getElementById('login-error-message');
    const signupErrorMessageEl = document.getElementById('signup-error-message');

    // Booking System Elements
    const bookingSection = document.getElementById('booking-section');
    const calendarGrid = document.getElementById('calendar-grid');
    const currentMonthYearEl = document.getElementById('current-month-year');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const timeSlotsContainer = document.getElementById('time-slots-container');
    const selectedDateDisplay = document.getElementById('selected-date-display');
    const timeSlotsList = document.getElementById('time-slots-list');
    const bookingFormContainer = document.getElementById('booking-form-container');
    const bookingTimeDisplay = document.getElementById('booking-time-display');
    const bookingForm = document.getElementById('booking-form');
    const clientNameField = document.getElementById('clientName'); // Added for clarity
    const selectedDateTimeISOField = document.getElementById('selected-datetime-iso');
    const bookingMessageEl = document.getElementById('booking-message');

    // My Appointments Elements
    const myAppointmentsContainer = document.getElementById('my-appointments-container');
    const loadMyAppointmentsBtn = document.getElementById('load-my-appointments');
    const myAppointmentsListEl = document.getElementById('my-appointments-list');
    const myAppointmentsMessageEl = document.getElementById('my-appointments-message');

    let currentDate = new Date();
    let selectedDate = null;
    let selectedTimeSlot = null;
    let currentUser = null;

    // --- Authentication Logic ---
    auth.onAuthStateChanged(user => {
        currentUser = user;
        if (user) {
            console.log("Auth: User logged in:", user.email); // LOG 1
            userStatusEl.textContent = `Logged in as: ${user.email}`;
            authFormsContainer.classList.add('hidden');
            logoutButton.classList.remove('hidden');
            if (bookingSection) { // LOG 2: Check if bookingSection was found
                console.log("Auth: bookingSection found. Current classes before remove:", bookingSection.className);
                bookingSection.classList.remove('hidden');
                console.log("Auth: bookingSection classes after remove:", bookingSection.className); // Should not contain 'hidden'
            } else {
                console.error("Auth: bookingSection element NOT FOUND!"); // Critical error if this happens
            }
            myAppointmentsContainer.classList.remove('hidden');
            // Check if clientNameField exists before trying to set its value
            if (clientNameField) {
                clientNameField.value = user.displayName || '';
            } else {
                console.warn("Auth: clientNameField element NOT FOUND!");
            }
            console.log("Auth: Attempting to render calendar..."); // LOG 3
            renderCalendar();
            console.log("Auth: renderCalendar() call completed."); // LOG 4
            loadMyAppointments();
        } else {
            console.log("Auth: User logged out or no user."); // LOG 5
            userStatusEl.textContent = 'You are not logged in. Please login or sign up to book.';
            authFormsContainer.classList.remove('hidden');
            loginFormContainer.classList.remove('hidden'); // Show login by default
            signupFormContainer.classList.add('hidden');
            logoutButton.classList.add('hidden');
            if (bookingSection) { // Hide booking section if logged out
                bookingSection.classList.add('hidden');
            }
            myAppointmentsContainer.classList.add('hidden');
            myAppointmentsListEl.innerHTML = ''; // Clear appointments list
        }
    });

    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormContainer.classList.add('hidden');
        signupFormContainer.classList.remove('hidden');
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        signupFormContainer.classList.add('hidden');
        loginFormContainer.classList.remove('hidden');
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        signupErrorMessageEl.textContent = '';
        try {
            await auth.createUserWithEmailAndPassword(email, password);
            // User will be logged in via onAuthStateChanged
            signupForm.reset();
        } catch (error) {
            console.error("Sign up error:", error);
            signupErrorMessageEl.textContent = error.message;
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        loginErrorMessageEl.textContent = '';
        try {
            await auth.signInWithEmailAndPassword(email, password);
            // User will be logged in via onAuthStateChanged
            loginForm.reset();
        } catch (error) {
            console.error("Login error:", error);
            loginErrorMessageEl.textContent = error.message;
        }
    });

    logoutButton.addEventListener('click', async () => {
        try {
            await auth.signOut();
            // UI will update via onAuthStateChanged
        } catch (error) {
            console.error("Logout error:", error);
            alert("Error logging out: " + error.message);
        }
    });

    // --- Calendar Logic ---
    const renderCalendar = () => {
        console.log("renderCalendar: Function started."); // LOG 6
        if (!calendarGrid) {
            console.error("renderCalendar: calendarGrid element NOT FOUND!"); // Critical error
            return;
        }
        console.log("renderCalendar: Clearing calendarGrid. Current month:", currentDate.toLocaleString('default', { month: 'long' }));
        calendarGrid.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        currentMonthYearEl.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const startingDayOfWeek = firstDayOfMonth.getDay();
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        // Add day names header
        dayNames.forEach(name => { 
            const dayNameEl = document.createElement('div');
            dayNameEl.classList.add('calendar-day-name');
            dayNameEl.textContent = name;
            calendarGrid.appendChild(dayNameEl);
        });
        
        // Add empty cells for days before the 1st of month
        for (let i = 0; i < startingDayOfWeek; i++) { 
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('calendar-day', 'other-month');
            calendarGrid.appendChild(emptyCell);
        }
        
        // Add day cells for the current month
        for (let day = 1; day <= daysInMonth; day++) {
            console.log("renderCalendar: Processing day", day);
            const dayCell = document.createElement('div');
            dayCell.classList.add('calendar-day');
            dayCell.textContent = day;
            
            const dayDate = new Date(year, month, day);
            const today = new Date();
            today.setHours(0,0,0,0);
            
            if (dayDate >= today) {
                dayCell.classList.add('selectable');
                dayCell.dataset.date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                dayCell.addEventListener('click', handleDateClick);
            } else {
                dayCell.classList.add('other-month');
            }
            
            if (selectedDate === dayCell.dataset.date) {
                dayCell.classList.add('selected');
            }
            
            calendarGrid.appendChild(dayCell);
        }
        
        console.log("renderCalendar: Function finished. calendarGrid HTML length:", calendarGrid.innerHTML.length); // LOG 7
    };
    
    const handleDateClick = (event) => {
        console.log("handleDateClick: Date clicked:", event.target.dataset.date);
        document.querySelectorAll('.calendar-day.selected').forEach(el => el.classList.remove('selected'));
        event.target.classList.add('selected');
        selectedDate = event.target.dataset.date;
        selectedDateDisplay.textContent = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        timeSlotsContainer.style.display = 'block';
        bookingFormContainer.style.display = 'none';
        loadAvailableTimeSlots(selectedDate);
    };
    
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // --- Time Slot Logic ---
    const salonOpeningHour = 9;
    const salonClosingHour = 17;
    const slotDurationMinutes = 60;
    
    const loadAvailableTimeSlots = async (dateStr) => {
        console.log("loadAvailableTimeSlots: Loading time slots for date:", dateStr);
        timeSlotsList.innerHTML = '<li>Loading...</li>';
        try {
            const startOfDay = new Date(dateStr + 'T00:00:00Z');
            const endOfDay = new Date(dateStr + 'T23:59:59Z');
            
            console.log("loadAvailableTimeSlots: Querying Firestore for date range:", startOfDay.toISOString(), "to", endOfDay.toISOString());
            const querySnapshot = await db.collection('appointments')
                .where('dateTime', '>=', startOfDay.toISOString())
                .where('dateTime', '<=', endOfDay.toISOString())
                .get();
            
            const bookedTimes = [];
            querySnapshot.forEach(doc => {
                const appDateTime = new Date(doc.data().dateTime);
                bookedTimes.push(`${String(appDateTime.getHours()).padStart(2, '0')}:${String(appDateTime.getMinutes()).padStart(2, '0')}`);
            });
            
            console.log("loadAvailableTimeSlots: Booked times for this date:", bookedTimes);
            
            const availableSlots = [];
            for (let hour = salonOpeningHour; hour < salonClosingHour; hour++) {
                for (let minute = 0; minute < 60; minute += slotDurationMinutes) {
                    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                    if (!bookedTimes.includes(timeStr)) {
                        availableSlots.push(timeStr);
                    }
                }
            }
            
            console.log("loadAvailableTimeSlots: Available slots:", availableSlots);
            timeSlotsList.innerHTML = '';
            
            if (availableSlots.length === 0) {
                timeSlotsList.innerHTML = '<li>No available slots for this date.</li>';
                return;
            }
            
            availableSlots.forEach(time => {
                const li = document.createElement('li');
                const button = document.createElement('button');
                button.textContent = time;
                button.addEventListener('click', () => {
                    console.log("Time slot selected:", time);
                    selectedTimeSlot = time;
                    document.querySelectorAll('#time-slots-list button').forEach(btn => btn.classList.remove('selected-time'));
                    button.classList.add('selected-time');
                    bookingFormContainer.style.display = 'block';
                    const fullDateTime = new Date(`${selectedDate}T${selectedTimeSlot}`);
                    selectedDateTimeISOField.value = fullDateTime.toISOString();
                    bookingTimeDisplay.textContent = `${fullDateTime.toLocaleDateString()} at ${selectedTimeSlot}`;
                    bookingMessageEl.textContent = '';
                });
                li.appendChild(button);
                timeSlotsList.appendChild(li);
            });
        } catch (error) {
            console.error("Error loading time slots:", error);
            timeSlotsList.innerHTML = `<li>Error: ${error.message}</li>`;
            bookingMessageEl.textContent = `Error: ${error.message}`;
        }
    };

    // --- Booking Form Logic ---
    bookingForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!currentUser) {
            bookingMessageEl.textContent = 'You must be logged in to book.';
            return;
        }
        
        console.log("bookingForm: Submitting booking form");
        bookingMessageEl.textContent = 'Processing...';
        const dateTime = selectedDateTimeISOField.value;
        const clientName = clientNameField.value.trim();
        const service = document.getElementById('service').value;

        if (!dateTime || !clientName || !service) {
            bookingMessageEl.textContent = 'Please fill in all fields and select a time slot.';
            return;
        }

        try {
            console.log("bookingForm: Adding appointment to Firestore:", {
                dateTime,
                clientName,
                clientEmail: currentUser.email,
                service,
                creatorUid: currentUser.uid
            });
            
            await db.collection('appointments').add({
                dateTime: dateTime,
                clientName: clientName,
                clientEmail: currentUser.email,
                service: service,
                creatorUid: currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log("bookingForm: Appointment successfully added to Firestore");
            bookingMessageEl.textContent = 'Appointment booked successfully!';
            bookingForm.reset();
            clientNameField.value = currentUser.displayName || '';
            bookingFormContainer.style.display = 'none';
            if (selectedDate) loadAvailableTimeSlots(selectedDate);
            loadMyAppointments(); // Refresh "My Appointments" list

        } catch (error) {
            console.error("Error booking appointment:", error);
            bookingMessageEl.textContent = `Booking failed: ${error.message}.`;
        }
    });

    // --- Manage My Appointments Logic ---
    loadMyAppointmentsBtn.addEventListener('click', loadMyAppointments);

    async function loadMyAppointments() {
        console.log("loadMyAppointments: Loading appointments for user:", currentUser?.uid);
        if (!currentUser) {
            myAppointmentsMessageEl.textContent = "Please login to see your appointments.";
            myAppointmentsListEl.innerHTML = '';
            return;
        }
        
        myAppointmentsListEl.innerHTML = "Loading your appointments...";
        myAppointmentsMessageEl.textContent = "";

        try {
            const querySnapshot = await db.collection('appointments')
                .where('creatorUid', '==', currentUser.uid)
                .orderBy('dateTime', 'asc')
                .get();

            console.log("loadMyAppointments: Found", querySnapshot.size, "appointments");
            myAppointmentsListEl.innerHTML = '';
            
            if (querySnapshot.empty) {
                myAppointmentsListEl.innerHTML = "<p>You have no appointments scheduled.</p>";
                return;
            }

            const ul = document.createElement('ul');
            querySnapshot.forEach(doc => {
                const app = doc.data();
                const li = document.createElement('li');
                const appointmentDate = new Date(app.dateTime);
                const isPast = appointmentDate < new Date();

                li.innerHTML = `
                    <strong>Date:</strong> ${appointmentDate.toLocaleDateString()}
                    <strong>Time:</strong> ${appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} <br>
                    <strong>Client:</strong> ${app.clientName} (Email: ${app.clientEmail}) <br>
                    <strong>Service:</strong> ${app.service} <br>
                    <strong>Status:</strong> ${isPast ? 'Completed/Past' : 'Upcoming'}
                    ${!isPast ? `
                    <button class="update-my-appointment" data-id="${doc.id}" data-current-datetime="${app.dateTime}">Change Time</button>
                    <button class="delete-my-appointment" data-id="${doc.id}">Cancel Appointment</button>
                    ` : ''}
                `;
                ul.appendChild(li);
            });
            myAppointmentsListEl.appendChild(ul);

            console.log("loadMyAppointments: Setting up event handlers for appointment actions");
            ul.querySelectorAll('.update-my-appointment').forEach(button => {
                button.addEventListener('click', handleUpdateMyAppointment);
            });
            ul.querySelectorAll('.delete-my-appointment').forEach(button => {
                button.addEventListener('click', handleDeleteMyAppointment);
            });

        } catch (error) {
            console.error("Error fetching my appointments:", error);
            myAppointmentsMessageEl.textContent = `Error fetching appointments: ${error.message}`;
        }
    }

    // --- Update/Delete Logic ---
    const handleUpdateMyAppointment = async (event) => {
        const appointmentId = event.target.dataset.id;
        const currentDateTimeISO = event.target.dataset.currentDatetime;
        
        console.log("handleUpdateMyAppointment: Updating appointment", appointmentId, "current datetime:", currentDateTimeISO);

        const newDateStr = prompt("Enter new date (YYYY-MM-DD):", currentDateTimeISO.substring(0, 10));
        if (!newDateStr) return;
        const newTimeStr = prompt("Enter new time (HH:MM, 24-hour format):", currentDateTimeISO.substring(11, 16));
        if (!newTimeStr) return;

        const newFullDateTime = new Date(`${newDateStr}T${newTimeStr}`);
        if (isNaN(newFullDateTime)) {
            console.error("handleUpdateMyAppointment: Invalid date/time format provided:", newDateStr, newTimeStr);
            alert("Invalid date or time format.");
            return;
        }
        if (newFullDateTime < new Date()) {
            console.error("handleUpdateMyAppointment: Attempted to book in the past:", newFullDateTime);
            alert("Cannot book appointments in the past.");
            return;
        }

        myAppointmentsMessageEl.textContent = "Updating...";
        try {
            console.log("handleUpdateMyAppointment: Updating appointment with new datetime:", newFullDateTime.toISOString());
            await db.collection('appointments').doc(appointmentId).update({
                dateTime: newFullDateTime.toISOString()
            });
            console.log("handleUpdateMyAppointment: Update successful");
            myAppointmentsMessageEl.textContent = 'Appointment time changed successfully!';
            loadMyAppointments(); // Refresh the list
            if (selectedDate === newDateStr || selectedDate === currentDateTimeISO.substring(0,10)) {
                loadAvailableTimeSlots(selectedDate);
            }
        } catch (error) {
            console.error("Error updating appointment:", error);
            myAppointmentsMessageEl.textContent = `Failed to change time: ${error.message}.`;
        }
    };

    const handleDeleteMyAppointment = async (event) => {
        const appointmentId = event.target.dataset.id;
        console.log("handleDeleteMyAppointment: Attempting to delete appointment", appointmentId);
        
        if (!confirm("Are you sure you want to cancel this appointment?")) {
            console.log("handleDeleteMyAppointment: User cancelled deletion");
            return;
        }

        myAppointmentsMessageEl.textContent = "Cancelling...";
        try {
            console.log("handleDeleteMyAppointment: Deleting appointment from Firestore");
            await db.collection('appointments').doc(appointmentId).delete();
            console.log("handleDeleteMyAppointment: Delete successful");
            myAppointmentsMessageEl.textContent = 'Appointment cancelled successfully!';
            loadMyAppointments(); // Refresh the list
            if (selectedDate) loadAvailableTimeSlots(selectedDate); // Refresh calendar view
        } catch (error) {
            console.error("Error deleting appointment:", error);
            myAppointmentsMessageEl.textContent = `Failed to cancel appointment: ${error.message}.`;
        }
    };
    // Initial calendar render is now called within onAuthStateChanged after user logs in.
});