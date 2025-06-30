"use strict"

/**
 * Data loader utility for portfolio website
 */
class DataLoader {
  constructor() {
    this.portfolioData = null
    this.resumeData = null
    this.blogData = null
  }

  /**
	 * Load JSON data from file
	 * @param {string} url - URL to JSON file
	 * @returns {Promise<Object>} - Parsed JSON data
	 */
  async loadJSON(url) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error(`Error loading JSON from ${url}:`, error)
      return null
    }
  }

  /**
	 * Initialize and load all data
	 */
  async init() {
    try {
      const [portfolioData, resumeData, blogData] = await Promise.all([
        this.loadJSON("./data/portfolio.json"),
        this.loadJSON("./data/resume.json"),
        this.loadJSON("./data/blog.json")
      ])

      this.portfolioData = portfolioData
      this.resumeData = resumeData
      this.blogData = blogData

      // Render data once loaded
      this.renderPortfolio()
      this.renderResume()
      this.renderSidebar()
      this.renderBlog()

      console.log("Data loaded successfully")
      this.removeLoadingStates()
    } catch (error) {
      console.error("Error initializing data:", error)
    }
  }

  /**
	 * Render blog posts
	 */
  renderBlog() {
    const blogList = document.querySelector(".blog-posts-list")
    if (!blogList) return
    if (!this.blogData || this.blogData.length === 0) {
      blogList.innerHTML =
				'<li class="blog-post-item"><a href="#"><figure class="blog-banner-box"><img src="assets/images/soon.png" alt="Coming soon" loading="lazy" /></figure><div class="blog-content"><div class="blog-meta"><p class="blog-category">engineering</p><span class="dot"></span><time datetime="2100-01-01">Jan 01, 2100</time></div><h3 class="h3 blog-item-title">Soon</h3><p class="blog-text">Check again after some time.</p></div></a></li>'
      return
    }
    blogList.innerHTML = this.blogData
      .map(
        (post) => `
      <li class="blog-post-item">
        <a href="${post.url}">
          <figure class="blog-banner-box">
            <img src="assets/images/soon.png" alt="${post.title}" loading="lazy" />
          </figure>
          <div class="blog-content">
            <div class="blog-meta">
              <p class="blog-category">engineering</p>
              <span class="dot"></span>
              <time datetime="${post.date}">${new Date(post.date).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}</time>
            </div>
            <h3 class="h3 blog-item-title">${post.title}</h3>
            <p class="blog-text">${post.summary}</p>
          </div>
        </a>
      </li>
    `
      )
      .join("")
  }

  /**
	 * Remove loading states from elements
	 */
  removeLoadingStates() {
    document.querySelectorAll(".loading").forEach((element) => {
      element.classList.remove("loading")
    })
  }

  /**
	 * Render portfolio projects
	 */
  renderPortfolio() {
    if (!this.portfolioData) return

    const projectList = document.querySelector(".project-list")
    if (!projectList) return

    projectList.innerHTML = this.portfolioData
      .map(
        (project) => `
      <li class="project-item active" data-filter-item data-category="${project.category}">
        <a href="${project.url}" target="_blank" rel="noopener noreferrer">
          <figure class="project-img">
            <div class="project-item-icon-box">
              <ion-icon name="open-outline"></ion-icon>
            </div>
            <img src="${project.image}" alt="${project.title}" loading="lazy" />
          </figure>
          <div class="project-content">
            <h3 class="project-title">${project.title}</h3>
            <p class="project-category">${project.description}</p>
            ${
							project.technologies
								? `
              <div class="project-technologies">
                ${project.technologies.map((tech) => `<span class="tech-tag">${tech}</span>`).join("")}
              </div>
            `
								: ""
						}
          </div>
        </a>
      </li>
    `
      )
      .join("")
  }

  /**
	 * Render resume section
	 */
  renderResume() {
    if (!this.resumeData) return

    // Render about section
    this.renderAboutSection()

    // Render services section
    this.renderServicesSection()

    // Render experience section
    this.renderExperienceSection()

    // Render education section
    this.renderEducationSection()
  }

  /**
	 * Render about section
	 */
  renderAboutSection() {
    const aboutText = document.querySelector(".about-text")
    if (!aboutText || !this.resumeData.about) return

    aboutText.innerHTML = this.resumeData.about.paragraphs
      .map((paragraph) => `<p>${paragraph}</p>`)
      .join("")
  }

  /**
	 * Render services section
	 */
  renderServicesSection() {
    const serviceList = document.querySelector(".service-list")
    if (!serviceList || !this.resumeData.services) return

    serviceList.innerHTML = this.resumeData.services
      .map(
        (service) => `
      <li class="service-item">
        <div class="service-icon-box">
          <img src="${service.icon}" alt="${service.title} icon" width="40" />
        </div>
        <div class="service-content-box">
          <h4 class="h4 service-item-title">${service.title}</h4>
          <p class="service-item-text">${service.description}</p>
        </div>
      </li>
    `
      )
      .join("")
  }

  /**
	 * Render experience section
	 */
  renderExperienceSection() {
    const timelineList = document.querySelector("#resume .timeline-list")
    if (!timelineList || !this.resumeData.experience) return

    timelineList.innerHTML = this.resumeData.experience
      .map(
        (exp) => `
      <li class="timeline-item">
        <h4 class="h4 timeline-item-title">${exp.title}</h4>
        <span>${exp.period}</span>
        <ul class="styled-list">
          ${exp.highlights
						.map(
							(highlight) => `
            <li>
              <b>${highlight.title}</b> - ${highlight.description}
            </li>
          `
						)
						.join("")}
        </ul>
      </li>
    `
      )
      .join("")
  }

  /**
	 * Render education section
	 */
  renderEducationSection() {
    const educationTimeline = document.querySelectorAll("#resume .timeline")[1]
    if (!educationTimeline || !this.resumeData.education) return

    const educationList = educationTimeline.querySelector(".timeline-list")
    if (!educationList) return

    educationList.innerHTML = this.resumeData.education
      .map(
        (edu) => `
      <li class="timeline-item">
        <h4 class="h4 timeline-item-title">${edu.institution}</h4>
        <span>${edu.period}</span>
        <p class="timeline-text">${edu.description}</p>
      </li>
    `
      )
      .join("")
  }

  /**
	 * Render sidebar information
	 */
  renderSidebar() {
    if (!this.resumeData || !this.resumeData.personal) return

    // Update name and title
    const nameElement = document.querySelector(".name")
    const titleElement = document.querySelector(".title")

    if (nameElement) nameElement.textContent = this.resumeData.personal.name
    if (titleElement) titleElement.textContent = this.resumeData.personal.title

    // Update social links
    const socialList = document.querySelector(".social-list")
    if (socialList && this.resumeData.social) {
      socialList.innerHTML = this.resumeData.social
        .map(
          (social) => `
        <li class="social-item">
          <a href="${social.url}" class="social-link" target="_blank" rel="noopener noreferrer">
            <ion-icon name="${social.icon}"></ion-icon>
          </a>
        </li>
      `
        )
        .join("")
    }
  }

  /**
	 * Get unique categories from portfolio data
	 * @returns {Array<string>} - Array of unique categories
	 */
  getCategories() {
    if (!this.portfolioData) return []
    return [...new Set(this.portfolioData.map((project) => project.category))]
  }

  /**
	 * Filter projects by category
	 * @param {string} category - Category to filter by
	 * @returns {Array<Object>} - Filtered projects
	 */
  filterProjects(category) {
    if (!this.portfolioData) return []
    if (category === "all") return this.portfolioData
    return this.portfolioData.filter(
      (project) => project.category.toLowerCase() === category.toLowerCase()
    )
  }
}

// Initialize data loader when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.dataLoader = new DataLoader()
  window.dataLoader.init()
})
