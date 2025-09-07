const API_URL = "https://classroom-occupancy-production.up.railway.app";
        
const floors = {
    "Floor 1": ["A11", "A12", "A13", "A14"],
    "Floor 2": ["B21", "B22", "B23", "B24"],
    "Floor 3": ["C31", "C32", "C33", "C34"],
    "Floor 4": ["D41", "D42", "D43", "D44"]
};
        
const labs = ["Lab 1", "Lab 2", "Lab 3", "Lab 4", "Lab 5", "Lab 6"];
        
let roomStatus = {};
let labStatus = {};
let currentUserType = null;
let isAdmin = false;

function createParticles() {
    const particlesContainer = document.getElementById('particles');
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particlesContainer.appendChild(particle);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    createParticles();
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const username = urlParams.get('username');
    if (token && username) {
        showResetPasswordModal(username);
    }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const usernameInput = document.getElementById("user-username");
    const passwordInput = document.getElementById("user-password");
    const errorMessage = document.getElementById("user-error");
    const userLogin = document.getElementById("user-login");
    const trackerContainer = document.getElementById("tracker-container");

    if (!usernameInput || !passwordInput || !errorMessage || !userLogin || !trackerContainer) {
        console.error("One or more DOM elements not found");
        return;
    }

    const username = usernameInput.value;
    const password = passwordInput.value;
    errorMessage.classList.remove('show');
    const loginButton = e.target.querySelector('.login-button');
    loginButton.disabled = true;
    loginButton.textContent = 'Logging in...';

    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        localStorage.setItem('token', data.token);
        isAdmin = data.isAdmin || false;
        currentUserType = 'user';
        userLogin.style.display = "none";
        document.querySelector('.check-status-button').style.display = "none";
        trackerContainer.style.display = "block";
        document.getElementById("user-options").style.display = "block";
        document.getElementById("user-logout-btn").style.display = "inline-block";
        document.getElementById("initial-text").style.display = "none";
        updateRoomStatus();
        updateLabStatus();
    } catch (error) {
        console.error('Error during login:', error);
        errorMessage.innerText = error.message;
        errorMessage.classList.add("show");
        setTimeout(() => errorMessage.classList.remove("show"), 2000);
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = 'Login';
    }
});

function checkStatus() {
    console.log("Checking status, setting currentUserType to viewer");
    const userLogin = document.getElementById("user-login");
    const trackerContainer = document.getElementById("tracker-container");

    if (!userLogin || !trackerContainer) {
        console.error("One or more DOM elements not found");
        return;
    }

    currentUserType = "viewer";
    userLogin.style.display = "none";
    document.querySelector('.check-status-button').style.display = "none";
    trackerContainer.style.display = "block";
    document.getElementById("user-options").style.display = "none";
    document.getElementById("exit-btn").style.display = "inline-block";
    document.getElementById("logout-btn").style.display = "none";
    document.getElementById("initial-text").style.display = "none";
    updateRoomStatusPublic();
    updateLabStatusPublic();
    Promise.all([
        new Promise(resolve => {
            updateRoomStatusPublic();
            resolve();
        }),
        new Promise(resolve => {
            updateLabStatusPublic();
            resolve();
        })
    ]).then(() => {
        suggestAlternatives();
    });
}

