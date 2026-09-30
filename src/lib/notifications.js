import { userEmail, notificationPermission, notificationsEnabled } from './stores.js';
import { get } from 'svelte/store';
import { validateEmail } from './utils.js';

let notifiedSubstitutions = new Set();

// Funzione per ottenere l'email validata
function getValidatedUserEmail() {
  const email = get(userEmail);
  if (!validateEmail(email)) {
    // Se l'email non è valida, pulisci lo store
    userEmail.set(null);
    localStorage.removeItem('user:email');
    return null;
  }
  return email;
}

export async function requestNotificationPermission() {
	if (!('Notification' in window)) {
		console.log('Le notifiche non sono supportate');
		return false;
	}

	if (Notification.permission === 'granted') {
		notificationPermission.set(true);
		notificationsEnabled.set(true);
		return true;
	}

	if (Notification.permission !== 'denied') {
		const permission = await Notification.requestPermission();
		const granted = permission === 'granted';
		notificationPermission.set(granted);
		notificationsEnabled.set(granted);
		return granted;
	}

	return false;
}

export async function enableNotifications() {
	if (typeof window === 'undefined' || !('Notification' in window)) {
		if (typeof window !== 'undefined') {
			alert('Le notifiche non sono supportate da questo browser.');
		}
		notificationsEnabled.set(false);
		notificationPermission.set(false);
		return false;
	}

	if (Notification.permission === 'denied') {
		alert('Le notifiche risultano bloccate nel browser. Per attivarle, modifica i permessi nelle impostazioni del sito o del browser.');
		notificationsEnabled.set(false);
		notificationPermission.set(false);
		return false;
	}

	if (Notification.permission === 'default') {
		const permission = await Notification.requestPermission();
		const granted = permission === 'granted';
		notificationPermission.set(granted);
		notificationsEnabled.set(granted);
		if (granted) {
			syncNotificationsWithServiceWorker(true);
		}
		return granted;
	}

	if (Notification.permission === 'granted') {
		notificationPermission.set(true);
		notificationsEnabled.set(true);
		syncNotificationsWithServiceWorker(true);
		return true;
	}

	return false;
}

export function disableNotifications() {
	notificationsEnabled.set(false);
	syncNotificationsWithServiceWorker(false);
}

export async function toggleNotifications() {
	const current = get(notificationsEnabled);
	if (current) {
		disableNotifications();
		return false;
	} else {
		return await enableNotifications();
	}
}

export function checkNotificationPermission() {
	const hasPermission = typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
	notificationPermission.set(hasPermission);
	if (!hasPermission && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied') {
		notificationsEnabled.set(false);
	}
	return hasPermission;
}

export function showSubstitutionNotification(substitution) {
	if (!get(notificationsEnabled) || typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted' || notifiedSubstitutions.has(substitution.id)) {
		return;
	}

	const notification = new Notification('Sostituzione non confermata', {
		body: `Hai una sostituzione alle ${substitution.ora} per la classe ${substitution.classe} che necessita conferma.`,
		icon: 'https://www.liceoscientificocortese.edu.it/app/way/tmp/favicon.png',
		badge: 'https://www.liceoscientificocortese.edu.it/app/way/tmp/favicon.png',
		tag: `substitution-${substitution.id}`,
		requireInteraction: true,
		data: {
			substitutionId: substitution.id,
			url: 'https://www.liceoscientificocortese.edu.it/app/way/tmp/sostituzioni'
		}
	});

	notification.onclick = function(event) {
		event.preventDefault();
		window.focus();
		window.location.href = 'https://www.liceoscientificocortese.edu.it/app/way/tmp/sostituzioni';
		notification.close();
	};

	notifiedSubstitutions.add(substitution.id);
}

export function checkSubstitutionsForNotifications(substitutions) {
	if (!get(notificationsEnabled) || typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;

	const today = new Date().toISOString().split('T')[0];
	const todaySubstitutions = substitutions.filter(s => 
		s.data === today && !s.accettato
	);

	todaySubstitutions.forEach(substitution => {
		showSubstitutionNotification(substitution);
	});
}

export function clearNotifiedSubstitutions() {
	notifiedSubstitutions.clear();
}

// Funzione per registrare il controllo periodico in background
export async function setupBackgroundSync() {
	if ('serviceWorker' in navigator) {
		const registration = await navigator.serviceWorker.ready;
		
		// Sincronizza sempre l'email dell'utente con il service worker
		syncUserEmailWithServiceWorker();
		syncNotificationsWithServiceWorker(get(notificationsEnabled));
		
		// Setup del controllo periodico
		if ('sync' in window.ServiceWorkerRegistration.prototype) {
			return registration.sync.register('check-substitutions');
		}
	}
}

// Funzione per sincronizzare l'email dell'utente con il service worker
export function syncUserEmailWithServiceWorker() {
	if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
		const currentEmail = getValidatedUserEmail();
		navigator.serviceWorker.controller.postMessage({
			type: 'SET_USER_EMAIL',
			email: currentEmail,
			notificationsEnabled: get(notificationsEnabled)
		});
	}
}

// Funzione per sincronizzare l'abilitazione delle notifiche con il service worker
export function syncNotificationsWithServiceWorker(enabled) {
	if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
		navigator.serviceWorker.controller.postMessage({
			type: 'SET_NOTIFICATIONS_ENABLED',
			enabled: !!enabled
		});
	}
}

// Funzione per rimuovere l'utente dal service worker
export function clearUserFromServiceWorker() {
	if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
		navigator.serviceWorker.controller.postMessage({
			type: 'SET_USER_EMAIL',
			email: null
		});
	}
}
