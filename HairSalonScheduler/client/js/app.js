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
            userStatusEl.textContent = `Logged in as: ${user.email}`;
            authFormsContainer.classList.add('hidden');
            logoutButton.classList.remove('hidden');
            bookingSection.classList.remove('hidden');
            myAppointmentsContainer.classList.remove('hidden');
            clientNameField.value = user.displayName || ''; // Pre-fill name if available
            renderCalendar(); // Render calendar now that user is logged in
            loadMyAppointments(); // Automatically load user's appointments
        } else {
            userStatusEl.textContent = 'You are not logged in. Please login or sign up to book.';
            authFormsContainer.classList.remove('hidden');
            loginFormContainer.classList.remove('hidden'); // Show login by default
            signupFormContainer.classList.add('hidden');
            logoutButton.classList.add('hidden');
            bookingSection.classList.add('hidden');
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

    // --- Calendar Logic (Identical to previous version) ---
    const renderCalendar = () => {
        calendarGrid.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        currentMonthYearEl.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const startingDayOfWeek = firstDayOfMonth.getDay();
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(name => { /* ... */ calendarGrid.appendChild(dayNameEl); });
        for (let i = 0; i < startingDayOfWeek; i++) { /* ... */ calendarGrid.appendChild(emptyCell); }
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div'); dayCell.classList.add('calendar-day'); dayCell.textContent = day;
            const dayDate = new Date(year, month, day); const today = new Date(); today.setHours(0,0,0,0);
            if (dayDate >= today) {
                dayCell.classList.add('selectable');
                dayCell.dataset.date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                dayCell.addEventListener('click', handleDateClick);
            } else { dayCell.classList.add('other-month'); }
            if (selectedDate === dayCell.dataset.date) { dayCell.classList.add('selected'); }
            calendarGrid.appendChild(dayCell);
        }
    };
    const handleDateClick = (event) => { /* Identical */
        document.querySelectorAll('.calendar-day.selected').forEach(el => el.classList.remove('selected'));
        event.target.classList.add('selected'); selectedDate = event.target.dataset.date;
        selectedDateDisplay.textContent = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        timeSlotsContainer.style.display = 'block'; bookingFormContainer.style.display = 'none';
        loadAvailableTimeSlots(selectedDate);
    };
    prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });

    // --- Time Slot Logic (Identical to previous version) ---
    const salonOpeningHour = 9; const salonClosingHour = 17; const slotDurationMinutes = 60;
    const loadAvailableTimeSlots = async (dateStr) => { /* Identical */
        timeSlotsList.innerHTML = '<li>Loading...</li>';
        try {
            const startOfDay = new Date(dateStr + 'T00:00:00Z'); const endOfDay = new Date(dateStr + 'T23:59:59Z');
            const querySnapshot = await db.collection('appointments').where('dateTime', '>=', startOfDay.toISOString()).where('dateTime', '<=', endOfDay.toISOString()).get();
            const bookedTimes = []; querySnapshot.forEach(doc => { const appDateTime = new Date(doc.data().dateTime); bookedTimes.push(`${String(appDateTime.getHours()).padStart(2, '0')}:${String(appDateTime.getMinutes()).padStart(2, '0')}`); });
            const availableSlots = [];
            for (let hour = salonOpeningHour; hour < salonClosingHour; hour++) { for (let minute = 0; minute < 60; minute += slotDurationMinutes) { const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`; if (!bookedTimes.includes(timeStr)) { availableSlots.push(timeStr); } } }
            timeSlotsList.innerHTML = ''; if (availableSlots.length === 0) { timeSlotsList.innerHTML = '<li>No available slots for this date.</li>'; return; }
            availableSlots.forEach(time => { const li = document.createElement('li'); const button = document.createElement('button'); button.textContent = time;
                button.addEventListener('click', () => { selectedTimeSlot = time; document.querySelectorAll('#time-slots-list button').forEach(btn => btn.classList.remove('selected-time')); button.classList.add('selected-time'); bookingFormContainer.style.display = 'block'; const fullDateTime = new Date(`${selectedDate}T${selectedTimeSlot}`); selectedDateTimeISOField.value = fullDateTime.toISOString(); bookingTimeDisplay.textContent = `${fullDateTime.toLocaleDateString()} at ${selectedTimeSlot}`; bookingMessageEl.textContent = ''; });
                li.appendChild(button); timeSlotsList.appendChild(li); });
        } catch (error) { console.error("Error loading time slots:", error); timeSlotsList.innerHTML = `<li>Error: ${error.message}</li>`; bookingMessageEl.textContent = `Error: ${error.message}`; }
    };

    // --- Booking Form Logic (MODIFIED to use currentUser.uid and email) ---
    bookingForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!currentUser) {
            bookingMessageEl.textContent = 'You must be logged in to book.';
            return;
        }
        bookingMessageEl.textContent = 'Processing...';
        const dateTime = selectedDateTimeISOField.value;
        const clientName = clientNameField.value.trim(); // Get name from form field
        const service = document.getElementById('service').value;

        if (!dateTime || !clientName || !service) { // Email is from currentUser
            bookingMessageEl.textContent = 'Please fill in all fields and select a time slot.';
            return;
        }

        try {
            await db.collection('appointments').add({
                dateTime: dateTime,
                clientName: clientName, // Name provided in form
                clientEmail: currentUser.email, // Email from logged-in user
                service: service,
                creatorUid: currentUser.uid, // UID from logged-in user
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            bookingMessageEl.textContent = 'Appointment booked successfully!';
            bookingForm.reset();
            clientNameField.value = currentUser.displayName || ''; // Re-fill if available
            bookingFormContainer.style.display = 'none';
            if (selectedDate) loadAvailableTimeSlots(selectedDate);
            loadMyAppointments(); // Refresh "My Appointments" list

        } catch (error) {
            console.error("Error booking appointment:", error);
            bookingMessageEl.textContent = `Booking failed: ${error.message}.`;
        }
    });

    // --- Manage My Appointments Logic (MODIFIED for logged-in user) ---
    loadMyAppointmentsBtn.addEventListener('click', loadMyAppointments);

    async function loadMyAppointments() {
        if (!currentUser) {
            myAppointmentsMessageEl.textContent = "Please login to see your appointments.";
            myAppointmentsListEl.innerHTML = '';
            return;
        }
        myAppointmentsListEl.innerHTML = "Loading your appointments...";
        myAppointmentsMessageEl.textContent = "";

        try {
            const querySnapshot = await db.collection('appointments')
                .where('creatorUid', '==', currentUser.uid) // Query by creatorUid
                .orderBy('dateTime', 'asc')
                .get();

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

    // --- Update/Delete Logic (mostly same, relies on Firestore rules for auth) ---
    const handleUpdateMyAppointment = async (event) => {
        // currentUser check is implicitly handled by UI visibility and Firestore rules
        const appointmentId = event.target.dataset.id;
        const currentDateTimeISO = event.target.dataset.currentDatetime;

        const newDateStr = prompt("Enter new date (YYYY-MM-DD):", currentDateTimeISO.substring(0, 10));
        if (!newDateStr) return;
        const newTimeStr = prompt("Enter new time (HH:MM, 24-hour format):", currentDateTimeISO.substring(11, 16));
        if (!newTimeStr) return;

        const newFullDateTime = new Date(`${newDateStr}T${newTimeStr}`);
        if (isNaN(newFullDateTime)) { alert("Invalid date or time format."); return; }
        if (newFullDateTime < new Date()) { alert("Cannot book appointments in the past."); return; }

        myAppointmentsMessageEl.textContent = "Updating...";
        try {
            await db.collection('appointments').doc(appointmentId).update({
                dateTime: newFullDateTime.toISOString()
            });
            myAppointmentsMessageEl.textContent = 'Appointment time changed successfully!';
            loadMyAppointments(); // Refresh the list
            if (selectedDate === newDateStr || selectedDate === currentDateTimeISO.substring(0,10)) { // refresh calendar slots if changed date is visible
                loadAvailableTimeSlots(selectedDate);
            }
        } catch (error) {
            console.error("Error updating appointment:", error);
            myAppointmentsMessageEl.textContent = `Failed to change time: ${error.message}.`;
        }
    };

    const handleDeleteMyAppointment = async (event) => {
        const appointmentId = event.target.dataset.id;
        if (!confirm("Are you sure you want to cancel this appointment?")) return;

        myAppointmentsMessageEl.textContent = "Cancelling...";
        try {
            await db.collection('appointments').doc(appointmentId).delete();
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