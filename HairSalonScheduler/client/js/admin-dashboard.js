// client/js/admin-dashboard.js
document.addEventListener('DOMContentLoaded', () => {
    const adminWelcomeEl = document.getElementById('admin-welcome');
    const logoutButton = document.getElementById('logout-button');
    const appointmentsTbody = document.getElementById('admin-appointments-tbody');
    const adminTableMessageEl = document.getElementById('admin-table-message');

    const adminCreateForm = document.getElementById('admin-create-form');
    const adminCreateMessageEl = document.getElementById('admin-create-message');

    const filterDateInput = document.getElementById('filter-date');
    const clearFilterBtn = document.getElementById('clear-filter');
    const exportCsvButton = document.getElementById('export-csv');

    const updateModal = document.getElementById('update-modal');
    const updateIdField = document.getElementById('update-id');
    const updateDateTimeField = document.getElementById('update-datetime');
    const updateClientNameField = document.getElementById('update-clientName');
    const updateClientEmailField = document.getElementById('update-clientEmail');
    const updateServiceField = document.getElementById('update-service');
    const saveUpdateButton = document.getElementById('save-update-button');
    const cancelUpdateButton = document.getElementById('cancel-update-button');
    const updateModalMessageEl = document.getElementById('update-modal-message');

    let allAppointmentsCache = []; // For client-side filtering and CSV export

    // Protect this page & Verify Admin
    auth.onAuthStateChanged(user => {
        if (user) {
            if (user.uid === ADMIN_UID) { // ADMIN_UID is set in a <script> tag in admin-dashboard.html
                adminWelcomeEl.textContent = `Welcome, Admin (${user.email})`;
                loadAllAppointments();
            } else {
                alert("Access Denied: You are not authorized to view this page.");
                window.location.href = 'admin.html'; // or index.html
            }
        } else {
            window.location.href = 'admin.html'; // Not logged in, redirect to login
        }
    });

    logoutButton.addEventListener('click', async () => {
        try {
            await auth.signOut();
            window.location.href = 'admin.html';
        } catch (error) {
            console.error("Logout failed:", error);
            alert(`Logout failed: ${error.message}`);
        }
    });

    const loadAllAppointments = async (filterDate = null) => {
        adminTableMessageEl.textContent = 'Loading appointments...';
        appointmentsTbody.innerHTML = '';
        try {
            let query = db.collection('appointments').orderBy('dateTime', 'asc');

            const querySnapshot = await query.get();
            allAppointmentsCache = []; // Reset cache before filling

            querySnapshot.forEach(doc => {
                allAppointmentsCache.push({ id: doc.id, ...doc.data() });
            });

            renderAppointments(allAppointmentsCache, filterDate);
            adminTableMessageEl.textContent = '';

        } catch (error) {
            console.error("Error loading all appointments:", error);
            adminTableMessageEl.textContent = `Error loading appointments: ${error.message}`;
        }
    };

    const renderAppointments = (appointments, filterDate = null) => {
        appointmentsTbody.innerHTML = ''; // Clear existing rows
        let filteredAppointments = appointments;

        if (filterDate) {
            filteredAppointments = appointments.filter(app => {
                const appDate = new Date(app.dateTime).toISOString().split('T')[0];
                return appDate === filterDate;
            });
        }

        if (filteredAppointments.length === 0) {
            appointmentsTbody.innerHTML = '<tr><td colspan="5">No appointments found for the selected criteria.</td></tr>';
            return;
        }

        filteredAppointments.forEach(app => {
            const tr = document.createElement('tr');
            const appointmentDate = new Date(app.dateTime); // Stored as ISO string
            tr.innerHTML = `
                <td>${appointmentDate.toLocaleString()}</td>
                <td>${app.clientName}</td>
                <td>${app.clientEmail}</td>
                <td>${app.service}</td>
                <td>
                    <button class="admin-update-btn" data-id="${app.id}">Update</button>
                    <button class="admin-delete-btn" data-id="${app.id}">Delete</button>
                </td>
            `;
            appointmentsTbody.appendChild(tr);
        });

        // Add event listeners for new buttons
        document.querySelectorAll('.admin-update-btn').forEach(btn => {
            btn.addEventListener('click', openUpdateModal);
        });
        document.querySelectorAll('.admin-delete-btn').forEach(btn => {
            btn.addEventListener('click', handleAdminDelete);
        });
    };

    filterDateInput.addEventListener('change', () => {
        loadAllAppointments(filterDateInput.value);
    });

    clearFilterBtn.addEventListener('click', () => {
        filterDateInput.value = '';
        loadAllAppointments();
    });


    // Admin Create Appointment
    adminCreateForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        adminCreateMessageEl.textContent = 'Processing...';
        const dateTimeValue = document.getElementById('admin-datetime').value;
        const clientName = document.getElementById('admin-clientName').value.trim();
        const clientEmail = document.getElementById('admin-clientEmail').value.trim().toLowerCase();
        const service = document.getElementById('admin-service').value;

        if (!dateTimeValue || !clientName || !clientEmail || !service) {
            adminCreateMessageEl.textContent = 'All fields are required.';
            return;
        }
        const dateTime = new Date(dateTimeValue).toISOString();

        try {
            await db.collection('appointments').add({
                dateTime: dateTime,
                clientName: clientName,
                clientEmail: clientEmail,
                service: service,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            adminCreateMessageEl.textContent = 'Appointment created successfully!';
            adminCreateForm.reset();
            loadAllAppointments(filterDateInput.value); // Refresh the list with current filter
        } catch (error) {
            console.error("Error creating appointment (admin):", error);
            adminCreateMessageEl.textContent = `Admin creation failed: ${error.message}`;
        }
    });

    function openUpdateModal(event) {
        updateModalMessageEl.textContent = '';
        const appointmentId = event.target.dataset.id;
        const appointment = allAppointmentsCache.find(app => app.id === appointmentId);

        if (appointment) {
            updateIdField.value = appointment.id;
            // Firestore dateTime is ISO string. HTML datetime-local needs YYYY-MM-DDTHH:mm
            const localDateTime = new Date(appointment.dateTime).toISOString().slice(0, 16);
            updateDateTimeField.value = localDateTime;
            updateClientNameField.value = appointment.clientName;
            updateClientEmailField.value = appointment.clientEmail;
            updateServiceField.value = appointment.service;
            updateModal.style.display = 'block';
        } else {
            adminTableMessageEl.textContent = "Error: Could not find appointment data to update.";
        }
    }

    cancelUpdateButton.addEventListener('click', () => {
        updateModal.style.display = 'none';
    });

    saveUpdateButton.addEventListener('click', async () => {
        updateModalMessageEl.textContent = 'Saving...';
        const id = updateIdField.value;
        const newDateTimeValue = updateDateTimeField.value;
        const newClientName = updateClientNameField.value.trim();
        const newClientEmail = updateClientEmailField.value.trim().toLowerCase();
        const newService = updateServiceField.value;

        if (!newDateTimeValue || !newClientName || !newClientEmail || !newService) {
            updateModalMessageEl.textContent = 'All fields are required for update.';
            return;
        }
        const newDateTime = new Date(newDateTimeValue).toISOString();

        try {
            await db.collection('appointments').doc(id).update({
                dateTime: newDateTime,
                clientName: newClientName,
                clientEmail: newClientEmail,
                service: newService,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            updateModalMessageEl.textContent = 'Appointment updated successfully!';
            loadAllAppointments(filterDateInput.value); // Refresh the list
            setTimeout(() => { // Hide modal after a short delay
                updateModal.style.display = 'none';
            }, 1500);
        } catch (error) {
            console.error("Error updating appointment (admin):", error);
            updateModalMessageEl.textContent = `Admin update failed: ${error.message}`;
        }
    });

    async function handleAdminDelete(event) {
        const appointmentId = event.target.dataset.id;
        if (!confirm("Are you sure you want to PERMANENTLY delete this appointment? This action cannot be undone.")) return;

        adminTableMessageEl.textContent = "Deleting...";
        try {
            await db.collection('appointments').doc(appointmentId).delete();
            adminTableMessageEl.textContent = 'Appointment deleted successfully!';
            loadAllAppointments(filterDateInput.value); // Refresh the list
        } catch (error) {
            console.error("Error deleting appointment (admin):", error);
            adminTableMessageEl.textContent = `Admin deletion failed: ${error.message}`;
        }
    }

    // --- Optional: Export to CSV ---
    exportCsvButton.addEventListener('click', () => {
        let dataToExport = allAppointmentsCache;
        const currentFilterDate = filterDateInput.value;
        if (currentFilterDate) {
             dataToExport = allAppointmentsCache.filter(app => {
                const appDate = new Date(app.dateTime).toISOString().split('T')[0];
                return appDate === currentFilterDate;
            });
        }

        if (dataToExport.length === 0) {
            alert("No data to export for the current filter.");
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "DateTime,ClientName,ClientEmail,Service,CreatedAt\r\n"; // Headers

        dataToExport.forEach(app => {
            const appDate = new Date(app.dateTime);
            const created = app.createdAt ? new Date(app.createdAt.seconds * 1000).toLocaleString() : 'N/A';
            const row = [
                `"${appDate.toLocaleString()}"`,
                `"${app.clientName.replace(/"/g, '""')}"`, // Handle quotes in names
                `"${app.clientEmail}"`,
                `"${app.service}"`,
                `"${created}"`
            ].join(",");
            csvContent += row + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `appointments_export_${currentFilterDate || 'all'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

});