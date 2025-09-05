// Dummy database for demonstration
let users = [
    { username: 'faculty', password: '12345', email: 'faculty@example.com' }
];

// --- Login Function ---
function login(type) {
    const username = document.getElementById('faculty-username').value;
    const password = document.getElementById('faculty-password').value;
    const errorMsg = document.getElementById('faculty-error');

    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        errorMsg.textContent = '';
        alert('Login successful!');
        // Show tracker container after login
        document.getElementById('tracker-container').style.display = 'block';
        document.getElementById('faculty-login').style.display = 'none';
        document.getElementById('create-account').style.display = 'none';
    } else {
        errorMsg.textContent = 'Invalid username or password!';
    }
}

// --- Create Account Function ---
function createAccount() {
    const username = document.getElementById('new-username').value;
    const email = document.getElementById('new-email').value;
    const password = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    const successMsg = document.getElementById('create-success');
    const errorMsg = document.getElementById('create-error');

    // Clear previous messages
    successMsg.textContent = '';
    errorMsg.textContent = '';

    // Validation
    if (!username || !email || !password || !confirmPassword) {
        errorMsg.textContent = 'All fields are required!';
        return;
    }

    if (password !== confirmPassword) {
        errorMsg.textContent = 'Passwords do not match!';
        return;
    }

    const exists = users.find(u => u.username === username || u.email === email);
    if (exists) {
        errorMsg.textContent = 'Username or email already exists!';
        return;
    }

    // Add new user
    users.push({ username, password, email });
    successMsg.textContent = 'Account created successfully! You can now login.';
    
    // Clear form
    document.getElementById('new-username').value = '';
    document.getElementById('new-email').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
}

// --- Forgot Password Functions ---
function forgotPassword() {
    document.getElementById('forgot-password-modal').style.display = 'block';
}

function closeForgotPasswordModal() {
    document.getElementById('forgot-password-modal').style.display = 'none';
}

function resetPassword() {
    const username = document.getElementById('reset-username').value;
    const successMsg = document.getElementById('reset-success');
    const errorMsg = document.getElementById('reset-error');

    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';

    const user = users.find(u => u.username === username);
    if (user) {
        successMsg.style.display = 'block';
    } else {
        errorMsg.style.display = 'block';
    }
}

// --- Other Placeholder Functions ---
function checkStatus() {
    alert('Checking classroom status (placeholder)');
}

function logout() {
    alert('Logged out');
    document.getElementById('tracker-container').style.display = 'none';
    document.getElementById('faculty-login').style.display = 'block';
    document.getElementById('create-account').style.display = 'block';
}

function exit() {
    alert('Exiting app (placeholder)');
}

function showAvailable() { alert('Showing available classrooms'); }
function showOccupied() { alert('Showing occupied classrooms'); }
function showAll() { alert('Showing all classrooms'); }
