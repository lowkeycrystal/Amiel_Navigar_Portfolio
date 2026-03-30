function getSafeTheme() {
  try {
    return localStorage.getItem('theme') || 'dark';
  } catch (error) {
    console.warn('localStorage is unavailable, falling back to dark mode.');
    return 'dark';
  }
}

function setSafeTheme(theme) {
  try {
    localStorage.setItem('theme', theme);
  } catch (error) {
    console.warn('localStorage is unavailable, could not save theme preference.');
  }
}

// Apply theme immediately to prevent FOUC
const currentTheme = getSafeTheme();
document.documentElement.setAttribute('data-theme', currentTheme);

document.addEventListener('DOMContentLoaded', () => {
  // 1. Theme Toggle Logic (High Contrast Light/Dark Mode) with fallback
  const themeBtn = document.getElementById('theme-toggle');
  
  if (document.body) {
    document.body.setAttribute('data-theme', currentTheme);
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const existingTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = existingTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      if (document.body) {
        document.body.setAttribute('data-theme', newTheme);
      }
      setSafeTheme(newTheme);
    });
  }

  // 2. Page Transition Logic
  const transitionEl = document.querySelector('.page-transition');
  if (transitionEl) {
    // Animate out on load
    setTimeout(() => {
      transitionEl.classList.add('is-loaded');
    }, 150);
  }

  // 3. Glassmorphism Header on Scroll
  const header = document.getElementById('main-header');
  const handleScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }  
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // 4. Intersection Observer for subtle scroll animations
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  const animatedElements = document.querySelectorAll('.fade-in-up');
  animatedElements.forEach(el => observer.observe(el));

  // 5. Functional Filtering for Work Page
  const filterBtns = document.querySelectorAll('.filter-btn');
  const assetBoxes = document.querySelectorAll('.page-work .asset-box');
  if (filterBtns.length > 0 && assetBoxes.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        const filterValue = e.target.getAttribute('data-filter');
        assetBoxes.forEach(box => {
          if (filterValue === 'all' || box.getAttribute('data-category') === filterValue) {
            box.classList.remove('hidden');
          } else {
            box.classList.add('hidden');
          }
        });
      });
    });
  }

  // 6. Custom Brutalist Cursor Logic
  const cursor = document.getElementById('custom-cursor');
  if (cursor && window.matchMedia("(pointer: fine)").matches) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    const renderCursor = () => {
      cursorX += (mouseX - cursorX) * 0.25;
      cursorY += (mouseY - cursorY) * 0.25;
      cursor.style.transform = `translate(calc(${cursorX}px - 50%), calc(${cursorY}px - 50%))`;
      requestAnimationFrame(renderCursor);
    };
    requestAnimationFrame(renderCursor);

    const interactables = document.querySelectorAll('a, button, .asset-box, input, textarea');
    interactables.forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
  }

  // 7. AJAX Contact Form Submission
  const contactForm = document.getElementById('contact-form');
  const formMessages = document.getElementById('form-messages');

  if (contactForm && formMessages) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'SENDING...';
      submitBtn.disabled = true;

      const formData = new FormData(contactForm);

      fetch(contactForm.action, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      })
      .then(response => {
        if (response.ok) {
          contactForm.reset();
          formMessages.innerHTML = 'Message sent successfully. I will get back to you soon.';
        } else {
          return response.json().then(data => {
            if (data && data.errors) {
              formMessages.innerHTML = data.errors.map(error => error.message).join(", ");
            } else {
              formMessages.innerHTML = 'Oops! There was a problem submitting your form.';
            }
          });
        }
      })
      .catch(error => {
        formMessages.innerHTML = 'Oops! There was a problem submitting your form.';
      })
      .finally(() => {
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        setTimeout(() => {
          formMessages.innerHTML = '';
        }, 5000);
      });
    });
  }
});