// client/js/app.js
document.addEventListener('DOMContentLoaded', () => {
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
    const selectedDateTimeISOField = document.getElementById('selected-datetime-iso');
    const bookingMessageEl = document.getElementById('booking-message');

    const searchEmailInput = document.getElementById('search-email-my-bookings');
    const findMyAppointmentsBtn = document.getElementById('find-my-appointments');
    const myAppointmentsListEl = document.getElementById('my-appointments-list');
    const myAppointmentsMessageEl = document.getElementById('my-appointments-message');

    let currentDate = new Date();
    let selectedDate = null; // Will store the selected YYYY-MM-DD string
    let selectedTimeSlot = null; // Will store HH:MM string

    // --- Calendar Logic ---
    const renderCalendar = () => {
        calendarGrid.innerHTML = ''; // Clear previous grid
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth(); // 0-indexed

        currentMonthYearEl.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(name => {
            const dayNameEl = document.createElement('div');
            dayNameEl.classList.add('calendar-day-name');
            dayNameEl.textContent = name;
            calendarGrid.appendChild(dayNameEl);
        });

        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('calendar-day', 'other-month');
            calendarGrid.appendChild(emptyCell);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('calendar-day');
            dayCell.textContent = day;
            const dayDate = new Date(year, month, day);
            const today = new Date();
            today.setHours(0,0,0,0); // Normalize today for comparison

            if (dayDate >= today) { // Only allow selection of current or future dates
                dayCell.classList.add('selectable');
                dayCell.dataset.date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                dayCell.addEventListener('click', handleDateClick);
            } else {
                dayCell.classList.add('other-month'); // Style past dates as unselectable
            }
            if (selectedDate === dayCell.dataset.date) {
                dayCell.classList.add('selected');
            }
            calendarGrid.appendChild(dayCell);
        }
    };

    const handleDateClick = (event) => {
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
    const salonOpeningHour = 9; // 9 AM
    const salonClosingHour = 17; // 5 PM
    const slotDurationMinutes = 60; // 1 hour slots

    const loadAvailableTimeSlots = async (dateStr) => {
        timeSlotsList.innerHTML = '<li>Loading available times...</li>';
        try {
            const startOfDay = new Date(dateStr + 'T00:00:00Z'); // Use Z for UTC to match Firestore storage if storing as ISO
            const endOfDay = new Date(dateStr + 'T23:59:59Z');

            const querySnapshot = await db.collection('appointments')
                .where('dateTime', '>=', startOfDay.toISOString())
                .where('dateTime', '<=', endOfDay.toISOString())
                .get();

            const bookedTimes = [];
            querySnapshot.forEach(doc => {
                const appDateTime = new Date(doc.data().dateTime);
                // Ensure comparison is in local time if appointments are booked in local time perception
                // Or consistently use UTC. Here, assuming dateTime stored in Firestore is ISO string easily convertible.
                bookedTimes.push(`${String(appDateTime.getHours()).padStart(2, '0')}:${String(appDateTime.getMinutes()).padStart(2, '0')}`);
            });

            const availableSlots = [];
            for (let hour = salonOpeningHour; hour < salonClosingHour; hour++) {
                for (let minute = 0; minute < 60; minute += slotDurationMinutes) {
                    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                    if (!bookedTimes.includes(timeStr)) {
                        availableSlots.push(timeStr);
                    }
                }
            }

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
            timeSlotsList.innerHTML = `<li>Error loading slots: ${error.message}</li>`;
            bookingMessageEl.textContent = `Error loading slots: ${error.message}`;
        }
    };

    // --- Booking Form Logic ---
    bookingForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        bookingMessageEl.textContent = 'Processing...';

        const dateTime = selectedDateTimeISOField.value;
        const clientName = document.getElementById('clientName').value.trim();
        const clientEmail = document.getElementById('clientEmail').value.trim().toLowerCase();
        const service = document.getElementById('service').value;

        if (!dateTime || !clientName || !clientEmail || !service) {
            bookingMessageEl.textContent = 'Please fill in all fields and select a time slot.';
            return;
        }

        try {
            await db.collection('appointments').add({
                dateTime: dateTime, // Store as ISO string (UTC is good practice)
                clientName: clientName,
                clientEmail: clientEmail,
                service: service,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            bookingMessageEl.textContent = 'Appointment booked successfully!';
            bookingForm.reset();
            bookingFormContainer.style.display = 'none';
            if (selectedDate) loadAvailableTimeSlots(selectedDate); // Refresh slots

        } catch (error) {
            console.error("Error booking appointment:", error);
            bookingMessageEl.textContent = `Booking failed: ${error.message}. Ensure your email is correct.`;
        }
    });

    // --- Manage My Appointments Logic ---
    findMyAppointmentsBtn.addEventListener('click', async () => {
        const email = searchEmailInput.value.trim().toLowerCase();
        if (!email) {
            myAppointmentsMessageEl.textContent = "Please enter your email address.";
            return;
        }
        myAppointmentsListEl.innerHTML = "Searching...";
        myAppointmentsMessageEl.textContent = "";

        try {
            const querySnapshot = await db.collection('appointments')
                .where('clientEmail', '==', email)
                .orderBy('dateTime', 'asc')
                .get();

            myAppointmentsListEl.innerHTML = '';
            if (querySnapshot.empty) {
                myAppointmentsListEl.innerHTML = "<p>No appointments found for this email.</p>";
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

            // Add event listeners for update/delete on these dynamically created buttons
            ul.querySelectorAll('.update-my-appointment').forEach(button => {
                button.addEventListener('click', handleUpdateMyAppointment);
            });
            ul.querySelectorAll('.delete-my-appointment').forEach(button => {
                button.addEventListener('click', handleDeleteMyAppointment);
            });

        } catch (error) {
            console.error("Error fetching my appointments:", error);
            myAppointmentsMessageEl.textContent = `Error fetching appointments: ${error.message}`;
            myAppointmentsListEl.innerHTML = `<p>Error: ${error.message}</p>`;
        }
    });

    const handleUpdateMyAppointment = async (event) => {
        const appointmentId = event.target.dataset.id;
        const currentDateTimeISO = event.target.dataset.currentDatetime;

        // For simplicity, prompt for new date and time. A real app would use a calendar/time picker.
        const newDateStr = prompt("Enter new date (YYYY-MM-DD):", currentDateTimeISO.substring(0, 10));
        if (!newDateStr) return;
        const newTimeStr = prompt("Enter new time (HH:MM, 24-hour format):", currentDateTimeISO.substring(11, 16));
        if (!newTimeStr) return;

        const newFullDateTime = new Date(`${newDateStr}T${newTimeStr}`);
        if (isNaN(newFullDateTime)) {
            alert("Invalid date or time format.");
            return;
        }
         if (newFullDateTime < new Date()) {
            alert("Cannot book appointments in the past.");
            return;
        }


        myAppointmentsMessageEl.textContent = "Checking availability and updating...";

        // Basic check for availability (simplified - does not check against other bookings for the *new* time)
        // A more robust check would query Firestore for the new slot before updating.
        // For this example, we'll rely on the user choosing an available slot (or the admin to fix conflicts).

        // IMPORTANT: To update, the user must be logged in if your rules require it.
        // For this public booking, we're relying on clientEmail match in rules if no central user login.
        // If Firebase auth.currentUser is null, updates might fail depending on rules.
        // For this specific setup, Firestore rules allow update if email matches (even without full login).
        // If user has an account and is logged in:
        if (!auth.currentUser && !confirm("You are not logged in. Updating will rely on email verification in the database rules. Do you want to proceed? For better security, log in if you have an account or contact us.")) {
             myAppointmentsMessageEl.textContent = "Update cancelled.";
             return;
        }


        try {
            await db.collection('appointments').doc(appointmentId).update({
                dateTime: newFullDateTime.toISOString() // Store as ISO
            });
            myAppointmentsMessageEl.textContent = 'Appointment time changed successfully! Please search again to see updates.';
            myAppointmentsListEl.innerHTML = ''; // Clear to prompt re-search
            if (selectedDate) loadAvailableTimeSlots(selectedDate); // Refresh main calendar if it's the same day
        } catch (error) {
            console.error("Error updating appointment:", error);
            myAppointmentsMessageEl.textContent = `Failed to change time: ${error.message}. You can only change your own bookings.`;
        }
    };

    const handleDeleteMyAppointment = async (event) => {
        const appointmentId = event.target.dataset.id;
        if (!confirm("Are you sure you want to cancel this appointment?")) return;

        myAppointmentsMessageEl.textContent = "Cancelling appointment...";
        // See comment in handleUpdateMyAppointment about auth.currentUser for security rules.
        if (!auth.currentUser && !confirm("You are not logged in. Deleting will rely on email verification in the database rules. Do you want to proceed? For better security, log in if you have an account or contact us.")) {
             myAppointmentsMessageEl.textContent = "Cancellation aborted.";
             return;
        }


        try {
            await db.collection('appointments').doc(appointmentId).delete();
            myAppointmentsMessageEl.textContent = 'Appointment cancelled successfully! Please search again to see updates.';
            myAppointmentsListEl.innerHTML = ''; // Clear to prompt re-search
            if (selectedDate) loadAvailableTimeSlots(selectedDate); // Refresh main calendar
        } catch (error) {
            console.error("Error deleting appointment:", error);
            myAppointmentsMessageEl.textContent = `Failed to cancel appointment: ${error.message}. You can only cancel your own bookings.`;
        }
    };

    // Initial calendar render
    renderCalendar();
});