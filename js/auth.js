// auth.js - Authentication Module - FIXED
// ===============================
// Authentication with proper validation
// ===============================

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

    // Form submission with validation
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (validateLoginForm()) {
                handleLogin(e);
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (validateSignupForm()) {
                handleSignup(e);
            }
        });
    }

    // Forgot password
    if (forgotPassword) {
        forgotPassword.addEventListener('click', function (e) {
            e.preventDefault();
            showForgotPasswordModal();
        });
    }

    // Check if user is already logged in
    checkAuthState();

    // Add real-time validation
    addRealTimeValidation();
});

// ===============================
// FORM VALIDATION FUNCTIONS - FIXED
// ===============================
function validateLoginForm() {
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value.trim();
    const emailError = document.getElementById('loginEmailError');
    const passwordError = document.getElementById('loginPasswordError');

    // Clear previous errors
    clearFieldErrors('login');

    let isValid = true;

    // Email validation
    if (!email) {
        showFieldError(emailError, 'Email is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showFieldError(emailError, 'Please enter a valid email address');
        isValid = false;
    }

    // Password validation
    if (!password) {
        showFieldError(passwordError, 'Password is required');
        isValid = false;
    } else if (password.length < 6) {
        showFieldError(passwordError, 'Password must be at least 6 characters');
        isValid = false;
    }

    return isValid;
}

function validateSignupForm() {
    const name = document.getElementById('signupName')?.value.trim();
    const email = document.getElementById('signupEmail')?.value.trim();
    const password = document.getElementById('signupPassword')?.value.trim();
    const confirm = document.getElementById('confirmPassword')?.value.trim();

    const nameError = document.getElementById('signupNameError');
    const emailError = document.getElementById('signupEmailError');
    const passwordError = document.getElementById('signupPasswordError');
    const confirmError = document.getElementById('confirmPasswordError');

    // Clear previous errors
    clearFieldErrors('signup');

    let isValid = true;

    // Name validation
    if (!name) {
        showFieldError(nameError, 'Full name is required');
        isValid = false;
    } else if (name.length < 2) {
        showFieldError(nameError, 'Name must be at least 2 characters');
        isValid = false;
    }

    // Email validation
    if (!email) {
        showFieldError(emailError, 'Email is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showFieldError(emailError, 'Please enter a valid email address');
        isValid = false;
    }

    // Password validation
    if (!password) {
        showFieldError(passwordError, 'Password is required');
        isValid = false;
    } else if (!isValidPassword(password)) {
        showFieldError(passwordError, getPasswordRequirementsText());
        isValid = false;
    }

    // Confirm password validation
    if (!confirm) {
        showFieldError(confirmError, 'Please confirm your password');
        isValid = false;
    } else if (password !== confirm) {
        showFieldError(confirmError, 'Passwords do not match');
        isValid = false;
    }

    return isValid;
}

function addRealTimeValidation() {
    // Real-time email validation
    const loginEmail = document.getElementById('loginEmail');
    const signupEmail = document.getElementById('signupEmail');

    if (loginEmail) {
        loginEmail.addEventListener('blur', function () {
            const email = this.value.trim();
            const errorElement = document.getElementById('loginEmailError');
            if (!email) {
                showFieldError(errorElement, 'Email is required');
            } else if (!isValidEmail(email)) {
                showFieldError(errorElement, 'Please enter a valid email');
            } else {
                clearFieldError(errorElement);
            }
        });
    }

    if (signupEmail) {
        signupEmail.addEventListener('blur', function () {
            const email = this.value.trim();
            const errorElement = document.getElementById('signupEmailError');
            if (!email) {
                showFieldError(errorElement, 'Email is required');
            } else if (!isValidEmail(email)) {
                showFieldError(errorElement, 'Please enter a valid email');
            } else {
                clearFieldError(errorElement);
            }
        });
    }

    // Real-time password validation
    const signupPassword = document.getElementById('signupPassword');
    const confirmPassword = document.getElementById('confirmPassword');

    if (signupPassword) {
        signupPassword.addEventListener('blur', function () {
            const password = this.value.trim();
            const errorElement = document.getElementById('signupPasswordError');
            if (!password) {
                showFieldError(errorElement, 'Password is required');
            } else if (!isValidPassword(password)) {
                showFieldError(errorElement, getPasswordRequirementsText());
            } else {
                clearFieldError(errorElement);
            }
        });
    }

    if (confirmPassword) {
        confirmPassword.addEventListener('blur', function () {
            const password = document.getElementById('signupPassword')?.value.trim();
            const confirm = this.value.trim();
            const errorElement = document.getElementById('confirmPasswordError');

            if (!confirm) {
                showFieldError(errorElement, 'Please confirm your password');
            } else if (password && password !== confirm) {
                showFieldError(errorElement, 'Passwords do not match');
            } else {
                clearFieldError(errorElement);
            }
        });
    }
}

// ===============================
// HELPER FUNCTIONS
// ===============================
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
}

function getPasswordRequirementsText() {
    return 'Password must have: 8+ characters, 1 uppercase, 1 lowercase, 1 number';
}

function showFieldError(errorElement, message) {
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function clearFieldError(errorElement) {
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
}

function clearFieldErrors(formType) {
    const selectors = formType === 'login'
        ? ['#loginEmailError', '#loginPasswordError']
        : ['#signupNameError', '#signupEmailError', '#signupPasswordError', '#confirmPasswordError'];

    selectors.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = '';
            element.style.display = 'none';
        }
    });
}