function updateRoomStatus() {
    const roomContainer = document.getElementById("rooms");
    if (!roomContainer) {
        console.error("Rooms container not found");
        return;
    }
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/room-status`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token || ''}`
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Fetched room data:', data);
            if (Object.keys(data).length === 0) {
                console.warn('No room data received from server');
            }
            roomStatus = data || {};
            roomContainer.innerHTML = "";
            Object.keys(floors).forEach(floor => {
                floors[floor].forEach(room => {
                    const roomDiv = document.createElement("div");
                    roomDiv.className = `room ${roomStatus[room] ? 'occupied' : 'available'}`;
                    roomDiv.innerHTML = `
                        <strong>${room}</strong>: 
                        <span>${roomStatus[room] !== undefined ? (roomStatus[room] ? "Occupied" : "Available") : "Unknown"}</span>
                        ${currentUserType === 'user' ? `<button onclick="toggleRoomStatus('${room}')">Toggle</button>` : ''}
                    `;
                    roomContainer.appendChild(roomDiv);
                });
            });
            $(roomContainer).children().hide().each(function(index) {
                $(this).delay(index * 50).fadeIn(200);
            });
            suggestAlternatives();
        })
        .catch(error => {
            console.error('Error fetching room status:', error);
            alert(`Error fetching room status: ${error.message}. Check console for details.`);
        });
}

function updateRoomStatusPublic() {
    const roomContainer = document.getElementById("rooms");
    if (!roomContainer) {
        console.error("Rooms container not found");
        return;
    }
    fetch(`${API_URL}/api/public/room-status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Fetched public room data:', data);
            if (Object.keys(data).length === 0) {
                console.warn('No room data received from server');
            }
            roomStatus = data || {};
            roomContainer.innerHTML = "";
            Object.keys(floors).forEach(floor => {
                floors[floor].forEach(room => {
                    const roomDiv = document.createElement("div");
                    roomDiv.className = `room ${roomStatus[room] ? 'occupied' : 'available'}`;
                    roomDiv.innerHTML = `
                        <strong>${room}</strong>: 
                        <span>${roomStatus[room] !== undefined ? (roomStatus[room] ? "Occupied" : "Available") : "Unknown"}</span>
                        ${currentUserType === 'user' ? `<button onclick="toggleRoomStatus('${room}')">Toggle</button>` : ''}
                    `;
                    roomContainer.appendChild(roomDiv);
                });
            });
            $(roomContainer).children().hide().each(function(index) {
                $(this).delay(index * 50).fadeIn(200);
            });
        })
        .catch(error => {
            console.error('Error fetching public room status:', error);
            alert(`Error fetching room status: ${error.message}. Check console for details.`);
        });
}

function toggleRoomStatus(room) {
    console.log(`Toggling status for room ${room}`);
    const newStatus = !roomStatus[room];
    const token = localStorage.getItem('token');
    
    fetch(`${API_URL}/api/room-status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            room: room,
            status: newStatus
        })
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        console.log('Room status updated:', data);
        updateRoomStatus();
    })
    .catch(error => {
        console.error('Error updating room status:', error);
        alert(`Error updating room status: ${error.message}. Check console for details.`);
    });
}

function updateLabStatus() {
    const labContainer = document.getElementById("labs-container");
    if (!labContainer) {
        console.error("Labs container not found");
        return;
    }
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/lab-status`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token || ''}`
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Fetched lab data:', data);
            if (Object.keys(data).length === 0) {
                console.warn('No lab data received from server');
            }
            labStatus = data || {};
            labContainer.innerHTML = "";
            labs.forEach(lab => {
                const labDiv = document.createElement("div");
                labDiv.className = `lab ${labStatus[lab] ? 'occupied' : 'available'}`;
                labDiv.innerHTML = `
                    <strong>${lab}</strong>: 
                    <span>${labStatus[lab] !== undefined ? (labStatus[lab] ? "Occupied" : "Available") : "Unknown"}</span>
                    ${currentUserType === 'user' ? `<button onclick="toggleLabStatus('${lab}')">Toggle</button>` : ''}
                `;
                labContainer.appendChild(labDiv);
            });
            $(labContainer).children().hide().each(function(index) {
                $(this).delay(index * 50).fadeIn(200);
            });
            suggestAlternatives();
        })
        .catch(error => {
            console.error('Error fetching lab status:', error);
            alert(`Error fetching lab status: ${error.message}. Check console for details.`);
        });
}
        
