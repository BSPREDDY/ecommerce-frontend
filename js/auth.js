document.addEventListener('DOMContentLoaded', function () {
    // Check if on auth page
    if (!document.querySelector('.auth-container')) return;

    // Form elements
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginToggleBtn = document.getElementById('loginToggleBtn');
    const signupToggleBtn = document.getElementById('signupToggleBtn');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const signupName = document.getElementById('signupName');
    const signupEmail = document.getElementById('signupEmail');
    const signupPassword = document.getElementById('signupPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    const passwordStrengthMeter = document.getElementById('passwordStrengthMeter');
    const passwordRequirements = document.getElementById('passwordRequirements');
    const forgotPassword = document.getElementById('forgotPassword');

    // Firebase initialization check
    if (typeof firebase === 'undefined') {
        console.error('Firebase is not loaded');
        showMessage('loginMessage', 'Authentication service not available. Please refresh the page.', 'error');
        return;
    }

    // Initialize with login form
    showLoginForm();

    // Form toggle - Login form
    if (loginToggleBtn) {
        loginToggleBtn.addEventListener('click', function (e) {
            e.preventDefault();
            showSignupForm();
        });
    }

    // Form toggle - Signup form
    if (signupToggleBtn) {
        signupToggleBtn.addEventListener('click', function (e) {
            e.preventDefault();
            showLoginForm();
        });
    }

    // Toggle password visibility
    if (togglePasswordBtns) {
        togglePasswordBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const input = this.previousElementSibling;
                if (!input) return;

                const type = input.type === 'password' ? 'text' : 'password';
                input.type = type;
                this.innerHTML = type === 'password' ?
                    '<i class="fas fa-eye"></i>' :
                    '<i class="fas fa-eye-slash"></i>';
            });
        });
    }

    // Password strength checker
    if (signupPassword) {
        signupPassword.addEventListener('input', function () {
            checkPasswordStrength(this.value);
        });
    }

    // Password confirmation check
    if (confirmPassword) {
        confirmPassword.addEventListener('input', function () {
            checkPasswordConfirmation();
        });
    }

    // Form submission - FIXED
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleLogin(e);
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleSignup(e);
        });
    }

    // Forgot password
    if (forgotPassword) {
        forgotPassword.addEventListener('click', function (e) {
            e.preventDefault();
            const email = prompt('Please enter your email address:');
            if (email) {
                resetPassword(email);
            }
        });
    }

    // Check if user is already logged in
    checkAuthState();
});

function showLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');

    if (loginForm) {
        loginForm.classList.remove('form-hidden');
        loginForm.reset();
    }
    if (signupForm) signupForm.classList.add('form-hidden');
    if (authTitle) authTitle.textContent = "Welcome Back";
    if (authSubtitle) authSubtitle.textContent = "Please login to your account";
    document.title = "ShopEasy - Login";

    // Clear messages
    clearMessages();
}

function showSignupForm() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');

    if (signupForm) {
        signupForm.classList.remove('form-hidden');
        signupForm.reset();
    }
    if (loginForm) loginForm.classList.add('form-hidden');
    if (authTitle) authTitle.textContent = "Create Account";
    if (authSubtitle) authSubtitle.textContent = "Sign up to get started";
    document.title = "ShopEasy - Sign Up";

    // Clear messages and reset password strength
    clearMessages();
    if (passwordStrengthMeter) {
        passwordStrengthMeter.style.width = '0%';
        passwordStrengthMeter.className = 'password-strength-meter';
    }
    if (passwordRequirements) {
        passwordRequirements.innerHTML = '';
    }
}

function clearMessages() {
    const messages = document.querySelectorAll('.message');
    messages.forEach(msg => {
        msg.style.display = 'none';
        msg.textContent = '';
    });
}

function checkPasswordStrength(password) {
    if (!password) return;

    let strength = 0;
    const requirements = [];

    // Check length
    if (password.length >= 8) {
        strength += 25;
        requirements.push('✓ At least 8 characters');
    } else {
        requirements.push('✗ At least 8 characters');
    }

    // Check for uppercase
    if (/[A-Z]/.test(password)) {
        strength += 25;
        requirements.push('✓ Uppercase letter');
    } else {
        requirements.push('✗ Uppercase letter');
    }

    // Check for lowercase
    if (/[a-z]/.test(password)) {
        strength += 25;
        requirements.push('✓ Lowercase letter');
    } else {
        requirements.push('✗ Lowercase letter');
    }

    // Check for numbers
    if (/[0-9]/.test(password)) {
        strength += 25;
        requirements.push('✓ Number');
    } else {
        requirements.push('✗ Number');
    }

    // Update meter
    const meter = document.getElementById('passwordStrengthMeter');
    if (meter) {
        meter.className = 'password-strength-meter';
        meter.style.width = `${strength}%`;

        if (strength >= 100) {
            meter.classList.add('strong');
        } else if (strength >= 50) {
            meter.classList.add('medium');
        } else if (strength > 0) {
            meter.classList.add('weak');
        }
    }

    // Update requirements list
    const requirementsList = document.getElementById('passwordRequirements');
    if (requirementsList) {
        requirementsList.innerHTML = requirements.map(req =>
            `<span class="d-block">${req}</span>`
        ).join('');
    }
}

