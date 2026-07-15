/* src/lib/FlagConfetti.ts */

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  fadeOutSpeed: number;
}

const FLAG_COLORS = [
  "#74ACDF", // Celeste (Argentine Sky Blue)
  "#FFFFFF", // Blanco
  "#FFB81C", // Dorado Sol de Mayo
];

export function fireConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Set canvas dimensions
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles: Particle[] = [];
  const particleCount = 120;

  // Create particles originating from the bottom left and bottom right corners
  for (let i = 0; i < particleCount; i++) {
    const fromLeft = Math.random() > 0.5;
    const x = fromLeft ? 0 : canvas.width;
    const y = canvas.height * 0.8; // launch from lower part

    // Angle towards the center-top
    const angle = fromLeft
      ? (Math.random() * 45 - 60) * (Math.PI / 180)  // -60 to -15 degrees
      : (Math.random() * 45 - 165) * (Math.PI / 180); // -165 to -120 degrees

    const speed = Math.random() * 15 + 12;

    particles.push({
      x,
      y,
      size: Math.random() * 8 + 6,
      color: FLAG_COLORS[Math.floor(Math.random() * FLAG_COLORS.length)],
      speedX: Math.cos(angle) * speed,
      speedY: Math.sin(angle) * speed,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() * 6 - 3) * 2,
      opacity: 1,
      fadeOutSpeed: Math.random() * 0.005 + 0.005,
    });
  }

  let animationFrameId: number;

  function update() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let activeParticles = 0;

    particles.forEach((p) => {
      if (p.opacity <= 0) return;

      activeParticles++;

      // Apply physics: gravity and wind/air resistance
      p.x += p.speedX;
      p.y += p.speedY;
      p.speedY += 0.35; // gravity
      p.speedX *= 0.98; // friction
      p.rotation += p.rotationSpeed;

      // Slow fadeout when falling
      if (p.speedY > 0) {
        p.opacity -= p.fadeOutSpeed;
      }

      // Draw particle
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      
      // Draw rectangular confetti piece
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
      
      ctx.restore();
    });

    if (activeParticles > 0) {
      animationFrameId = requestAnimationFrame(update);
    }
  }

  update();

  // Handle window resizing
  const handleResize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener("resize", handleResize);

  return () => {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener("resize", handleResize);
  };
}
