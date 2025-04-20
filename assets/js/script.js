"use strict";

// --- Constants ---
const JS_DELIVR_BASE_URL =
	"https://cdn.jsdelivr.net/gh/nikhilbadyal/nikhilbadyal.github.io@main/assets/images/";
const LOCAL_BASE_URL = "./assets/images/";

// --- Helper Functions ---

/**
 * Toggles the 'active' class on a given element.
 * @param {Element} elem - The DOM element to toggle.
 */
const elementToggleFunc = (elem) => {
	elem.classList.toggle("active");
};

/**
 * Shows a toast notification message.
 * @param {string} message - The message to display in the toast.
 */
function showToast(message) {
	const toast = document.getElementById("toast");
	if (!toast) {
		console.error("Toast element not found!");
		return;
	}
	toast.textContent = message;
	toast.classList.add("show");

	// Hide the toast after 3 seconds
	setTimeout(() => {
		toast.classList.remove("show");
	}, 3000);
}

/**
 * Closes the toast notification immediately.
 */
function closeToast() {
	const toast = document.getElementById("toast");
	if (toast) {
		toast.classList.remove("show");
	}
}

// --- Initialization Functions ---

/**
 * Initializes hash-based page navigation.
 * Updates content visibility and active link based on URL hash.
 */
function initHashNavigation() {
	const navLinks = document.querySelectorAll("[data-nav-link]");
	const sections = document.querySelectorAll("article[id]"); // Select articles with an ID

	const showSection = () => {
		// Default to '#about' if no hash or invalid hash
		let hash = window.location.hash;
		const validHashes = Array.from(sections).map((s) => `#${s.id}`);
		if (!hash || !validHashes.includes(hash)) {
			hash = "#about";
			// Optionally update the URL if defaulting
			// window.history.replaceState(null, null, ' '); // Removes hash
			// window.history.replaceState(null, null, hash); // Sets default hash
		}

		const targetId = hash.substring(1);

		sections.forEach((section) => {
			section.classList.toggle("active", section.id === targetId);
		});

		navLinks.forEach((link) => {
			link.classList.toggle(
				"active",
				link.getAttribute("data-nav-link") === hash
			);
		});

		// Optional: Scroll to top when section changes
		window.scrollTo(0, 0);
	};

	navLinks.forEach((link) => {
		link.addEventListener("click", (event) => {
			const targetHash = link.getAttribute("data-nav-link");
			if (window.location.hash !== targetHash) {
				window.location.hash = targetHash;
				// showSection() will be triggered by the 'hashchange' event
			} else {
				// If clicking the already active link, maybe force show? (optional)
				showSection();
			}
			// Prevent default if it's a plain '#' link that might cause jumpiness
			if (targetHash === "#") event.preventDefault();
		});
	});

	window.addEventListener("hashchange", showSection);

	// Initial load
	showSection();
}

/**
 * Switches image sources based on the environment (localhost vs. deployed).
 */
function initImageSwitcher() {
	const images = document.querySelectorAll("img[src]"); // Select only images with src attribute

	images.forEach((img) => {
		const currentSrc = img.getAttribute("src"); // Get the original src value
		if (!currentSrc) return; // Skip if src is empty

		// Check if the *current* src attribute seems like a relative path intended for replacement
		// Avoid re-replacing already absolute URLs unless they are explicitly localhost placeholders
		const isLikelyPlaceholder =
			!currentSrc.startsWith("http") && !currentSrc.startsWith("/");

		if (isLikelyPlaceholder) {
			if (
				window.location.hostname === "localhost" ||
				window.location.hostname === "127.0.0.1"
			) {
				img.src = LOCAL_BASE_URL + currentSrc;
			} else {
				img.src = JS_DELIVR_BASE_URL + currentSrc;
			}
			console.log("Updated img src:", img.src);
		} else {
			console.log(
				"Skipped img src update (already absolute or not a placeholder):",
				img.src
			);
		}
	});
}

/**
 * Initializes the sidebar toggle functionality for mobile view.
 */
function initSidebar() {
	const sidebar = document.querySelector("[data-sidebar]");
	const sidebarBtn = document.querySelector("[data-sidebar-btn]");

	if (sidebar && sidebarBtn) {
		sidebarBtn.addEventListener("click", () => {
			elementToggleFunc(sidebar);
		});
	} else {
		console.warn("Sidebar elements not found.");
	}
}

/**
 * Initializes the custom select dropdown and portfolio item filtering logic.
 */
