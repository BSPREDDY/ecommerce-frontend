// js/firebase-config.js
(function () {
    // Wait for both Firebase and CONFIG to be ready
    function initializeFirebase() {
        // Check if Firebase is available
        if (typeof firebase === 'undefined') {
            console.warn('⏳ Firebase SDK not loaded yet, retrying...');
            setTimeout(initializeFirebase, 100);
            return;
        }

        // Check if config is available
        if (!window.CONFIG || !window.CONFIG.FIREBASE) {
            console.warn('⏳ Firebase config not loaded yet, retrying...');
            setTimeout(initializeFirebase, 100);
            return;
        }

        try {
            // Initialize Firebase if not already initialized
            if (!firebase.apps.length) {
                firebase.initializeApp(window.CONFIG.FIREBASE);
                console.log('✅ Firebase initialized successfully');
            } else {
                console.log('✅ Firebase already initialized');
            }

            // Set persistence
            const auth = firebase.auth();

            auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
                .then(() => {
                    console.log('✅ Firebase persistence set to LOCAL');

                    // Dispatch ready event
                    document.dispatchEvent(
                        new CustomEvent('firebase-ready', {
                            detail: { auth: auth }
                        })
                    );
                })
                .catch((error) => {
                    console.error('❌ Error setting persistence:', error);
                    // Still dispatch event but with error info
                    document.dispatchEvent(
                        new CustomEvent('firebase-ready', {
                            detail: { auth: auth, error: error }
                        })
                    );
                });

        } catch (error) {
            console.error('❌ Firebase initialization error:', error);

            // Dispatch error event
            document.dispatchEvent(
                new CustomEvent('firebase-error', {
                    detail: { error: error }
                })
            );
        }
    }

    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeFirebase);
    } else {
        initializeFirebase();
    }
})();