function updateLabStatusPublic() {
    const labContainer = document.getElementById("labs-container");
    if (!labContainer) {
        console.error("Labs container not found");
        return;
    }
    fetch(`${API_URL}/api/public/lab-status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Fetched public lab data:', data);
            if (Object.keys(data).length === 0) {
                console.warn('No lab data received from server');
            }
            labStatus = data || {};
            labContainer.innerHTML = "";
            labs.forEach(lab => {
                const labDiv = document.createElement("div");
                labDiv.className = `lab ${labStatus[lab] ? 'occupied' : 'available'}`;
                labDiv.innerHTML = `
                    <strong>${lab}</strong>: 
                    <span>${labStatus[lab] !== undefined ? (labStatus[lab] ? "Occupied" : "Available") : "Unknown"}</span>
                    ${currentUserType === 'user' ? `<button onclick="toggleLabStatus('${lab}')">Toggle</button>` : ''}
                `;
                labContainer.appendChild(labDiv);
            });
            $(labContainer).children().hide().each(function(index) {
                $(this).delay(index * 50).fadeIn(200);
            });
        })
        .catch(error => {
            console.error('Error fetching public lab status:', error);
            alert(`Error fetching lab status: ${error.message}. Check console for details.`);
        });
}
        
function toggleLabStatus(lab) {
    console.log(`Toggling status for lab ${lab}`);
    const newStatus = !labStatus[lab];
    const token = localStorage.getItem('token');
    
    fetch(`${API_URL}/api/lab-status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            lab: lab,
            status: newStatus
        })
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        console.log('Lab status updated:', data);
        updateLabStatus();
    })
    .catch(error => {
        console.error('Error updating lab status:', error);
        alert(`Error updating lab status: ${error.message}. Check console for details.`);
    });
}

function logout() {
    console.log("Logging out");
    localStorage.removeItem('token');
    currentUserType = null;
    isAdmin = false;
    document.getElementById("user-login").style.display = "block";
    document.querySelector('.check-status-button').style.display = "block";
    document.getElementById("tracker-container").style.display = "none";
    document.getElementById("user-options").style.display = "none";
    document.getElementById("user-logout-btn").style.display = "none";
    document.getElementById("logout-btn").style.display = "none";
    document.getElementById("exit-btn").style.display = "none";
    document.getElementById("initial-text").style.display = "block";
    
    document.getElementById("user-username").value = "";
    document.getElementById("user-password").value = "";
}

function exit() {
    console.log("Exiting");
    currentUserType = null;
    document.getElementById("user-login").style.display = "block";
    document.querySelector('.check-status-button').style.display = "block";
    document.getElementById("tracker-container").style.display = "none";
    document.getElementById("user-options").style.display = "none";
    document.getElementById("user-logout-btn").style.display = "none";
    document.getElementById("logout-btn").style.display = "none";
    document.getElementById("exit-btn").style.display = "none";
    document.getElementById("initial-text").style.display = "block";
}

function showAvailable() {
    const rooms = document.querySelectorAll('.room');
    const labs = document.querySelectorAll('.lab');
    
    rooms.forEach(room => {
        if (room.classList.contains('available')) {
            room.style.display = 'flex';
            room.style.animation = 'fadeIn 0.5s ease-out';
        } else {
            room.style.animation = 'fadeOut 0.5s ease-out forwards';
            setTimeout(() => {
                room.style.display = 'none';
            }, 500);
        }
    });
    
    labs.forEach(lab => {
        if (lab.classList.contains('available')) {
            lab.style.display = 'flex';
            lab.style.animation = 'fadeIn 0.5s ease-out';
        } else {
            lab.style.animation = 'fadeOut 0.5s ease-out forwards';
            setTimeout(() => {
                lab.style.display = 'none';
            }, 500);
        }
    });
}