function initPortfolioFilter() {
	const select = document.querySelector("[data-select]");
	const selectItems = document.querySelectorAll("[data-select-item]");
	const selectValue = document.querySelector("[data-selecct-value]"); // Typo in original attribute? Should be data-select-value?
	const filterBtns = document.querySelectorAll("[data-filter-btn]");
	const filterItems = document.querySelectorAll("[data-filter-item]");

	if (
		!select ||
		selectItems.length === 0 ||
		!selectValue ||
		filterBtns.length === 0 ||
		filterItems.length === 0
	) {
		console.warn("Portfolio filter elements missing. Filtering disabled.");
		return;
	}

	// Filter function
	const filterFunc = (selectedValue) => {
		selectedValue = selectedValue.toLowerCase(); // Ensure consistent casing
		filterItems.forEach((item) => {
			const itemCategory = item.dataset.category?.toLowerCase(); // Optional chaining and lower case
			const shouldShow =
				selectedValue === "all" || selectedValue === itemCategory;
			item.classList.toggle("active", shouldShow);
		});
	};

	// Custom select functionality
	select.addEventListener("click", function () {
		elementToggleFunc(this);
	});

	selectItems.forEach((item) => {
		item.addEventListener("click", function () {
			const selectedValue = this.innerText;
			selectValue.innerText = selectedValue;
			elementToggleFunc(select); // Close the dropdown
			filterFunc(selectedValue);

			// Sync filter buttons state (optional, but good UX)
			const filterValueLower = selectedValue.toLowerCase();
			filterBtns.forEach((btn) => {
				btn.classList.toggle(
					"active",
					btn.innerText.toLowerCase() === filterValueLower
				);
			});
			// Update lastClickedBtn if needed (assuming filterBtns logic runs after this)
			lastClickedBtn =
				Array.from(filterBtns).find((btn) =>
					btn.classList.contains("active")
				) || lastClickedBtn;
		});
	});

	// Filter button functionality (for larger screens)
	let lastClickedBtn = filterBtns[0]; // Assume first button is initially active

	filterBtns.forEach((btn) => {
		btn.addEventListener("click", function () {
			const selectedValue = this.innerText;
			selectValue.innerText = selectedValue; // Update select text to match
			filterFunc(selectedValue);

			lastClickedBtn.classList.remove("active");
			this.classList.add("active");
			lastClickedBtn = this;
		});
	});
}

/**
 * Initializes contact form validation and submission handling.
 */
function initContactForm() {
	const form = document.querySelector("[data-form]");
	const formInputs = document.querySelectorAll("[data-form-input]");
	const formBtn = document.querySelector("[data-form-btn]");

	if (!form || formInputs.length === 0 || !formBtn) {
		console.warn("Contact form elements not found.");
		return;
	}

	// Enable/disable button based on form validity
	const checkFormValidity = () => {
		if (form.checkValidity()) {
			formBtn.removeAttribute("disabled");
		} else {
			formBtn.setAttribute("disabled", "");
		}
	};

	formInputs.forEach((input) => {
		input.addEventListener("input", checkFormValidity);
	});

	// Handle form submission
	form.addEventListener("submit", async (event) => {
		event.preventDefault(); // Prevent default HTML submission
		formBtn.setAttribute("disabled", ""); // Disable button during submission
		showToast("Sending..."); // Provide feedback

		const formData = {
			name: form.fullname.value,
			email: form.email.value,
			message: form.message.value,
		};

		try {
			const response = await fetch(
				"https://sender.wool-rage-jimmy.workers.dev",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(formData),
				}
			);

			if (response.ok) {
				showToast("Message sent successfully!");
				form.reset(); // Clear the form
				// Button remains disabled due to reset until user types again
			} else {
				const errorText = await response.text();
				console.error("Failed to send message:", response.status, errorText);
				showToast(`Failed to send: ${response.statusText}. Try again.`);
				checkFormValidity(); // Re-enable button if form is still valid
			}
		} catch (err) {
			console.error("Network error sending message:", err);
			showToast("Network error. Please check connection and try again.");
			checkFormValidity(); // Re-enable button if form is still valid
		}
	});

	// Initial check in case of pre-filled values
	checkFormValidity();
}

/**
 * Sets target="_blank" for all project item links.
 */
function initExternalProjectLinks() {
	document.querySelectorAll(".project-item a").forEach((link) => {
		link.setAttribute("target", "_blank");
		link.setAttribute("rel", "noopener noreferrer"); // Security best practice for target="_blank"
	});
}

/**
 * Initializes the copy email functionality.
 */
