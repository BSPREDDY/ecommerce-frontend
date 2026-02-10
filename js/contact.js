// contact.js - Contact Form with Proper Validation
// ===============================
// Contact form with comprehensive validation
// ===============================

$(document).ready(function () {
    const $form = $('#contactForm');
    if (!$form.length) return;

    const $name = $('#name');
    const $email = $('#email');
    const $subject = $('#subject');
    const $message = $('#message');
    const $submitBtn = $form.find('button[type="submit"]');

    const $nameError = $('#nameError');
    const $emailError = $('#emailError');
    const $subjectError = $('#subjectError');
    const $messageError = $('#messageError');
    const $formMessage = $('#formMessage');

    // Initialize all error messages and form message
    $nameError.hide().text('');
    $emailError.hide().text('');
    $subjectError.hide().text('');
    $messageError.hide().text('');
    $formMessage.hide().text('');

    // Remove any existing validation classes
    $name.removeClass('is-invalid is-valid');
    $email.removeClass('is-invalid is-valid');
    $subject.removeClass('is-invalid is-valid');
    $message.removeClass('is-invalid is-valid');

    // Real-time validation on input
    $name.on('input', function () {
        validateName(true); // true = real-time validation
    });

    $email.on('input', function () {
        validateEmail(true);
    });

    $subject.on('input', function () {
        validateSubject(true);
    });

    $message.on('input', function () {
        validateMessage(true);
    });

    // Validation on blur (when user leaves field)
    $name.on('blur', function () {
        validateName(false);
    });

    $email.on('blur', function () {
        validateEmail(false);
    });

    $subject.on('blur', function () {
        validateSubject(false);
    });

    $message.on('blur', function () {
        validateMessage(false);
    });

    // Form submission
    $form.on('submit', function (e) {
        e.preventDefault();
        e.stopPropagation();

        // Validate all fields on submit
        const isNameValid = validateName(false);
        const isEmailValid = validateEmail(false);
        const isSubjectValid = validateSubject(false);
        const isMessageValid = validateMessage(false);

        // Check if all fields are valid
        if (isNameValid && isEmailValid && isSubjectValid && isMessageValid) {
            handleSubmit(e);
        } else {
            // Show general error message
            showFormMessage('Please fix all errors before submitting.', 'danger');
            // Scroll to first error
            scrollToFirstError();
        }
    });

    // ===============================
    // VALIDATION FUNCTIONS
    // ===============================
    function validateName(isRealTime) {
        const value = $name.val().trim();
        let isValid = true;
        let errorMessage = '';

        if (!value) {
            errorMessage = 'Name is required';
            isValid = false;
        } else if (value.length < 2) {
            errorMessage = 'Name must be at least 2 characters';
            isValid = false;
        } else if (value.length > 50) {
            errorMessage = 'Name cannot exceed 50 characters';
            isValid = false;
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
            errorMessage = 'Name can only contain letters and spaces';
            isValid = false;
        }

        // Only show errors on blur or if there's an error in real-time
        if (!isRealTime || !isValid) {
            if (!isValid) {
                showError($name, $nameError, errorMessage);
            } else {
                hideError($name, $nameError);
            }
        }

        return isValid;
    }

    function validateEmail(isRealTime) {
        const value = $email.val().trim();
        let isValid = true;
        let errorMessage = '';

        // Comprehensive email regex
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!value) {
            errorMessage = 'Email is required';
            isValid = false;
        } else if (!emailRegex.test(value)) {
            errorMessage = 'Please enter a valid email address (e.g., name@example.com)';
            isValid = false;
        } else if (value.length > 100) {
            errorMessage = 'Email cannot exceed 100 characters';
            isValid = false;
        }

        // Only show errors on blur or if there's an error in real-time
        if (!isRealTime || !isValid) {
            if (!isValid) {
                showError($email, $emailError, errorMessage);
            } else {
                hideError($email, $emailError);
            }
        }

        return isValid;
    }

    function validateSubject(isRealTime) {
        const value = $subject.val().trim();
        let isValid = true;
        let errorMessage = '';

        if (!value) {
            errorMessage = 'Subject is required';
            isValid = false;
        } else if (value.length < 3) {
            errorMessage = 'Subject must be at least 3 characters';
            isValid = false;
        } else if (value.length > 100) {
            errorMessage = 'Subject cannot exceed 100 characters';
            isValid = false;
        }

        // Only show errors on blur or if there's an error in real-time
        if (!isRealTime || !isValid) {
            if (!isValid) {
                showError($subject, $subjectError, errorMessage);
            } else {
                hideError($subject, $subjectError);
            }
        }

        return isValid;
    }

    function validateMessage(isRealTime) {
        const value = $message.val().trim();
        let isValid = true;
        let errorMessage = '';

        if (!value) {
            errorMessage = 'Message is required';
            isValid = false;
        } else if (value.length < 10) {
            errorMessage = 'Message must be at least 10 characters';
            isValid = false;
        } else if (value.length > 1000) {
            errorMessage = 'Message cannot exceed 1000 characters';
            isValid = false;
        }

        // Only show errors on blur or if there's an error in real-time
        if (!isRealTime || !isValid) {
            if (!isValid) {
                showError($message, $messageError, errorMessage);
            } else {
                hideError($message, $messageError);
            }
        }

        return isValid;
    }

    function showError($input, $error, message) {
        // Remove existing classes
        $input.removeClass('is-valid').addClass('is-invalid');

        // Update error message
        $error.text(message)
            .removeClass('text-success')
            .addClass('text-danger')
            .attr('role', 'alert')
            .show();
    }

    function hideError($input, $error) {
        $input.removeClass('is-invalid').addClass('is-valid');
        $error.text('').hide();
    }

    function scrollToFirstError() {
        // Find first error and scroll to it
        const firstError = $('.is-invalid').first();
        if (firstError.length) {
            $('html, body').animate({
                scrollTop: firstError.offset().top - 100
            }, 500);
        }
    }

    // ===============================
    // FORM SUBMISSION HANDLER
    // ===============================
    async function handleSubmit(e) {
        // Prevent default submission
        e.preventDefault();

        // Store original button state
        const originalText = $submitBtn.html();
        const originalDisabled = $submitBtn.prop('disabled');

        // Disable button and show loading
        $submitBtn.prop('disabled', true)
            .html('<i class="fas fa-spinner fa-spin me-2"></i>Sending...');

        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Get form data
            const formData = {
                name: $name.val().trim(),
                email: $email.val().trim(),
                subject: $subject.val().trim(),
                message: $message.val().trim(),
                newsletter: $('#newsletter').is(':checked'),
                timestamp: new Date().toISOString(),
                ip: '127.0.0.1' // In real app, get from server
            };

            // Validate one more time before saving
            if (!validateAllFields()) {
                throw new Error('Form validation failed');
            }

            // Save to localStorage
            saveContactMessage(formData);

            // Show success message
            showFormMessage('Thank you! Your message has been sent successfully. We\'ll respond within 24 hours.', 'success');

            // Reset form
            resetForm();

            // Log to console (for debugging)
            console.log('Contact form submitted:', formData);

        } catch (error) {
            console.error('Form submission error:', error);

            let errorMessage = 'Something went wrong. Please try again.';

            if (error.message === 'Form validation failed') {
                errorMessage = 'Please fix all errors before submitting.';
            } else if (error.message.includes('storage')) {
                errorMessage = 'Cannot save message. Please clear some browser storage or try again.';
            }

            showFormMessage(errorMessage, 'danger');

        } finally {
            // Restore button state
            $submitBtn.prop('disabled', originalDisabled)
                .html(originalText);
        }
    }

    function validateAllFields() {
        const isNameValid = validateName(false);
        const isEmailValid = validateEmail(false);
        const isSubjectValid = validateSubject(false);
        const isMessageValid = validateMessage(false);

        return isNameValid && isEmailValid && isSubjectValid && isMessageValid;
    }

    function saveContactMessage(formData) {
        try {
            // Get existing messages
            const existingMessages = JSON.parse(localStorage.getItem('contactMessages') || '[]');

            // Add new message
            existingMessages.push({
                ...formData,
                id: Date.now(),
                status: 'unread'
            });

            // Save back to localStorage
            localStorage.setItem('contactMessages', JSON.stringify(existingMessages));

            // Also save to session for immediate display
            sessionStorage.setItem('lastContactMessage', JSON.stringify(formData));

            return true;
        } catch (error) {
            console.error('Error saving contact message:', error);
            throw new Error('Storage error: ' + error.message);
        }
    }

    function resetForm() {
        // Reset form values
        $form.trigger('reset');

        // Clear all validation states
        $name.removeClass('is-invalid is-valid');
        $email.removeClass('is-invalid is-valid');
        $subject.removeClass('is-invalid is-valid');
        $message.removeClass('is-invalid is-valid');

        // Hide all error messages
        $nameError.hide().text('');
        $emailError.hide().text('');
        $subjectError.hide().text('');
        $messageError.hide().text('');

        // Reset newsletter checkbox
        $('#newsletter').prop('checked', false);
    }

    function showFormMessage(message, type = 'info') {
        // Clear any existing timeout
        if (window.formMessageTimeout) {
            clearTimeout(window.formMessageTimeout);
        }

        // Set alert classes
        const alertClass = `alert-${type}`;
        const iconClass = type === 'success' ? 'fa-check-circle' :
            type === 'danger' ? 'fa-exclamation-circle' :
                type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';

        // Update form message
        $formMessage
            .removeClass('alert-success alert-danger alert-warning alert-info')
            .addClass(`alert ${alertClass}`)
            .html(`
                <div class="d-flex align-items-center">
                    <i class="fas ${iconClass} fa-lg me-3"></i>
                    <div class="flex-grow-1">${message}</div>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `)
            .slideDown(300);

        // Auto-hide after 8 seconds
        window.formMessageTimeout = setTimeout(() => {
            $formMessage.slideUp(300);
        }, 8000);
    }

    // ===============================
    // INITIAL FORM CHECK
    // ===============================
    // Check if there's a saved message in session
    const lastMessage = sessionStorage.getItem('lastContactMessage');
    if (lastMessage) {
        try {
            const messageData = JSON.parse(lastMessage);
            showFormMessage(`Welcome back! We received your message about "${messageData.subject}".`, 'info');
            sessionStorage.removeItem('lastContactMessage');
        } catch (e) {
            console.log('No previous message found');
        }
    }

    // ===============================
    // KEYBOARD SHORTCUTS
    // ===============================
    $(document).on('keydown', function (e) {
        // Ctrl/Cmd + Enter to submit form
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            if ($form.is(':visible')) {
                $form.submit();
            }
        }

        // Escape to reset form
        if (e.key === 'Escape') {
            if ($form.is(':visible') && confirm('Clear all form fields?')) {
                resetForm();
            }
        }
    });

    // ===============================
    // EXPORT FUNCTIONS (for debugging)
    // ===============================
    window.validateContactForm = validateAllFields;
    window.resetContactForm = resetForm;
    window.testContactForm = function () {
        // Fill form with test data
        $name.val('John Doe').trigger('input');
        $email.val('john@example.com').trigger('input');
        $subject.val('Test Message').trigger('input');
        $message.val('This is a test message to check form functionality.').trigger('input');
        $('#newsletter').prop('checked', true);
    };
});

// ===============================
// CSS for form validation (inject if needed)
// ===============================
if (!document.getElementById('contact-form-styles')) {
    const style = document.createElement('style');
    style.id = 'contact-form-styles';
    style.textContent = `
        .is-valid {
            border-color: #198754 !important;
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%23198754' d='M2.3 6.73L.6 4.53c-.4-1.04.46-1.4 1.1-.8l1.1 1.4 3.4-3.8c.6-.63 1.6-.27 1.2.7l-4 4.6c-.43.5-.8.4-1.1.1z'/%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right calc(0.375em + 0.1875rem) center;
            background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
        }
        
        .is-invalid {
            border-color: #dc3545 !important;
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right calc(0.375em + 0.1875rem) center;
            background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
        }
        
        .error-message {
            font-size: 0.875rem;
            margin-top: 0.25rem;
        }
        
        #formMessage {
            transition: all 0.3s ease;
        }
        
        .form-control:focus.is-valid,
        .form-control:focus.is-invalid {
            box-shadow: 0 0 0 0.25rem rgba(var(--bs-primary-rgb), 0.25);
        }
        
        .btn:disabled {
            opacity: 0.65;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(style);
}