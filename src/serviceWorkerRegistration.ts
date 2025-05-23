// src/serviceWorkerRegistration.ts

// Based on CRA's default service worker setup
const isLocalhost = Boolean(
  window.location.hostname === "localhost" ||
    window.location.hostname === "[::1]" ||
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4]\d|1?\d\d?)){3}$/
    )
);

export function register() {
  if ("serviceWorker" in navigator) {
    const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

    if (isLocalhost) {
      checkValidServiceWorker(swUrl);
    } else {
      registerValidSW(swUrl);
    }
  }
}

function registerValidSW(swUrl: string) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log("SW registered: ", registration);
    })
    .catch((error) => {
      console.error("SW registration failed: ", error);
    });
}

function checkValidServiceWorker(swUrl: string) {
  fetch(swUrl)
    .then((response) => {
      if (response.status === 404 || response.headers.get("content-type")?.indexOf("javascript") === -1) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister();
        });
      } else {
        registerValidSW(swUrl);
      }
    })
    .catch(() => {
      console.log("No internet connection found. App is running in offline mode.");
    });
}

export function unregister() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
