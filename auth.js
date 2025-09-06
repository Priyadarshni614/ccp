document.addEventListener('DOMContentLoaded', () => {
    // Check if a user ID exists in the session storage
    const userId = sessionStorage.getItem('greanixUserId');
    
    // --- Part 1: Navbar Management ---
    const navbarRight = document.getElementById('navbar-right');
    if (userId && navbarRight) {
        // User is logged in: Show Profile and Logout
        navbarRight.innerHTML = `
            <span id="nav-username" style="margin-right: 15px; font-weight: 500; color: #333;"></span>
            <button class="login" style="padding: 8px 15px;" onclick="window.location.href='profile.html'">Profile</button>
            <button class="signup" style="padding: 8px 15px;" onclick="logout()">Logout</button>
        `;
        // Fetch and display the username
        fetchUsername(userId);
    } else if (navbarRight) {
        // User is not logged in: Show Login and Sign Up
        navbarRight.innerHTML = `
            <button class="login" onclick="window.location.href='login.html'">Login</button>
            <button class="signup" onclick="window.location.href='signup.html'">Sign Up</button>
        `;
    }

    // --- Part 2: Dynamic Homepage Content ---
    const loggedOutView = document.getElementById('logged-out-view');
    const loggedInView = document.getElementById('logged-in-view');

    // This logic only runs if these elements exist (i.e., on the homepage)
    if (loggedOutView && loggedInView) {
        if (userId) {
            // If logged in, show the welcome back message and hide the signup prompt
            loggedInView.style.display = 'block';
            loggedOutView.style.display = 'none';
        } else {
            // If logged out, show the signup prompt and hide the welcome back message
            loggedInView.style.display = 'none';
            loggedOutView.style.display = 'block';
        }
    }
});

function logout() {
    sessionStorage.removeItem('greanixUserId');
    // Redirect to homepage after logout to see the change
    window.location.href = '/'; 
}

async function fetchUsername(userId) {
    try {
        const response = await fetch(`/api/user-data/${userId}`);
        if (response.ok) {
            const userData = await response.json();
            const usernameElement = document.getElementById('nav-username');
            if (usernameElement) {
                usernameElement.textContent = `Welcome, ${userData.username}`;
            }
        }
    } catch (error) {
        console.error('Failed to fetch username:', error);
    }
}