document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Navbar scroll effect ---
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // --- 2. Typing Animation in Hero ---
    const words = ["openclaw agents run", "agi-farm dispatch", "agi-farm dashboard", "agi-farm setup"];
    let i = 0;
    let timer;
    const typeTextSpan = document.querySelector('.type-text');

    // Check if element exists before animating
    if (typeTextSpan) {
        const typingEffect = () => {
            let word = words[i].split("");
            var loopTyping = function () {
                if (word.length > 0) {
                    typeTextSpan.innerHTML += word.shift();
                } else {
                    setTimeout(deletingEffect, 2000);
                    return false;
                }
                timer = setTimeout(loopTyping, 80);
            };
            loopTyping();
        }

        const deletingEffect = () => {
            let word = words[i].split("");
            var loopDeleting = function () {
                if (word.length > 0) {
                    word.pop();
                    typeTextSpan.innerHTML = word.join("");
                } else {
                    if (words.length > (i + 1)) {
                        i++;
                    } else {
                        i = 0;
                    }
                    setTimeout(typingEffect, 500);
                    return false;
                }
                timer = setTimeout(loopDeleting, 40);
            };
            loopDeleting();
        }

        setTimeout(typingEffect, 1500); // Start after initial load
    }

    // --- 3. 3D Tilt Effect for cards ---
    const tiltElements = document.querySelectorAll('.tilt-effect');

    tiltElements.forEach(el => {
        el.addEventListener('mousemove', handleTilt);
        el.addEventListener('mouseleave', resetTilt);
    });

    function handleTilt(e) {
        const el = this;
        // Get dimensions and center
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Mouse coordinates relative to center
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;

        // Calculate rotation (max 5 deg)
        const rotateX = ((mouseY / (rect.height / 2)) * -5).toFixed(2);
        const rotateY = ((mouseX / (rect.width / 2)) * 5).toFixed(2);

        el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        // If it's a card and has a heavy highlight class, maintain the scale
        if (el.classList.contains('highlight-card')) {
            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        }
    }

    function resetTilt() {
        if (this.classList.contains('highlight-card')) {
            this.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1.05, 1.05, 1.05)`;
        } else {
            this.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        }
    }

    // --- 4. Magnetic Buttons ---
    const magneticButtons = document.querySelectorAll('.btn-magnetic');

    magneticButtons.forEach(btn => {
        btn.addEventListener('mousemove', function (e) {
            const position = this.getBoundingClientRect();
            const x = e.pageX - position.left - position.width / 2;
            const y = e.pageY - position.top - position.height / 2;

            // Move the button slightly towards the cursor
            this.style.transform = `translate(${x * 0.3}px, ${y * 0.5}px)`;
        });

        btn.addEventListener('mouseout', function () {
            this.style.transform = `translate(0px, 0px)`;
        });
    });

    // --- 5. Scroll Reveal Animation ---
    const revealElements = document.querySelectorAll('.reveal');
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    };
    const revealObserver = new IntersectionObserver(revealCallback, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
    revealElements.forEach(el => revealObserver.observe(el));

    // --- 6. Smooth scrolling for internal anchor links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '#code-snip') return; // code snip is just for cta

            e.preventDefault();
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const navHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - navHeight;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
        });
    });

    // --- 7. Copy CTA Button ---
    const ctaCopyBtn = document.getElementById('ctaCopyBtn');
    if (ctaCopyBtn) {
        ctaCopyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const copyText = "npm install -g agi-farm && agi-farm setup";
            const iconSpan = ctaCopyBtn.querySelector('.copy-icon');

            navigator.clipboard.writeText(copyText).then(() => {
                const originalHtml = iconSpan.innerHTML;
                iconSpan.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                setTimeout(() => { iconSpan.innerHTML = originalHtml; }, 2000);
            });
        });
    }
});
