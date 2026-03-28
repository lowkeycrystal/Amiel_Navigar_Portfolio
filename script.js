document.addEventListener('DOMContentLoaded', () => {
  // 1. Theme Toggle Logic (High Contrast Light/Dark Mode)
  const themeBtn = document.getElementById('theme-toggle');
  const currentTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }

  // 2. Page Transition Logic (Harsh Wipe)
  const transitionEl = document.querySelector('.page-transition');
  if (transitionEl) {
    // Animate out on load
    setTimeout(() => {
      transitionEl.classList.add('is-loaded');
    }, 150);

    // Animate in on internal link click
    document.querySelectorAll('a').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const target = this.getAttribute('href');
        // Skip transition for external links, anchor links, or new tabs
        if (
          !target ||
          target.startsWith('#') ||
          target.startsWith('http') ||
          target.startsWith('blob:') ||
          target.startsWith('asset:') ||
          this.getAttribute('target') === '_blank' ||
          e.ctrlKey || e.metaKey
        ) return;

        e.preventDefault();
        transitionEl.classList.remove('is-loaded');
        transitionEl.classList.add('is-leaving');
        
        setTimeout(() => {
          window.location.href = target;
        }, 600); // Matches the CSS transition duration
      });
    });
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
});