function initCopyToClipboard() {
	// Requires an element (e.g., button) with id="copy-email-trigger" in your HTML
	const copyTrigger = document.getElementById("copy-email-trigger");
	const emailElement = document.getElementById("email"); // The element displaying the email

	if (copyTrigger && emailElement) {
		copyTrigger.addEventListener("click", () => {
			const email = emailElement.textContent.trim();
			if (email && navigator.clipboard) {
				navigator.clipboard.writeText(email).then(
					() => {
						showToast("Email Copied!");
					},
					(err) => {
						console.error("Failed to copy email address:", err);
						showToast("Copy failed. Please copy manually.");
					}
				);
			} else if (!navigator.clipboard) {
				showToast("Clipboard access not available.");
			}
		});
	} else {
		if (!copyTrigger)
			console.warn(
				"Element with id='copy-email-trigger' not found for clipboard functionality."
			);
		if (!emailElement)
			console.warn(
				"Element with id='email' not found for clipboard functionality."
			);
	}
}

/**
 * Triggers device vibration if supported.
 */
function initVibration() {
	if ("vibrate" in navigator) {
		try {
			navigator.vibrate(100); // Vibrate for 100ms
		} catch (err) {
			console.warn("Vibration failed:", err);
		}
	}
}

/**
 * Initializes and sends analytics tracking data.
 */
async function initAnalytics() {
	try {
		let sessionId = sessionStorage.getItem("sessionId");
		if (!sessionId) {
			try {
				sessionId = crypto.randomUUID();
				sessionStorage.setItem("sessionId", sessionId);
			} catch (error) {
				console.error("Error managing sessionStorage (analytics):", error);
				sessionId = "fallback-" + Date.now(); // Fallback
			}
		}

		// Ensure page is fully loaded before collecting some metrics like LCP etc. (though not strictly needed for these metrics)
		// await new Promise(resolve => {
		//     if (document.readyState === "complete") resolve();
		//     else window.addEventListener("load", resolve, { once: true });
		// });

		const payload = {
			referrer: document.referrer || null,
			url: window.location.href,
			title: document.title,
			pathname: window.location.pathname,
			search: window.location.search,
			hash: window.location.hash,
			userAgent: navigator.userAgent,
			language: navigator.language,
			cpuCores: navigator.hardwareConcurrency || null,
			deviceMemory: navigator.deviceMemory || null,
			connection: {
				effectiveType: navigator.connection?.effectiveType || null,
				downlink: navigator.connection?.downlink || null,
				rtt: navigator.connection?.rtt || null,
			},
			screen: {
				width: screen.width,
				height: screen.height,
				pixelRatio: window.devicePixelRatio,
				orientation: screen.orientation?.type || null,
			},
			doNotTrack: navigator.doNotTrack || null, // Returns "1", "0", or "unspecified"
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			visibility: document.visibilityState,
			sessionId: sessionId,
			isBot: /bot|crawl|spider|slurp|facebook|embed/i.test(navigator.userAgent),
			timestamp: new Date().toISOString(),
		};

		// Use sendBeacon if available for reliability on page unload, otherwise fallback to fetch
		const trackerUrl = "https://tracker.wool-rage-jimmy.workers.dev/";
		const data = JSON.stringify(payload);

		if (navigator.sendBeacon) {
			const sent = navigator.sendBeacon(
				trackerUrl,
				new Blob([data], { type: "application/json" })
			);
			if (sent) {
				console.log("Tracking beacon sent successfully.");
			} else {
				console.error("Tracking beacon failed initially, trying fetch.");
				// Fallback to fetch if sendBeacon fails immediately (less common)
				await fetch(trackerUrl, {
					method: "POST",
					body: data,
					headers: { "Content-Type": "application/json" },
					keepalive: true,
				});
				console.log("Tracking fetch fallback attempted.");
			}
		} else {
			// Fallback for browsers that don't support sendBeacon
			const res = await fetch(trackerUrl, {
				method: "POST",
				keepalive: true, // Important for reliability on unload
				body: data,
				headers: { "Content-Type": "application/json" },
			});

			if (!res.ok) {
				const text = await res.text();
				console.error("Tracking fetch failed with status:", res.status, text);
				// Avoid showing toast for background tasks unless critical
				// showToast("Tracking failed.");
			} else {
				console.log("Tracking fetch successful.");
			}
		}
	} catch (err) {
		console.error("Analytics initialization/sending failed:", err);
		// Avoid showing toast for background tasks
		// showToast("Tracking failed.");
	}
}

// --- Main Execution ---

document.addEventListener("DOMContentLoaded", () => {
	console.log("DOM fully loaded and parsed");

	// Initialize all modules
	initHashNavigation(); // Handles initial view and navigation clicks/changes
	initImageSwitcher();
	initSidebar();
	initPortfolioFilter();
	initContactForm();
	initExternalProjectLinks();
	initCopyToClipboard();
	initVibration();

	// Run analytics (can run independently)
	initAnalytics();

	console.log("All initializations complete.");
});
