// client/js/admin.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('admin-login-form');
    const loginErrorEl = document.getElementById('login-error');

    // If user is already logged in and is the admin, redirect to dashboard
    auth.onAuthStateChanged(user => {
        if (user) {
            // IMPORTANT: Add check here to ensure this user is the designated admin
            // This relies on the security rules and the UID check.
            // You might want to store your admin UID in firebase-config.js for this check
            // e.g. if (user.uid === firebaseConfig.adminUid) { window.location.href = 'admin-dashboard.html'; }
            // For now, we assume any logged in user trying to access admin.html is attempting admin login.
            // The dashboard will do a more robust check based on UID from rules or a stored admin UID.
             console.log("User already logged in, checking if admin:", user.uid);
             // A simple redirect if logged in. The dashboard will verify if it's the *actual* admin.
             // window.location.href = 'admin-dashboard.html';
        }
    });


    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        loginErrorEl.textContent = '';
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            // After successful login, redirect to the admin dashboard
            // The dashboard itself should verify if the logged-in user is an admin based on UID
            window.location.href = 'admin-dashboard.html';
        } catch (error) {
            console.error("Admin login error:", error);
            loginErrorEl.textContent = `Login Failed: ${error.message}`;
        }
    });
});