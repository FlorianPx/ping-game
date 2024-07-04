const canvas = document.querySelector<HTMLCanvasElement>(
  "#game-container"
) as HTMLCanvasElement;
const ctx = (canvas as HTMLCanvasElement).getContext(
  "2d"
) as CanvasRenderingContext2D;
const modal = document.querySelector("#modal") as HTMLElement;

if (canvas) {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}

class Store {
  animationId: number | null;
  bestScore: number;
  playerScore: number;
  canPlay: boolean;
  enemies: Enemy[];
  particles: Particle[];
  projectiles: Projectile[];

  constructor() {
    this.animationId = null;
    this.bestScore = 0;
    this.playerScore = 0;
    this.canPlay = false;
    this.enemies = [];
    this.particles = [];
    this.projectiles = [];
  }
}

class Entity {
  x: number;
  y: number;
  radius: number;
  color: string;

  constructor(x: X, y: Y, radius: RadiusType) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = "red";
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

class Player extends Entity {
  constructor(x: X, y: Y, radius: RadiusType, color: ColorType) {
    super(x, y, radius);
    this.color = color;
  }
}

class Projectile extends Player {
  velocity: VelocityType;

  constructor(
    x: X,
    y: Y,
    radius: RadiusType,
    color: ColorType,
    velocity: VelocityType
  ) {
    super(x, y, radius, color);
    this.velocity = velocity;
  }

  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

class Enemy extends Projectile {
  constructor(
    x: X,
    y: Y,
    radius: RadiusType,
    color: ColorType,
    velocity: VelocityType
  ) {
    super(x, y, radius, color, velocity);
  }
}

class Particle extends Enemy {
  alpha: number;

  constructor(
    x: X,
    y: Y,
    radius: RadiusType,
    color: ColorType,
    velocity: VelocityType
  ) {
    super(x, y, radius, color, velocity);
    this.alpha = 1;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }

  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
    this.alpha -= 0.01;
  }
}

let player = new Player(canvas.width / 2, canvas.height / 2, 10, "red");
const store = new Store();
const data = window.localStorage.getItem("ping_game_player") as string;
const playerData = JSON.parse(data) as PlayerDataType;

const newPlayerModal = `<p>Bienvenue sur Ping Game !</p>
<p>Essaie d'exploser un max de bulles avant qu'elles ne te touchent</p>
<button id="start-button">Jouer</button>`;

const alreadyPlayedModal = (
  props: PlayerDataType
) => `<p>Bienvenue sur Ping Game !</p>
<p>Essaie de battre ton meilleur score : ${props.bestScore} points</p>
<button id="start-button">Jouer</button>`;

const lostGameModal = (props: PlayerDataType) => `
<p>Partie terminée !</p>
<p>Ton score actuel est de ${props.score} points !</p>
<p>Ton meilleur score : ${props.bestScore} points</p>
<p>Veux-tu réessayer ?</p>
<button id="restart-button">Rejouer</button>`;

function init() {
  store.animationId = null;
  store.playerScore = 0;
  store.canPlay = false;
  store.enemies = [];
  store.particles = [];
  store.projectiles = [];
}

function addPlayer() {
  ctx.fillStyle = "rgba(0, 0, 0, 1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  player.draw();
}

function spawnEnemies() {
  setInterval(() => {
    const radius = Math.random() * (30 - 4) + 4;

    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    const color = `rgb(${r}, ${g}, ${b})`;

    const randomValue = Math.random();
    let x, y;
    if (randomValue < 0.25) {
      x = 0 - radius;
      y = Math.random() * canvas.height;
    } else if (randomValue >= 0.25 && randomValue < 0.5) {
      x = canvas.width + radius;
      y = Math.random() * canvas.height;
    } else if (randomValue >= 0.5 && randomValue < 0.75) {
      x = Math.random() * canvas.width;
      y = 0 - radius;
    } else {
      x = Math.random() * canvas.width;
      y = canvas.height + radius;
    }

    const angle = Math.atan2(player.y - y, player.x - x);
    const velocity = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };

    store.enemies.push(new Enemy(x, y, radius, color, velocity));
  }, 1000);
}