function showOccupied() {
    const rooms = document.querySelectorAll('.room');
    const labs = document.querySelectorAll('.lab');
    
    rooms.forEach(room => {
        if (room.classList.contains('occupied')) {
            room.style.display = 'flex';
            room.style.animation = 'fadeIn 0.5s ease-out';
        } else {
            room.style.animation = 'fadeOut 0.5s ease-out forwards';
            setTimeout(() => {
                room.style.display = 'none';
            }, 500);
        }
    });
    
    labs.forEach(lab => {
        if (lab.classList.contains('occupied')) {
            lab.style.display = 'flex';
            lab.style.animation = 'fadeIn 0.5s ease-out';
        } else {
            lab.style.animation = 'fadeOut 0.5s ease-out forwards';
            setTimeout(() => {
                lab.style.display = 'none';
            }, 500);
        }
    });
}

function showAll() {
    const rooms = document.querySelectorAll('.room');
    const labs = document.querySelectorAll('.lab');
    
    rooms.forEach(room => {
        room.style.display = 'flex';
        room.style.animation = 'fadeIn 0.5s ease-out';
    });
    
    labs.forEach(lab => {
        lab.style.display = 'flex';
        lab.style.animation = 'fadeIn 0.5s ease-out';
    });
}

function suggestAlternatives() {
    const aiSuggestion = document.getElementById("ai-suggestion");
    if (!aiSuggestion) return;

    const allRooms = Object.values(floors).flat();
    const availableRooms = allRooms.filter(room => !roomStatus[room]);
    const availableLabs = labs.filter(lab => !labStatus[lab]);
    const allAvailable = [...availableRooms, ...availableLabs];

    if (allAvailable.length > 0) {
        aiSuggestion.innerHTML = `Available classrooms and labs: ${allAvailable.join(', ')}`;
        aiSuggestion.style.display = 'block';
    } else {
        aiSuggestion.innerHTML = 'No classrooms or labs available at the moment.';
        aiSuggestion.style.display = 'block';
    }
}

function forgotPassword() {
    document.getElementById('forgot-password-modal').style.display = 'flex';
}

function closeForgotPasswordModal() {
    document.getElementById('forgot-password-modal').style.display = 'none';
    document.getElementById('reset-username').value = '';
}

function resetPassword() {
    const username = document.getElementById('reset-username').value;

    fetch(`${API_URL}/api/reset-password-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            alert(data.message);
            setTimeout(() => {
                closeForgotPasswordModal();
            }, 2000);
        }
    })
    .catch(error => {
        console.error('Error during password reset request:', error);
        alert('Error processing request');
    });
}

function showPasskeyModal() {
    document.getElementById('passkey-modal').style.display = 'flex';
    document.getElementById('passkey-input').value = '';
    document.getElementById('passkey-error').style.display = 'none';
}

function closePasskeyModal() {
    document.getElementById('passkey-modal').style.display = 'none';
}

function validatePasskey() {
    const passkey = document.getElementById('passkey-input').value;
    const errorMessage = document.getElementById('passkey-error');

    fetch(`${API_URL}/api/validate-passkey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            return fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'faculty', password: '1234' })
            }).then(response => response.json());
        } else {
            throw new Error('Invalid passkey');
        }
    })
    .then(loginData => {
        if (loginData.token) {
            localStorage.setItem('token', loginData.token);
            isAdmin = loginData.isAdmin || false;
            console.log('Admin login successful, token:', loginData.token, 'isAdmin:', isAdmin);
            closePasskeyModal();
            document.getElementById('create-account-modal').style.display = 'flex';
        } else {
            throw new Error('Failed to log in as admin');
        }
    })
    .catch(error => {
        console.error('Error in passkey validation or login:', error);
        errorMessage.innerText = error.message || 'Error validating passkey or logging in';
        errorMessage.style.display = 'block';
        setTimeout(() => errorMessage.style.display = 'none', 2000);
    });
}

function closeCreateAccountModal() {
    document.getElementById('create-account-modal').style.display = 'none';
    document.getElementById('new-username').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
    document.getElementById('create-success').style.display = 'none';
    document.getElementById('create-error').style.display = 'none';
}

