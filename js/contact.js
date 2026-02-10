// contact.js - Contact form validation using JavaScript + jQuery
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

    // Initialize error messages as hidden
    $nameError.hide();
    $emailError.hide();
    $subjectError.hide();
    $messageError.hide();
    $formMessage.hide();

    // Live validation
    $name.on('input', validateName);
    $email.on('input', validateEmail);
    $subject.on('input', validateSubject);
    $message.on('input', validateMessage);

    // Submit handler
    $form.on('submit', handleSubmit);

    function validateName() {
        const value = $name.val().trim();
        if (!value) {
            showError($name, $nameError, 'Name is required');
            return false;
        }
        if (value.length < 2) {
            showError($name, $nameError, 'Name must be at least 2 characters');
            return false;
        }
        hideError($name, $nameError);
        return true;
    }

    function validateEmail() {
        const value = $email.val().trim();
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
            showError($email, $emailError, 'Email is required');
            return false;
        }
        if (!regex.test(value)) {
            showError($email, $emailError, 'Enter a valid email');
            return false;
        }
        hideError($email, $emailError);
        return true;
    }

    function validateSubject() {
        const value = $subject.val().trim();
        if (!value) {
            showError($subject, $subjectError, 'Subject is required');
            return false;
        }
        if (value.length < 3) {
            showError($subject, $subjectError, 'Subject must be at least 3 characters');
            return false;
        }
        hideError($subject, $subjectError);
        return true;
    }

    function validateMessage() {
        const value = $message.val().trim();
        if (!value) {
            showError($message, $messageError, 'Message is required');
            return false;
        }
        if (value.length < 10) {
            showError($message, $messageError, 'Message must be at least 10 characters');
            return false;
        }
        hideError($message, $messageError);
        return true;
    }

    function showError($input, $error, msg) {
        // Remove any Bootstrap validation classes first
        $input.removeClass('is-valid').addClass('is-invalid');

        // Show error message with proper styling
        $error.text(msg)
            .removeClass('text-success')
            .addClass('text-danger')
            .attr('role', 'alert')
            .css('display', 'block'); // Ensure it's displayed
        return false;
    }

    function hideError($input, $error) {
        $input.removeClass('is-invalid').addClass('is-valid');
        $error.text('').css('display', 'none'); // Hide it properly
    }

    async function handleSubmit(e) {
        e.preventDefault(); // ✅ fixed

        const valid =
            validateName() &&
            validateEmail() &&
            validateSubject() &&
            validateMessage();

        if (!valid) {
            showFormMessage('Please fix the errors above', 'danger');
            return;
        }

        // Store original button state
        const originalText = $submitBtn.html();
        const originalDisabled = $submitBtn.prop('disabled');

        $submitBtn.prop('disabled', true).html(
            '<i class="fas fa-spinner fa-spin"></i> Sending...'
        );

        try {
            // Simulate API call with delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            const data = {
                name: $name.val().trim(),
                email: $email.val().trim(),
                subject: $subject.val().trim(),
                message: $message.val().trim(),
                newsletter: $('#newsletter').is(':checked'),
                time: new Date().toISOString()
            };

            // Save to localStorage
            const messages = JSON.parse(localStorage.getItem('contactMessages')) || [];
            messages.push(data);
            localStorage.setItem('contactMessages', JSON.stringify(messages));

            showFormMessage('Message sent successfully! We\'ll get back to you soon.', 'success');

            // Reset form + clear errors
            $form.trigger('reset');
            $('.is-invalid, .is-valid').removeClass('is-invalid is-valid');
            $('.error-message').text('').css('display', 'none');

        } catch (err) {
            console.error('Form submission error:', err);
            showFormMessage('Something went wrong. Please try again.', 'danger');
        } finally {
            $submitBtn.prop('disabled', false).html(originalText);
        }
    }

    function showFormMessage(msg, type) {
        // Remove all existing alert classes
        $formMessage
            .removeClass('alert-success alert-danger alert-warning alert-info alert-primary alert-secondary alert-light alert-dark')
            .addClass(`alert alert-${type}`)
            .text(msg)
            .css({
                'display': 'block',
                'opacity': 1
            })
            .stop(true) // Stop any ongoing animations
            .hide() // Hide first
            .fadeIn(300); // Then fade in

        // Auto-hide after 5 seconds
        setTimeout(() => {
            $formMessage.fadeOut(300);
        }, 5000);
    }
});