function checkPasswordConfirmation() {
    const password = document.getElementById('signupPassword')?.value;
    const confirm = document.getElementById('confirmPassword')?.value;
    const error = document.getElementById('confirmPasswordError');

    if (!password || !confirm || !error) return false;

    if (password !== confirm) {
        error.textContent = 'Passwords do not match';
        error.style.display = 'block';
        return false;
    } else {
        error.style.display = 'none';
        return true;
    }
}

function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with id "${elementId}" not found`);
        return;
    }

    element.textContent = message;
    element.className = `message ${type}`;
    element.style.display = 'block';

    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

// FIXED login function
async function handleLogin(e) {
    e.preventDefault(); // Prevent default form submission

    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;
    const messageElement = document.getElementById('loginMessage');

    // Basic validation
    if (!email || !password) {
        showMessage('loginMessage', 'Please fill in all fields', 'error');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('loginMessage', 'Please enter a valid email address', 'error');
        return;
    }

    // Show loading state
    const submitBtn = document.querySelector('#loginForm button[type="submit"]');
    if (!submitBtn) return;

    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    submitBtn.disabled = true;

    try {
        // Firebase login - using modular syntax if available
        let userCredential;
        if (firebase.auth && firebase.auth().signInWithEmailAndPassword) {
            // Compatible with older Firebase SDK
            userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        } else {
            // For Firebase v9+ modular SDK
            const { getAuth, signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js');
            const auth = getAuth();
            userCredential = await signInWithEmailAndPassword(auth, email, password);
        }

        const user = userCredential.user;

        // Store user info
        localStorage.setItem('user', JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
        }));

        showMessage('loginMessage', 'Login successful! Redirecting...', 'success');

        // Redirect after delay - FIXED: Don't use setTimeout for immediate redirect
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);

    } catch (error) {
        let errorMessage = 'Login failed. ';

        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage += 'No user found with this email.';
                break;
            case 'auth/wrong-password':
                errorMessage += 'Incorrect password.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Invalid email address.';
                break;
            case 'auth/user-disabled':
                errorMessage += 'This account has been disabled.';
                break;
            case 'auth/too-many-requests':
                errorMessage += 'Too many failed attempts. Please try again later.';
                break;
            default:
                errorMessage += error.message;
        }

        showMessage('loginMessage', errorMessage, 'error');

        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// FIXED signup function
async function handleSignup(e) {
    e.preventDefault(); // Prevent default form submission

    const name = document.getElementById('signupName')?.value;
    const email = document.getElementById('signupEmail')?.value;
    const password = document.getElementById('signupPassword')?.value;
    const confirm = document.getElementById('confirmPassword')?.value;

    // Validation
    if (!name || !email || !password || !confirm) {
        showMessage('signupMessage', 'Please fill in all fields', 'error');
        return;
    }

    if (password !== confirm) {
        showMessage('signupMessage', 'Passwords do not match', 'error');
        return;
    }

    // Password strength check
    if (password.length < 8 || !/[A-Z]/.test(password) ||
        !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        showMessage('signupMessage', 'Password does not meet requirements', 'error');
        return;
    }

    // Show loading state
    const submitBtn = document.querySelector('#signupForm button[type="submit"]');
    if (!submitBtn) return;

    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    submitBtn.disabled = true;

    try {
        // Firebase signup
        let userCredential;
        if (firebase.auth && firebase.auth().createUserWithEmailAndPassword) {
            userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        } else {
            const { getAuth, createUserWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js');
            const auth = getAuth();
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
        }

        const user = userCredential.user;

        // Update profile
        await user.updateProfile({
            displayName: name
        });

        // Store user info
        localStorage.setItem('user', JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: name
        }));

        showMessage('signupMessage', 'Account created successfully! Redirecting...', 'success');

        // Redirect after delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);

    } catch (error) {
        let errorMessage = 'Signup failed. ';

        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage += 'Email already in use.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Invalid email address.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage += 'Operation not allowed.';
                break;
            case 'auth/weak-password':
                errorMessage += 'Password is too weak.';
                break;
            default:
                errorMessage += error.message;
        }

        showMessage('signupMessage', errorMessage, 'error');

        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function resetPassword(email) {
    try {
        if (firebase.auth && firebase.auth().sendPasswordResetEmail) {
            await firebase.auth().sendPasswordResetEmail(email);
        } else {
            const { getAuth, sendPasswordResetEmail } = await import('https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js');
            const auth = getAuth();
            await sendPasswordResetEmail(auth, email);
        }
        alert('Password reset email sent! Please check your inbox.');
    } catch (error) {
        alert('Error sending reset email: ' + error.message);
    }
}

// Check authentication state
function checkAuthState() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
        console.warn('Firebase auth not available');
        return;
    }

    firebase.auth().onAuthStateChanged(function (user) {
        if (user && window.location.pathname.includes('auth.html')) {
            // User is already logged in, redirect to home
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    });
}