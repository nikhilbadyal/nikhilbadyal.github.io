'use strict';

document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll('[data-nav-link]');
  const sections = document.querySelectorAll('article');

  // Function to show the section based on the URL hash
  const showSection = () => {
    const hash = window.location.hash || '#about';  // Default to About if no hash is present
    sections.forEach(section => {
      section.classList.remove('active');  // Hide all sections
      if (section.id === hash.substring(1)) {
        section.classList.add('active');  // Show the matching section
      }
    });

    // Update active link
    navLinks.forEach(link => {
      link.classList.remove('active');  // Remove active class from all links
      if (link.getAttribute('data-nav-link') === hash) {
        link.classList.add('active');  // Add active class to the clicked link
      }
    });
  };

  // Handle link click events
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      window.location.hash = link.getAttribute('data-nav-link');  // Update the URL hash
      showSection();  // Show the appropriate section
    });
  });

  // Initial page load or when the hash changes
  window.addEventListener('hashchange', showSection);

  // Call to show the section when the page loads
  showSection();
});


// Base URL for jsDelivr
const baseUrl = "https://cdn.jsdelivr.net/gh/nikhilbadyal/nikhilbadyal.github.io@main/assets/images/";
const localBaseUrl = "./assets/images/";

// Select all <img> tags
const images = document.querySelectorAll("img");

images.forEach((img) => {
    // Determine environment and set the image path accordingly
    if (img.src.includes("localhost")) {
    // if (true) {
        img.src = localBaseUrl + img.getAttribute("src"); // Use local path for localhost
    } else {
        img.src = baseUrl + img.getAttribute("src"); // Use jsDelivr for other environments
    }
    console.log(img.src)
});


// element toggle function
const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }



// sidebar variables
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

// sidebar toggle functionality for mobile
sidebarBtn.addEventListener("click", function () { elementToggleFunc(sidebar); });


// custom select variables
const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue = document.querySelector("[data-selecct-value]");
const filterBtn = document.querySelectorAll("[data-filter-btn]");

select.addEventListener("click", function () { elementToggleFunc(this); });

// add event in all select items
for (let i = 0; i < selectItems.length; i++) {
  selectItems[i].addEventListener("click", function () {

    let selectedValue = this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    elementToggleFunc(select);
    filterFunc(selectedValue);

  });
}

// filter variables
const filterItems = document.querySelectorAll("[data-filter-item]");

const filterFunc = function (selectedValue) {

  for (let i = 0; i < filterItems.length; i++) {

    if (selectedValue === "all") {
      filterItems[i].classList.add("active");
    } else if (selectedValue === filterItems[i].dataset.category) {
      filterItems[i].classList.add("active");
    } else {
      filterItems[i].classList.remove("active");
    }

  }

}

// add event in all filter button items for large screen
let lastClickedBtn = filterBtn[0];

for (let i = 0; i < filterBtn.length; i++) {

  filterBtn[i].addEventListener("click", function () {

    let selectedValue = this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    filterFunc(selectedValue);

    lastClickedBtn.classList.remove("active");
    this.classList.add("active");
    lastClickedBtn = this;

  });

}



// contact form variables
const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");

// add event to all form input field
for (let i = 0; i < formInputs.length; i++) {
  formInputs[i].addEventListener("input", function () {

    // check form validation
    if (form.checkValidity()) {
      formBtn.removeAttribute("disabled");
    } else {
      formBtn.setAttribute("disabled", "");
    }

  });
}



// page navigation variables
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

// add event to all nav link
for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {

    for (let i = 0; i < pages.length; i++) {
      if (this.innerHTML.toLowerCase() === pages[i].dataset.page) {
        pages[i].classList.add("active");
        navigationLinks[i].classList.add("active");
        window.scrollTo(0, 0);
      } else {
        pages[i].classList.remove("active");
        navigationLinks[i].classList.remove("active");
      }
    }

  });
}


document.querySelectorAll('.project-item a').forEach(link => {
    link.setAttribute('target', '_blank');
  });


function copyEmail() {
  const email = document.getElementById('email').textContent; // Get the email address
  navigator.clipboard.writeText(email).then(
    () => {
      showToast(); // Show the toast notification
    },
    (err) => {
      console.error('Failed to copy email address:', err);
    }
  );
}

function showToast() {
  const toast = document.getElementById('toast');
  toast.classList.add('show'); // Add the show class to display the toast

  // Hide the toast after 2 seconds
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Function to close the toast
function closeToast() {
  const toast = document.getElementById('toast');
  toast.classList.remove('show'); // Hide the toast
}

if ('vibrate' in navigator) {
  navigator.vibrate(100); // Vibrate for 100ms
}

(async () => {
  try {
    const res = await fetch("https://tracker.wool-rage-jimmy.workers.dev/", {
      method: "POST",
      keepalive: true,
      body: JSON.stringify({
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        screen: {
          width: screen.width,
          height: screen.height
        },
        url: window.location.href
      }),
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Tracking failed with status:", res.status, text);
    } else {
      console.log("Tracking successful.");
    }
  } catch (err) {
    console.error("Tracking failed with error:", err);
  }
})();


form.addEventListener("submit", async (event) => {
  event.preventDefault(); // Prevent actual form submission

  const formData = {
    name: form.fullname.value,
    email: form.email.value,
    message: form.message.value,
  };

  try {
    const response = await fetch("https://sender.wool-rage-jimmy.workers.dev", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      alert("Message sent successfully!");
      form.reset();
      formBtn.setAttribute("disabled", ""); // Disable again after reset
    } else {
      const errorText = await response.text();
      console.error("Failed to send:", errorText);
      alert("Failed to send message. Try again later.");
    }
  } catch (err) {
    console.error("Network error:", err);
    alert("Network error. Try again later.");
  }
});