function createAccount() {
    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const successMessage = document.getElementById('create-success');
    const errorMessage = document.getElementById('create-error');
    const token = localStorage.getItem('token');

    if (!username || !password || !confirmPassword) {
        errorMessage.innerText = 'All fields are required.';
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
        return;
    }

    if (password !== confirmPassword) {
        errorMessage.innerText = 'Passwords do not match.';
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
        return;
    }

    if (!token) {
        errorMessage.innerText = 'Please log in as an admin first to create an account.';
        errorMessage.style.display = 'block';
        return;
    }

    console.log('Attempting to create account with token:', token);
    proceedWithRegistration(token, username, password, confirmPassword, successMessage, errorMessage);
}

function proceedWithRegistration(token, username, password, confirmPassword, successMessage, errorMessage) {
    fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        console.log('Register response status:', response.status);
        return response.json();
    })
    .then(data => {
        if (data.error) {
            errorMessage.innerText = data.error || 'Registration failed';
            errorMessage.style.display = 'block';
            successMessage.style.display = 'none';
        } else {
            successMessage.style.display = 'block';
            errorMessage.style.display = 'none';
            setTimeout(() => {
                closeCreateAccountModal();
            }, 2000);
        }
    })
    .catch(error => {
        console.error('Error creating account:', error);
        errorMessage.innerText = 'Error creating account: ' + error.message;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
    });
}

function showResetPasswordModal(username) {
    document.getElementById('reset-password-modal').style.display = 'flex';
    document.getElementById('reset-username-field').value = username;
    document.getElementById('user-login').style.display = 'none';
    document.getElementById('initial-text').style.display = 'none';
    document.querySelector('.check-status-button').style.display = 'none';
}

function closeResetPasswordModal() {
    document.getElementById('reset-password-modal').style.display = 'none';
    document.getElementById('reset-username-field').value = '';
    document.getElementById('new-password-reset').value = '';
    document.getElementById('confirm-password-reset').value = '';
    document.getElementById('reset-password-success').style.display = 'none';
    document.getElementById('reset-password-error').style.display = 'none';
    document.getElementById('user-login').style.display = 'block';
    document.getElementById('initial-text').style.display = 'block';
    document.querySelector('.check-status-button').style.display = 'block';
    window.history.pushState({}, document.title, window.location.pathname);
}

function submitNewPassword() {
    const username = document.getElementById('reset-username-field').value;
    const newPassword = document.getElementById('new-password-reset').value;
    const confirmPassword = document.getElementById('confirm-password-reset').value;
    const successMessage = document.getElementById('reset-password-success');
    const errorMessage = document.getElementById('reset-password-error');
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!newPassword || !confirmPassword) {
        errorMessage.innerText = 'All fields are required.';
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
        return;
    }

    if (newPassword !== confirmPassword) {
        errorMessage.innerText = 'Passwords do not match.';
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
        return;
    }

    fetch(`${API_URL}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, token, newPassword })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            errorMessage.innerText = data.error;
            errorMessage.style.display = 'block';
            successMessage.style.display = 'none';
        } else {
            successMessage.style.display = 'block';
            errorMessage.style.display = 'none';
            setTimeout(() => {
                closeResetPasswordModal();
            }, 2000);
        }
    })
    .catch(error => {
        console.error('Error resetting password:', error);
        errorMessage.innerText = 'Error resetting password';
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
    });
}

window.onclick = function(event) {
    const forgotModal = document.getElementById('forgot-password-modal');
    const createModal = document.getElementById('create-account-modal');
    const resetModal = document.getElementById('reset-password-modal');
    const passkeyModal = document.getElementById('passkey-modal');
    if (event.target === forgotModal) {
        closeForgotPasswordModal();
    } else if (event.target === createModal) {
        closeCreateAccountModal();
    } else if (event.target === resetModal) {
        closeResetPasswordModal();
    } else if (event.target === passkeyModal) {
        closePasskeyModal();
    }
}