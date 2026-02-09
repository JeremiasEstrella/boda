// Main Logic for Wedding Invitation

document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    initCountdown();
    initThreeJS();
    initWeather();
    // Prepare hidden states early, but triggers will be refreshed when opened
    initHiddenStates(); 
});

// 1. Loading Screen
function initLoader() {
    const pctLabel = document.getElementById('loader-pct');
    const progBar = document.getElementById('loader-prog');
    
    // Find all images to pre-load
    const images = Array.from(document.querySelectorAll('img'));
    let loadedCount = 0;
    const totalImages = images.length || 1;

    function updateProgress() {
        loadedCount++;
        const progress = Math.min(Math.round((loadedCount / totalImages) * 100), 100);
        pctLabel.innerText = `${progress}%`;
        progBar.style.width = `${progress}%`;
        
        if (loadedCount >= totalImages) {
            setTimeout(() => {
                gsap.to('#loading-screen', { 
                    opacity: 0, 
                    duration: 1, 
                    onComplete: () => {
                        document.getElementById('loading-screen').style.display = 'none';
                        const mainContent = document.getElementById('main-content');
                        mainContent.style.display = 'block';
                        
                        // Small timeout to let the browser paint the display:block before GSAP triggers
                        setTimeout(() => {
                            ScrollTrigger.refresh();
                        }, 50);
                    }
                });
            }, 800);
        }
    }

    if (images.length === 0) {
        // Fallback if no images found
        let p = 0;
        const fallback = setInterval(() => {
            p += 10;
            pctLabel.innerText = `${p}%`;
            progBar.style.width = `${p}%`;
            if (p >= 100) {
                clearInterval(fallback);
                updateProgress();
            }
        }, 100);
    } else {
        images.forEach(img => {
            if (img.complete) {
                updateProgress();
            } else {
                img.addEventListener('load', updateProgress);
                img.addEventListener('error', updateProgress);
            }
        });
    }
}

// 2. Open Invitation (Vintage Envelope)
function openInvitation() {
    const wrapper = document.getElementById('envelope-wrapper');
    const envelope = document.getElementById('vintage-envelope');
    
    // Stage 1: Reveal top flap and break seal
    wrapper.classList.add('open');
    
    // Stage 2: Slide letter up and fade envelope
    setTimeout(() => {
        gsap.to('#vintage-envelope', { 
            y: 50, 
            opacity: 0, 
            duration: 1,
            ease: "power2.inOut" 
        });
        
        gsap.to('#envelope-wrapper', {
            opacity: 0,
            duration: 1.5,
            delay: 0.5,
            onComplete: () => {
                document.getElementById('envelope-wrapper').style.display = 'none';
                const mainContent = document.getElementById('main-content');
                mainContent.style.display = 'block';

                // Play music automatically once invitation is opened
                const music = document.getElementById('bg-music');
                const musicBtn = document.getElementById('music-toggle');
                const playerContainer = document.getElementById('spotify-player');
                
                music.play().then(() => {
                    isPlaying = true;
                    musicBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    playerContainer.classList.add('playing');
                }).catch(e => {
                    console.log("Autoplay prevented by browser: ", e);
                    // Optional: Show a "Play" hint if blocked
                });
                
                // Initialize ALL scroll animations now that content is visible
                initScrollAnimations();
                
                // Final refresh to ensure all triggers calculate correct positions
                setTimeout(() => {
                    ScrollTrigger.refresh();
                }, 100);
            }
        });
    }, 1500);
}

// 3. Countdown Timer
function initCountdown() {
    // Target Date: 15 de Octubre 2026
    const weddingDate = new Date('2026-10-15T17:00:00');

    function updateTimer() {
        const now = new Date().getTime();
        const diff = weddingDate - now;

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('days').innerText = d.toString().padStart(2, '0');
        document.getElementById('hours').innerText = h.toString().padStart(2, '0');
        document.getElementById('minutes').innerText = m.toString().padStart(2, '0');
        document.getElementById('seconds').innerText = s.toString().padStart(2, '0');
    }

    setInterval(updateTimer, 1000);
    updateTimer();
}