function showMessage(elementId, message, type = 'error') {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.textContent = message;
    element.className = `alert alert-${type} message`;
    element.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

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

    // Clear messages and errors
    clearMessages();
    clearFieldErrors('login');
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

    // Clear messages, errors, and reset password strength
    clearMessages();
    clearFieldErrors('signup');
    resetPasswordStrengthMeter();
}

function clearMessages() {
    const messages = document.querySelectorAll('.message');
    messages.forEach(msg => {
        msg.style.display = 'none';
        msg.textContent = '';
    });
}

// ===============================
// PASSWORD STRENGTH FUNCTIONS
// ===============================
function checkPasswordStrength(password) {
    if (!password) {
        resetPasswordStrengthMeter();
        return;
    }

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

    updatePasswordStrengthUI(strength, requirements);
}

function resetPasswordStrengthMeter() {
    const meter = document.getElementById('passwordStrengthMeter');
    const requirements = document.getElementById('passwordRequirements');

    if (meter) {
        meter.style.width = '0%';
        meter.className = 'password-strength-meter';
    }

    if (requirements) {
        requirements.innerHTML = '';
    }
}

function updatePasswordStrengthUI(strength, requirements) {
    const meter = document.getElementById('passwordStrengthMeter');
    const requirementsList = document.getElementById('passwordRequirements');

    if (meter) {
        meter.style.width = `${strength}%`;
        meter.className = 'password-strength-meter';

        if (strength >= 100) {
            meter.classList.add('strong');
        } else if (strength >= 50) {
            meter.classList.add('medium');
        } else if (strength > 0) {
            meter.classList.add('weak');
        }
    }

    if (requirementsList) {
        requirementsList.innerHTML = requirements.map(req =>
            `<span class="d-block small">${req}</span>`
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
        error.textContent = '';
        error.style.display = 'none';
        return true;
    }
}

// ===============================
// FIREBASE AUTH FUNCTIONS
// ===============================
let firebase; // Declare firebase variable

async function handleLogin(e) {
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value.trim();
    const submitBtn = document.querySelector('#loginForm button[type="submit"]');

    if (!submitBtn || !email || !password) return;

    // Show loading state
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    submitBtn.disabled = true;

    try {
        // Check Firebase availability
        if (typeof firebase === 'undefined' || !firebase.auth) {
            // Demo login (for development/testing)
            const user = {
                uid: 'user-' + Date.now(),
                email: email,
                displayName: email.split('@')[0],
                lastLogin: new Date().toISOString()
            };

            localStorage.setItem('user', JSON.stringify(user));
            showMessage('loginMessage', 'Login successful! Redirecting...', 'success');

            if (typeof window.updateAuthButton === 'function') {
                window.updateAuthButton();
            }

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            return;
        }

        let userCredential;

        try {
            // Try Firebase authentication
            userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Store user info
            localStorage.setItem('user', JSON.stringify({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || email.split('@')[0],
                lastLogin: new Date().toISOString()
            }));

            showMessage('loginMessage', 'Login successful! Redirecting...', 'success');

            if (typeof window.updateAuthButton === 'function') {
                window.updateAuthButton();
            }

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);

        } catch (firebaseError) {
            console.error('Firebase error:', firebaseError);
            let errorMessage = 'Login failed. ';

            if (firebaseError.code) {
                switch (firebaseError.code) {
                    case 'auth/user-not-found':
                        errorMessage = 'No account found with this email.';
                        break;
                    case 'auth/wrong-password':
                        errorMessage = 'Incorrect password. Please try again.';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Invalid email address.';
                        break;
                    case 'auth/user-disabled':
                        errorMessage = 'This account has been disabled.';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Too many failed attempts. Please try again later.';
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = 'Network error. Please check your connection.';
                        break;
                    default:
                        errorMessage += firebaseError.message || 'Please try again.';
                }
            } else {
                errorMessage += firebaseError.message || 'Please check your credentials.';
            }

            showMessage('loginMessage', errorMessage, 'danger');
        }

    } catch (error) {
        console.error('Login error:', error);
        showMessage('loginMessage', 'An unexpected error occurred. Please try again.', 'danger');

    } finally {
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function handleSignup(e) {
    const name = document.getElementById('signupName')?.value.trim();
    const email = document.getElementById('signupEmail')?.value.trim();
    const password = document.getElementById('signupPassword')?.value.trim();
    const submitBtn = document.querySelector('#signupForm button[type="submit"]');

    if (!submitBtn) return;

    // Show loading state
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    submitBtn.disabled = true;

    try {
        // Check Firebase availability
        if (typeof firebase === 'undefined') {
            throw new Error('Authentication service not available');
        }

        let userCredential;

        // Try Firebase v8 compatibility mode
        if (firebase.auth && firebase.auth().createUserWithEmailAndPassword) {
            userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        } else {
            // Try Firebase v9 modular SDK
            try {
                const { getAuth, createUserWithEmailAndPassword } = firebase.auth;
                const auth = getAuth();
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
            } catch (firebaseError) {
                throw new Error('Firebase authentication failed. Please check configuration.');
            }
        }

        const user = userCredential.user;

        // Update profile with display name
        try {
            if (user.updateProfile) {
                await user.updateProfile({
                    displayName: name
                });
            }
        } catch (profileError) {
            console.warn('Could not update profile:', profileError);
        }

        // Store user info
        localStorage.setItem('user', JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: name,
            createdAt: new Date().toISOString()
        }));

        // Show success message
        showMessage('signupMessage', 'Account created successfully! Redirecting...', 'success');

        // Update auth button in main.js if available
        if (typeof window.updateAuthButton === 'function') {
            window.updateAuthButton();
        }

        // Redirect after delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);

    } catch (error) {
        console.error('Signup error:', error);

        let errorMessage = 'Signup failed. ';

        // Handle specific Firebase errors
        if (error.code) {
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Email already in use. Please use a different email or login.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address.';
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = 'Email/password accounts are not enabled.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak. Please use a stronger password.';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Network error. Please check your connection.';
                    break;
                default:
                    errorMessage += error.message || 'Please try again.';
            }
        } else {
            errorMessage += error.message || 'Please check your information and try again.';
        }

        showMessage('signupMessage', errorMessage, 'danger');

    } finally {
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function resetPassword(email) {
    if (!email || !isValidEmail(email)) {
        showMessage('loginMessage', 'Please enter a valid email address', 'error');
        return;
    }

    try {
        if (typeof firebase === 'undefined') {
            throw new Error('Authentication service not available');
        }

        if (firebase.auth && firebase.auth().sendPasswordResetEmail) {
            await firebase.auth().sendPasswordResetEmail(email);
        } else {
            const { getAuth, sendPasswordResetEmail } = firebase.auth;
            const auth = getAuth();
            await sendPasswordResetEmail(auth, email);
        }

        showMessage('loginMessage', 'Password reset email sent! Check your inbox.', 'success');

    } catch (error) {
        console.error('Reset password error:', error);

        let errorMessage = 'Failed to send reset email. ';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address.';
        } else {
            errorMessage += error.message || 'Please try again.';
        }

        showMessage('loginMessage', errorMessage, 'error');
    }
}