function gameOver() {
  cancelAnimationFrame(store.animationId as number);
  store.canPlay = false;

  addModal(
    lostGameModal({
      score: store.playerScore,
      bestScore: playerData.bestScore,
      level: 0,
    })
  );

  window.localStorage.setItem(
    "ping_game_player",
    JSON.stringify({
      bestScore:
        playerData.bestScore > store.playerScore
          ? playerData.bestScore
          : store.playerScore,
      score: store.playerScore,
      level: 0,
    })
  );

  // if (playerData.bestScore < store.playerScore) {
  //   //modal congratulations !
  // }
}

function animate() {
  store.animationId = requestAnimationFrame(animate);
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  player.draw();

  store.particles.forEach((particle, index) => {
    if (particle.alpha <= 0) {
      store.particles.splice(index, 1);
    } else {
      particle.update();
    }
  });

  store.projectiles.forEach((projectile, index) => {
    if (
      projectile.x - projectile.radius < 0 ||
      projectile.x + projectile.radius > canvas.width ||
      projectile.y - projectile.radius < 0 ||
      projectile.y + projectile.radius > canvas.height
    ) {
      store.projectiles.splice(index, 1);
    }
    projectile.update();
  });

  store.enemies.forEach((enemy, enemyIndex) => {
    store.projectiles.forEach((projectile, projectileIndex) => {
      const distance = Math.hypot(
        projectile.x - enemy.x,
        projectile.y - enemy.y
      );

      if (distance - projectile.radius - enemy.radius <= 0) {
        for (let i = 0; i < 8; i++) {
          store.particles.push(
            new Particle(
              projectile.x,
              projectile.y,
              Math.random() * (3 - 1) + 1,
              enemy.color,
              {
                x: (Math.random() - 0.5) * 3,
                y: (Math.random() - 0.5) * 3,
              }
            )
          );
        }

        if (enemy.radius - 10 > 5) {
          store.playerScore += 100;
          // @ts-ignore
          gsap.to(enemy, {
            radius: enemy.radius - 10,
          });
          setTimeout(() => {
            store.projectiles.splice(projectileIndex, 1);
          }, 0);
        } else {
          store.playerScore += 250;
          setTimeout(() => {
            store.enemies.splice(enemyIndex, 1);
            store.projectiles.splice(projectileIndex, 1);
          }, 0);
        }
      }
    });

    const distPlayerEnemy = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    if (distPlayerEnemy - enemy.radius - player.radius <= 0) {
      gameOver();
    }
    enemy.update();
  });
}

function drawProjectiles(event: MouseEvent) {
  const angle = Math.atan2(event.clientY - player.y, event.clientX - player.x);
  const velocity = {
    x: Math.cos(angle) * 5,
    y: Math.sin(angle) * 5,
  };

  const projectile = new Projectile(player.x, player.y, 5, "white", velocity);
  store.projectiles.push(projectile);
}

function addModal(bodyModal: string) {
  modal.style.cssText =
    "display: flex; flex-direction: column; justify-content: center; align-items: center; width: 50%; height: fit-content; background-color: white; position: absolute; inset: 0; margin: auto; padding: 10px; border-radius: 1rem";
  modal.innerHTML = bodyModal;
  document.body.insertBefore(modal, canvas);
}

function closeModal() {
  if (modal.parentNode) modal.parentNode.removeChild(modal);
  addPlayer();
  animate();
  spawnEnemies();
}

if (!playerData || playerData?.bestScore === 0) {
  addModal(newPlayerModal);
  window.localStorage.setItem(
    "ping_game_player",
    JSON.stringify({
      bestScore: 0,
      score: 0,
      level: 0,
    })
  );
} else {
  addModal(alreadyPlayedModal(playerData));
}

const startButton = document?.querySelector("#start-button") as HTMLElement;

startButton.addEventListener("click", () => {
  closeModal();
  store.canPlay = true;
  animate();
  spawnEnemies();
});

document.addEventListener("click", () => {
  const restartButton = document?.querySelector(
    "#restart-button"
  ) as HTMLElement;

  if (!restartButton) return;
  restartButton.addEventListener("click", () => {
    init();
    closeModal();
    animate();
    spawnEnemies();
  });
});

canvas.addEventListener("click", (event) => drawProjectiles(event));