// 4. 3D Autumn Leaves Background (Three.js)
function initThreeJS() {
    const canvas = document.getElementById('sparkle-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Leaf Geometry (Simple diamond/leaf shape)
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0.1);
    leafShape.quadraticCurveTo(0.1, 0, 0, -0.1);
    leafShape.quadraticCurveTo(-0.1, 0, 0, 0.1);
    const geometry = new THREE.ShapeGeometry(leafShape);

    const leaves = [];
    const leafCount = 80;
    const material = new THREE.MeshBasicMaterial({
        color: '#925E33', // Russet
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
    });

    for (let i = 0; i < leafCount; i++) {
        const leaf = new THREE.Mesh(geometry, material);
        
        // Random starting positions
        leaf.position.set(
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 10
        );

        // Random scales
        const scale = Math.random() * 0.5 + 0.2;
        leaf.scale.set(scale, scale, scale);

        // Random rotation speed and sway
        leaf.userData = {
            rotationSpeed: {
                x: Math.random() * 0.02,
                y: Math.random() * 0.02,
                z: Math.random() * 0.02
            },
            fallSpeed: Math.random() * 0.01 + 0.005,
            swaySpeed: Math.random() * 0.02,
            swayOffset: Math.random() * Math.PI * 2
        };

        scene.add(leaf);
        leaves.push(leaf);
    }

    function animate() {
        requestAnimationFrame(animate);

        leaves.forEach(leaf => {
            // Falling logic
            leaf.position.y -= leaf.userData.fallSpeed;
            
            // Swaying logic (horizontal)
            leaf.position.x += Math.sin(Date.now() * 0.001 * leaf.userData.swaySpeed + leaf.userData.swayOffset) * 0.005;

            // Rotation logic
            leaf.rotation.x += leaf.userData.rotationSpeed.x;
            leaf.rotation.y += leaf.userData.rotationSpeed.y;
            leaf.rotation.z += leaf.userData.rotationSpeed.z;

            // Reset position if it goes off screen (bottom)
            if (leaf.position.y < -8) {
                leaf.position.y = 8;
                leaf.position.x = (Math.random() - 0.5) * 15;
            }
        });

        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// 5. Gallery Interaction & Auto-Slideshow
let galleryInterval;
const galleryImages = [
    'imagenes/cj1.jpeg',
    'imagenes/cj2.jpeg',
    'imagenes/cj3.jpeg',
    'imagenes/cj4.jpeg'
];
let currentGalleryIndex = 0;

function updateGallery(index) {
    const imgSrc = galleryImages[index];
    const mainImg = document.getElementById('main-gallery-img');
    const thumbs = document.querySelectorAll('.thumb-card');
    
    // Fade out
    mainImg.style.opacity = '0.5';
    
    setTimeout(() => {
        mainImg.src = imgSrc;
        mainImg.style.opacity = '1';
        
        // Update active class
        thumbs.forEach((t, i) => {
            if (i === index) t.classList.add('active');
            else t.classList.remove('active');
        });
        currentGalleryIndex = index;
    }, 200);
}

function startGalleryAutoPlay() {
    galleryInterval = setInterval(() => {
        let nextIndex = (currentGalleryIndex + 1) % galleryImages.length;
        updateGallery(nextIndex);
    }, 3000);
}

function manualGalleryUpdate(imgSrc, index) {
    clearInterval(galleryInterval);
    updateGallery(index);
    startGalleryAutoPlay(); // Restart timer after manual change
}

// Initialize gallery auto-play
startGalleryAutoPlay();

// 6. Scroll Animations (GSAP)
function initHiddenStates() {
    gsap.registerPlugin(ScrollTrigger);
    
    const hiddenElements = [
        '.welcome-hero img', '.hero-top-details', '.titulocountdown', '.countdown', '.wedding-date',
        '.section-title', '#mensaje p', '.flower-corner',
        '.parent-frame-container', '.parent-name', '.parent-tag',
        '.godparent-circle', '#lugar div', '.map-container',
        '#vestimenta p', '#regalos p', '#regalos div',
        '.weather-card', '.itinerary-item', '#confirmacion a', '#confirmacion p',
        '.modern-gallery', '.qr-frame', '.qr-instruction', '.timeline-line'
    ];

    gsap.set(hiddenElements, { opacity: 0, y: 30 });
    gsap.set('.timeline-line', { scaleY: 0, transformOrigin: "top" });

    // Initial states for decorative flowers (Entrance preparation)
    gsap.set('.img-mensajeflores', { opacity: 0, x: -50, y: -50 }); // Top-Left
    gsap.set('.florizq', { opacity: 0, x: -50, y: 50 }); // Bottom-Left
    gsap.set('.florder', { opacity: 0, x: 50, y: 50 }); // Bottom-Right

    // New Flowers (Vestimenta & Regalos)
    gsap.set('.flower-vestimenta-tl, .flower-regalos-tl', { opacity: 0, x: -50, y: -50 });
    gsap.set('.flower-vestimenta-bl, .flower-regalos-bl', { opacity: 0, x: -50, y: 50 });
    gsap.set('.flower-vestimenta-br, .flower-regalos-br', { opacity: 0, x: 50, y: 50 });
    
    // Dresscode Icon
    gsap.set('.img-dresscode', { opacity: 0, scale: 0.8 });

    // Wishes Flowers
    gsap.set('.flower-deseos-l', { opacity: 0, x: -50, rotate: 0 });
    gsap.set('.flower-deseos-r', { opacity: 0, x: 50, rotate: 0 });

    // Wishes Swiper
    gsap.set('.wishes-swiper', { opacity: 0, y: 30 });
}

function initScrollAnimations() {
    // Initialize Wishes Carousel
    new Swiper('.wishes-swiper', {
        slidesPerView: 1,
        spaceBetween: 20,
        centeredSlides: true,
        loop: true,
        autoplay: {
            delay: 3000,
            disableOnInteraction: false,
        },
        pagination: false, /* No navigation dots */
        navigation: false, /* No arrows */
        breakpoints: {
            640: {
                slidesPerView: 2,
                spaceBetween: 30,
                centeredSlides: false,
            },
            1024: {
                slidesPerView: 3,
                spaceBetween: 40,
            },
        }
    });
    // 1. Hero Reveal (Top Section)
    const heroTl = gsap.timeline({
        scrollTrigger: {
            trigger: '.welcome-hero',
            start: 'top 80%',
            toggleActions: "play none none none"
        }
    });

    heroTl.to('.welcome-hero img', { opacity: 1, y: 0, duration: 1.5, ease: "power2.out" })
          .to('.hero-top-details', { opacity: 1, y: 0, duration: 0.8 }, "-=1")
          .to('.titulocountdown', { opacity: 1, y: 0, duration: 0.8 }, "-=0.6")
          .to('.countdown', { opacity: 1, y: 0, duration: 1, ease: "back.out(1.7)" }, "-=0.4")
          .to('.wedding-date', { opacity: 1, y: 0, duration: 0.8 }, "-=0.6");

    // 2. Special Message Sections
    gsap.to('#mensaje p, .section-title', {
        opacity: 1,
        y: 0,
        duration: 1.2,
        stagger: 0.3,
        scrollTrigger: {
            trigger: '#mensaje',
            start: 'top 85%'
        }
    });

    // 3. Favorite People / Parents (Staggered)
    gsap.to('.parent-frame-container', {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: {
            trigger: '#familia',
            start: 'top 75%'
        }
    });

    gsap.to('.parent-name, .parent-tag', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
        scrollTrigger: {
            trigger: '#familia',
            start: 'top 70%'
        }
    });

    // 4. Godparents (Circular entry)
    gsap.to('.godparent-circle', {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1,
        stagger: 0.15,
        ease: "back.out(1.2)",
        scrollTrigger: {
            trigger: '#padrinos',
            start: 'top 80%'
        }
    });

    // 5. General Items (Weather, Itinerary, etc.)
    const otherElements = [
        { sel: '.weather-card', trigger: '#clima' },
        { sel: '#lugar div, .map-container', trigger: '#lugar' },
        { sel: '#vestimenta p', trigger: '#vestimenta' },
        { sel: '.img-dresscode', trigger: '#vestimenta' }, /* Add dresscode image explicitly or as separate tween */
        { sel: '#regalos p, #regalos div, #regalos h3, .gift-registry-container', trigger: '#regalos' },
        { sel: '#itinerario .itinerary-item', trigger: '#itinerario' },
        { sel: '#confirmacion a, #confirmacion p', trigger: '#confirmacion' },
        { sel: '.modern-gallery', trigger: '#galeria' },
        { sel: '.qr-frame, .qr-instruction', trigger: '#qr-upload' },
        { sel: '.wishes-swiper', trigger: '#deseos' } 
    ];

    otherElements.forEach(group => {
        gsap.to(group.sel, {
            opacity: 1,
            y: 0,
            x: 0, // Reset any horizontal displacement
            duration: 1.2,
            stagger: 0.2,
            ease: "power2.out",
            scrollTrigger: {
                trigger: group.trigger,
                start: 'top 88%'
            }
        });
    });

    // 6. Decorative Flowers Entrance
    const flowers = [
        '.img-mensajeflores', '.florizq', '.florder',
        '.flower-vestimenta-tl', '.flower-vestimenta-bl', '.flower-vestimenta-br',
        '.flower-regalos-tl', '.flower-regalos-bl', '.flower-regalos-br',
        '.flower-deseos-l', '.flower-deseos-r'
    ];
    flowers.forEach(selector => {
        gsap.utils.toArray(selector).forEach(flower => {
            gsap.to(flower, {
                opacity: 1,
                x: 0,
                y: 0,
                duration: 1.5,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: flower.parentElement, // Trigger when parent (section/card) is visible
                    start: "top 85%"
                }
            });
        });
    });

    // 7. 3D Sparkle Canvas Follow
    gsap.to('#sparkle-canvas', {
        opacity: 0.9,
        scrollTrigger: {
            trigger: 'body',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1
        }
    });

    // 7. Itinerary Timeline Special Animations
    gsap.to(".timeline-line", {
        scaleY: 1,
        opacity: 1,
        ease: "none",
        scrollTrigger: {
            trigger: "#itinerario .itinerary-timeline",
            start: "top 70%",
            end: "bottom 70%",
            scrub: 1
        }
    });
}


const musicBtn = document.getElementById('music-toggle');
const music = document.getElementById('bg-music');
const playerContainer = document.getElementById('spotify-player');
let isPlaying = false;

musicBtn.addEventListener('click', () => {
    if (isPlaying) {
        music.pause();
        musicBtn.innerHTML = '<i class="fas fa-play"></i>';
        playerContainer.classList.remove('playing');
    } else {
        music.play();
        musicBtn.innerHTML = '<i class="fas fa-pause"></i>';
        playerContainer.classList.add('playing');
    }
    isPlaying = !isPlaying;
});

// 8. Weather Simulation
function initWeather() {
    // Forecast scroll logic
    const container = document.getElementById('forecast-items');
    window.scrollForecast = (direction) => {
        const scrollAmount = 100;
        container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    };
}