function showForgotPasswordModal() {
    const email = prompt('Please enter your email address:');
    if (email && isValidEmail(email)) {
        resetPassword(email);
    } else if (email) {
        alert('Please enter a valid email address.');
    }
}

// ===============================
// AUTH STATE MANAGEMENT
// ===============================
function checkAuthState() {
    // Check if user is already logged in via localStorage
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (user && user.email) {
        // User is already logged in, redirect to home
        showMessage('loginMessage', 'You are already logged in. Redirecting...', 'info');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }

    // If Firebase is available, also check Firebase auth state
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(function (firebaseUser) {
            if (firebaseUser && window.location.pathname.includes('auth.html')) {
                // Firebase user is logged in, but not in localStorage
                localStorage.setItem('user', JSON.stringify({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName
                }));

                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }
        });
    }
}

// ===============================
// SIMULATED AUTH FOR DEMO (Fallback)
// ===============================
function simulateLogin(email, password) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Demo validation
            if (!email || !password) {
                reject(new Error('Email and password are required'));
                return;
            }

            if (!isValidEmail(email)) {
                reject(new Error('Invalid email address'));
                return;
            }

            if (password.length < 6) {
                reject(new Error('Password must be at least 6 characters'));
                return;
            }

            // Success - simulate user data
            const user = {
                uid: 'demo-' + Date.now(),
                email: email,
                displayName: email.split('@')[0],
                isDemo: true
            };

            localStorage.setItem('user', JSON.stringify(user));
            resolve(user);
        }, 1000);
    });
}

function simulateSignup(name, email, password) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Demo validation
            if (!name || !email || !password) {
                reject(new Error('All fields are required'));
                return;
            }

            if (!isValidEmail(email)) {
                reject(new Error('Invalid email address'));
                return;
            }

            if (!isValidPassword(password)) {
                reject(new Error(getPasswordRequirementsText()));
                return;
            }

            // Check if email already exists (demo)
            const existingUsers = JSON.parse(localStorage.getItem('demoUsers') || '[]');
            if (existingUsers.some(user => user.email === email)) {
                reject(new Error('Email already in use'));
                return;
            }

            // Success - create demo user
            const user = {
                uid: 'demo-' + Date.now(),
                email: email,
                displayName: name,
                isDemo: true,
                createdAt: new Date().toISOString()
            };

            // Save to demo users
            existingUsers.push(user);
            localStorage.setItem('demoUsers', JSON.stringify(existingUsers));
            localStorage.setItem('user', JSON.stringify(user));

            resolve(user);
        }, 1500);
    });
}

// ===============================
// EXPORT FUNCTIONS
// ===============================
window.showLoginForm = showLoginForm;
window.showSignupForm = showSignupForm;
window.validateLoginForm = validateLoginForm;
window.validateSignupForm = validateSignupForm;
