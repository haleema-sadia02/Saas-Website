/* =========================================================
   NEXORA — Main JavaScript
   Handles: Navbar scroll, Mobile menu, Scroll animations,
            Card tilt effect, Active link highlight
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* =======================================================
     1. NAVBAR — Scroll pe blur + shrink
     ======================================================= */
  const navbar = document.getElementById('navbar');

  const handleNavScroll = () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleNavScroll);
  handleNavScroll(); // page load pe bhi check karo


  /* =======================================================
     2. MOBILE MENU — Toggle
     ======================================================= */
  const menuToggle = document.getElementById('menuToggle');
  const navLinks   = document.getElementById('navLinks');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('open');
      navLinks.classList.toggle('open');
      // Body scroll lock jab menu khula ho
      document.body.style.overflow = navLinks.classList.contains('open')
        ? 'hidden'
        : '';
    });

    // Menu link click pe menu close karo
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('open');
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }


  /* =======================================================
     3. SCROLL ANIMATIONS — GSAP ScrollTrigger
     ======================================================= */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {

    gsap.registerPlugin(ScrollTrigger);

    // Har [data-animate] element ke liye fade-up animation
    const animatedEls = document.querySelectorAll('[data-animate]');

    animatedEls.forEach((el) => {
      const delay = parseFloat(el.dataset.delay || 0);

      gsap.fromTo(
        el,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          delay: delay,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
          onStart: () => el.classList.add('in-view'),
        }
      );
    });

    // Hero visual ko halka sa parallax do
    const heroVisual = document.querySelector('.hero-visual');
    if (heroVisual) {
      gsap.to(heroVisual, {
        y: 60,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });
    }

  } else {
    // Fallback: agar GSAP load na ho, toh simple CSS fade
    const animatedEls = document.querySelectorAll('[data-animate]');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    animatedEls.forEach(el => io.observe(el));
  }


  /* =======================================================
     4. 3D TILT EFFECT — Mouse move pe card tilt
     ======================================================= */
  const tiltCards = document.querySelectorAll('[data-tilt]');

  tiltCards.forEach(card => {
    const maxTilt = 10; // degrees

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -maxTilt;
      const rotateY = ((x - centerX) / centerX) *  maxTilt;

      card.style.transform =
        `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform =
        'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    });
  });


  /* =======================================================
     5. ACTIVE NAV LINK — Current page highlight
     ======================================================= */
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const allNavLinks = document.querySelectorAll('.nav-links a');

  allNavLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });


  /* =======================================================
     6. SMOOTH SCROLL — Internal anchor links ke liye
     ======================================================= */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId.length > 1) {
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
    /* =======================================================
     7. CONTACT FORM — Validation + Submit
     ======================================================= */
  const contactForm = document.getElementById('contactForm');
  const formStatus  = document.getElementById('formStatus');
  const submitBtn   = document.getElementById('submitBtn');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Basic validation
      const name    = contactForm.name.value.trim();
      const email   = contactForm.email.value.trim();
      const subject = contactForm.subject.value;
      const message = contactForm.message.value.trim();

      if (!name || !email || !subject || !message) {
        formStatus.textContent = '⚠️ Please fill in all required fields.';
        formStatus.className = 'form-status error';
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        formStatus.textContent = '⚠️ Please enter a valid email address.';
        formStatus.className = 'form-status error';
        return;
      }

      // Loading state
      submitBtn.disabled = true;
      submitBtn.querySelector('.btn-text').textContent = 'Sending…';
      formStatus.textContent = '';
      formStatus.className = 'form-status';

      // --- Simulated submit (demo) ---
      // Real project mein yahan EmailJS / Formspree / backend API call karo
      try {
        await new Promise(resolve => setTimeout(resolve, 1200));

        formStatus.textContent = '✅ Thanks! We\'ll get back to you within 24 hours.';
        formStatus.className = 'form-status success';
        contactForm.reset();
      } catch (err) {
        formStatus.textContent = '❌ Something went wrong. Please try again.';
        formStatus.className = 'form-status error';
      } finally {
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').textContent = 'Send Message';
      }
    });
  }
    /* =======================================================
     8. 3D LAPTOP MOCKUP — Mouse move pe rotate (home page)
     ======================================================= */
  const laptop = document.getElementById('laptop3d');

  if (laptop) {
    const stage = laptop.closest('.mockup-stage');

    stage.addEventListener('mousemove', (e) => {
      const rect = stage.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateY = ((x - centerX) / centerX) * 18; // left-right
      const rotateX = ((y - centerY) / centerY) * -12; // up-down

      laptop.style.transform =
        `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });

    stage.addEventListener('mouseleave', () => {
      laptop.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
    });
  }

});