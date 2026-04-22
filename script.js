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

const currentTheme = getSafeTheme();
document.documentElement.setAttribute('data-theme', currentTheme);

document.addEventListener('DOMContentLoaded', () => {
  const titleTag = document.querySelector('title');
  if (titleTag && titleTag.textContent) {
    document.title = titleTag.textContent;
  }

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

  const transitionEl = document.querySelector('.page-transition');
  if (transitionEl) {
    setTimeout(() => {
      transitionEl.classList.add('is-loaded');
    }, 150);
  }

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

  // Unified Observer for fade-ins and stagger animations
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.1
  };
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  const animatedElements = document.querySelectorAll('.fade-in-up, .slide-up-group');
  animatedElements.forEach(el => observer.observe(el));

  // Work Page Loader & Staggered Row Animation
  const pageLoader = document.getElementById('page-loader');
  if (pageLoader) {
    const assetBoxes = Array.from(document.querySelectorAll('.page-work .asset-box'));
    
    // Set initial state for stagger animation
    assetBoxes.forEach(box => {
      box.style.opacity = '0';
      box.style.transform = 'translateY(30px)';
      box.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
    });

    const mediaElements = Array.from(document.querySelectorAll('.page-work .asset-media'));
    
    // Optimize videos by preventing simultaneous loading
    const videoElements = mediaElements.filter(el => el.tagName.toLowerCase() === 'video');
    videoElements.forEach((vid, index) => {
      if (index > 3) {
        vid.removeAttribute('autoplay');
        vid.setAttribute('preload', 'none');
      }
    });

    // Setup Intersection Observer to animate items row by row
    const animateObserver = new IntersectionObserver((entries, observer) => {
      const rows = new Map();
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const top = Math.round(entry.boundingClientRect.top);
          let foundRow = false;
          for (let [rowTop, items] of rows.entries()) {
            if (Math.abs(rowTop - top) < 40) { // 40px tolerance for row alignment
              items.push(entry.target);
              foundRow = true;
              break;
            }
          }
          if (!foundRow) {
            rows.set(top, [entry.target]);
          }
          observer.unobserve(entry.target);
          
          // Lazy play videos
          const video = entry.target.querySelector('video');
          if (video && video.hasAttribute('preload')) {
             video.setAttribute('preload', 'auto');
             video.play().catch(e => console.warn('Autoplay prevented:', e));
          }
        }
      });
      
      if (rows.size > 0) {
        const sortedRows = Array.from(rows.keys()).sort((a, b) => a - b);
        sortedRows.forEach((rowTop, rowIndex) => {
          const items = rows.get(rowTop);
          items.forEach(item => {
             // Delay based on row index to stagger downwards
             item.style.transitionDelay = `${rowIndex * 0.15}s`;
             requestAnimationFrame(() => {
               item.style.opacity = '1';
               item.style.transform = 'translateY(0)';
             });
          });
        });
      }
    }, { rootMargin: '100px 0px', threshold: 0.05 });

    // Handle loader logic (wait for first 6 items only to prevent long blank screens)
    let loadedCount = 0;
    const mediaToLoad = mediaElements.slice(0, 6);
    const totalMedia = mediaToLoad.length;
    const progressBar = document.getElementById('loader-progress-bar');
    
    const triggerAnimations = () => {
      assetBoxes.forEach(box => animateObserver.observe(box));
    };

    const hideLoader = () => {
      pageLoader.classList.add('is-hidden');
      setTimeout(triggerAnimations, 100);
    };

    const updateProgress = () => {
      if (progressBar) {
        const percent = totalMedia > 0 ? (loadedCount / totalMedia) * 100 : 100;
        progressBar.style.width = `${percent}%`;
      }
    };

    if (totalMedia === 0) {
      updateProgress();
      setTimeout(hideLoader, 300);
    } else {
      let loaderDone = false;
      const checkAllLoaded = () => {
        if (loaderDone) return;
        loadedCount++;
        updateProgress();
        if (loadedCount >= totalMedia) {
          loaderDone = true;
          setTimeout(hideLoader, 400);
        }
      };

      mediaToLoad.forEach(media => {
        if (media.tagName.toLowerCase() === 'img') {
          if (media.complete) {
            checkAllLoaded();
          } else {
            media.addEventListener('load', checkAllLoaded);
            media.addEventListener('error', checkAllLoaded);
          }
        } else if (media.tagName.toLowerCase() === 'video') {
          if (media.readyState >= 3) {
            checkAllLoaded();
          } else {
            const handleVideoLoad = () => {
              checkAllLoaded();
              media.removeEventListener('canplay', handleVideoLoad);
            };
            media.addEventListener('canplay', handleVideoLoad);
            media.addEventListener('error', checkAllLoaded);
          }
        }
      });
      
      // Fallback timeout: 2.5 seconds max
      setTimeout(() => {
        if (!loaderDone) {
          loaderDone = true;
          hideLoader();
        }
      }, 2500);
    }
  }

  // Work Page Filters
  const filterBtns = document.querySelectorAll('.filter-btn');
  const assetBoxesFilters = document.querySelectorAll('.page-work .asset-box');
  if (filterBtns.length > 0 && assetBoxesFilters.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        const filterValue = e.target.getAttribute('data-filter');
        assetBoxesFilters.forEach(box => {
          // Reset transition delay so hiding/showing isn't staggered weirdly
          box.style.transitionDelay = '0s';
          if (filterValue === 'all' || box.getAttribute('data-category') === filterValue) {
            box.classList.remove('hidden');
          } else {
            box.classList.add('hidden');
          }
        });
      });
    });
  }

  // Brutalist Custom Cursor
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

    const interactables = document.querySelectorAll('a, button, .asset-box, input, textarea, .hover-trigger');
    interactables.forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
  }

  // Parallax Effect via Object Position
  const parallaxImages = document.querySelectorAll('.parallax-img');
  let ticking = false;
  
  function updateParallax() {
    parallaxImages.forEach(img => {
      const rect = img.getBoundingClientRect();
      if(rect.top < window.innerHeight && rect.bottom > 0) {
         const yPos = (rect.top - window.innerHeight/2) * 0.04;
         img.style.objectPosition = `50% calc(50% + ${yPos}px)`;
      }
    });
    ticking = false;
  }

  if(parallaxImages.length > 0) {
     updateParallax();
     window.addEventListener('scroll', () => {
       if (!ticking) {
         window.requestAnimationFrame(updateParallax);
         ticking = true;
       }
     }, { passive: true });
  }

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
      const data = Object.fromEntries(formData.entries());

      fetch(contactForm.action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(response => response.json())
      .then(data => {
        if (data.success || data.success === "true") {
          contactForm.reset();
          formMessages.innerHTML = 'Message sent successfully. I will get back to you soon.';
          formMessages.style.color = "var(--text-primary)";
        } else {
          formMessages.innerHTML = data.message || 'Oops! There was a problem submitting your form.';
          formMessages.style.color = "var(--accent-color)";
        }
      })
      .catch(error => {
        formMessages.innerHTML = 'Oops! There was a problem submitting your form.';
        formMessages.style.color = "var(--accent-color)";
      })
      .finally(() => {
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        setTimeout(() => {
          formMessages.innerHTML = '';
          formMessages.style.color = "";
        }, 5000);
      });
    });
  }
});