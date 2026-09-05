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

class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#________';
    this.update = this.update.bind(this);
  }
  setText(newText) {
    const oldText = this.el.innerText;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise((resolve) => this.resolve = resolve);
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 20);
      const end = start + Math.floor(Math.random() * 20);
      this.queue.push({ from, to, start, end });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }
  update() {
    let output = '';
    let complete = 0;
    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span class="scramble-char">${char}</span>`;
      } else {
        output += from;
      }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }
  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

const currentTheme = getSafeTheme();
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.setAttribute('data-theme', currentTheme);

document.addEventListener('DOMContentLoaded', () => {
  const themeBtn = document.getElementById('theme-toggle');
  
  if (document.body) {
    document.body.setAttribute('data-theme', currentTheme);
  }

  if (themeBtn) {
    themeBtn.setAttribute('aria-pressed', String(currentTheme === 'light'));
    themeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const existingTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = existingTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      if (document.body) {
        document.body.setAttribute('data-theme', newTheme);
      }
      themeBtn.setAttribute('aria-pressed', String(newTheme === 'light'));
      setSafeTheme(newTheme);
    });
  }

  const transitionEl = document.querySelector('.page-transition');
  if (transitionEl && !prefersReducedMotion) {
    setTimeout(() => {
      transitionEl.classList.add('is-loaded');
      
      const heroSection = document.querySelector('.hero');
      if (heroSection) {
        setTimeout(() => {
          heroSection.classList.add('hero-animated');
          
          setTimeout(() => {
            const typeContainer = document.getElementById('hero-typing-text');
            const cursor = document.getElementById('hero-cursor');
            if (typeContainer && cursor) {
              const textToType = typeContainer.getAttribute('data-text') || '';
              typeContainer.innerHTML = '';
              cursor.classList.add('is-typing');
              let i = 0;
              const typeWriter = () => {
                if (i < textToType.length) {
                  typeContainer.innerHTML += textToType.charAt(i);
                  i++;
                  setTimeout(typeWriter, 35);
                } else {
                  cursor.classList.remove('is-typing');
                  cursor.classList.add('blinking');
                  setTimeout(() => {
                    cursor.style.display = 'none';
                  }, 2400);
                }
              };
              typeWriter();
            }
          }, 1500); 
        }, 100);
      }
    }, 150);
  } else if (transitionEl) {
    transitionEl.classList.add('is-loaded');
    document.querySelector('.hero')?.classList.add('hero-animated');
    const typeContainer = document.getElementById('hero-typing-text');
    const cursor = document.getElementById('hero-cursor');
    if (typeContainer) {
      typeContainer.textContent = typeContainer.getAttribute('data-text') || '';
    }
    if (cursor) {
      cursor.style.display = 'none';
    }
  }

  const header = document.getElementById('main-header');
  const handleScroll = () => {
    if (!header) return;
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
          if (media.readyState >= 1) {
            checkAllLoaded();
          } else {
            const handleVideoLoad = () => {
              checkAllLoaded();
              media.removeEventListener('loadedmetadata', handleVideoLoad);
            };
            media.addEventListener('loadedmetadata', handleVideoLoad);
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
    filterBtns.forEach(btn => btn.setAttribute('aria-pressed', String(btn.classList.contains('active'))));
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        e.currentTarget.classList.add('active');
        e.currentTarget.setAttribute('aria-pressed', 'true');

        const filterValue = e.currentTarget.getAttribute('data-filter');
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

  // Preview motion only after deliberate hover or keyboard focus.
  const previewVideos = document.querySelectorAll('.asset-box video, .about-snippet video');
  previewVideos.forEach(video => {
    const trigger = video.closest('.asset-box') || video;
    const playPreview = () => {
      if (!prefersReducedMotion) {
        video.play().catch(() => {});
      }
    };
    const pausePreview = () => video.pause();
    trigger.addEventListener('pointerenter', playPreview);
    trigger.addEventListener('focusin', playPreview);
    trigger.addEventListener('pointerleave', pausePreview);
    trigger.addEventListener('focusout', pausePreview);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      previewVideos.forEach(video => video.pause());
    }
  });

  // Give project videos an intentional, lightweight preview before media loads.
  const projectVideos = document.querySelectorAll('.project-media video[controls]');
  projectVideos.forEach(video => {
    const stage = video.closest('.media-showcase-inner');
    if (!stage || stage.querySelector('.project-video-cover')) return;

    const rawTitle = document.querySelector('.project-hero .mega-title')?.innerText || 'Project video';
    const projectTitle = rawTitle.replace(/\s+/g, ' ').trim();

    stage.classList.add('project-video-stage', 'has-video-cover');
    video.classList.add('project-video-element');
    video.controls = false;
    video.tabIndex = -1;
    video.setAttribute('aria-hidden', 'true');

    const cover = document.createElement('button');
    cover.type = 'button';
    cover.className = 'project-video-cover';
    cover.setAttribute('aria-label', `Play ${projectTitle}`);
    cover.innerHTML = `
      <span class="video-cover-top">
        <span class="video-cover-kicker">[ PROJECT FILM ]</span>
        <span class="video-cover-status">READY TO PLAY</span>
      </span>
      <span class="video-cover-title"></span>
      <span class="video-cover-action">
        <span class="video-cover-play" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </span>
        <span class="video-cover-action-copy">
          <span class="video-cover-action-label">PLAY FILM</span>
          <span class="video-cover-hint">Loads on demand · Sound available</span>
        </span>
      </span>
    `;

    cover.querySelector('.video-cover-title').textContent = projectTitle;
    const actionLabel = cover.querySelector('.video-cover-action-label');
    const hint = cover.querySelector('.video-cover-hint');
    stage.appendChild(cover);

    const revealPlayer = () => {
      stage.classList.remove('is-loading', 'has-video-cover');
      stage.classList.add('is-playing');
      cover.classList.add('is-hidden');
      cover.setAttribute('aria-hidden', 'true');
      video.controls = true;
      video.removeAttribute('aria-hidden');
      video.removeAttribute('tabindex');
    };

    cover.addEventListener('click', () => {
      if (stage.classList.contains('is-loading')) return;

      stage.classList.add('is-loading');
      cover.setAttribute('aria-busy', 'true');
      actionLabel.textContent = 'LOADING FILM';
      hint.textContent = 'Preparing the player…';
      video.controls = true;
      video.removeAttribute('aria-hidden');

      if (video.readyState === 0) video.load();
      const playAttempt = video.play();
      if (playAttempt) {
        playAttempt.catch(() => {
          revealPlayer();
          video.focus({ preventScroll: true });
        });
      }
    });

    video.addEventListener('playing', revealPlayer, { once: true });
    video.addEventListener('error', () => {
      stage.classList.remove('is-loading');
      cover.removeAttribute('aria-busy');
      cover.disabled = false;
      actionLabel.textContent = 'TRY AGAIN';
      hint.textContent = 'The video could not load. Check your connection.';
    });
  });

  // Brutalist Custom Cursor
  const cursor = document.getElementById('custom-cursor');
  if (cursor && !prefersReducedMotion && window.matchMedia("(pointer: fine)").matches) {
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

    const interactables = document.querySelectorAll('a, button, .asset-box, input, select, textarea, .hover-trigger');
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

  if(parallaxImages.length > 0 && !prefersReducedMotion) {
     updateParallax();
     window.addEventListener('scroll', () => {
       if (!ticking) {
         window.requestAnimationFrame(updateParallax);
         ticking = true;
       }
     }, { passive: true });
  }

  // Text Scramble Setup
  if (!prefersReducedMotion) document.querySelectorAll('.asset-box').forEach(box => {
    const title = box.querySelector('.project-title');
    if (title) {
      const fx = new TextScramble(title);
      const originalText = title.innerText;
      let isScrambling = false;
      box.addEventListener('mouseenter', () => {
        if (!isScrambling) {
          isScrambling = true;
          fx.setText(originalText).then(() => { isScrambling = false; });
        }
      });
    }
  });

  if (!prefersReducedMotion) document.querySelectorAll('.interactive-list .list-item').forEach(item => {
    const title = item.querySelector('.list-title');
    if (title) {
      const fx = new TextScramble(title);
      const originalText = title.innerText;
      let isScrambling = false;
      item.addEventListener('mouseenter', () => {
        if (!isScrambling) {
          isScrambling = true;
          fx.setText(originalText).then(() => { isScrambling = false; });
        }
      });
    }
  });

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
  
  // Back to Top Button Logic
  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 500) {
        backToTop.classList.add('is-visible');
      } else {
        backToTop.classList.remove('is-visible');
      }
    }, { passive: true });

    backToTop.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    });
  }
});
