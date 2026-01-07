// ============================================
// OYUN DEĞİŞKENLERİ
// ============================================

// Canvas ve context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas boyutunu ayarla (sayfa yüklendiğinde)
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();

// Oyun durumu
let gameState = 'doorSelection'; // doorSelection, playing, paused, victory, defeat
let currentLevel = 1;
let selectedDoor = null;
let isPaused = false;

// Oyuncu özellikleri
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 40,
    height: 40,
    speed: 3,
    baseSpeed: 3, // Temel hız (sersemleme sonrası dönüş için)
    health: 100,
    maxHealth: 100,
    damage: 10,
    attackSpeed: 1000,
    lastAttack: 0,
    stunned: false,
    stunnedUntil: 0,
    color: '#4ade80'
};

// Boss özellikleri
const boss = {
    x: 0,
    y: 0,
    width: 80,
    height: 80,
    health: 100,
    maxHealth: 100,
    speed: 2,
    color: '#ef4444',
    direction: 0, // Açı (radyan)
    lastSkill: 0,
    skillCooldown: 3000,
    isAttacking: false,
    attackType: null,
    attackTimer: 0
};

// Projeler (taşlar)
const projectiles = [];

// Taş dağları
const rockWalls = [];

// Harita arka planı
let mapType = 'orman';

// Klavye durumu
const keys = {};

// ============================================
// OYUN BAŞLATMA
// ============================================

    // Sayfa yüklendiğinde
window.addEventListener('DOMContentLoaded', function() {
    // Seçilen özellikleri yükle
    loadPlayerStats();
    loadMapType();
    
    // Kapı seçim ekranını göster
    document.getElementById('door-selection').style.display = 'block';
    
    // Oyun döngüsünü başlat
    gameLoop();
});

// Canvas boyutunu pencere değiştiğinde güncelle
window.addEventListener('resize', function() {
    resizeCanvas();
    if (gameState === 'playing') {
        player.x = Math.min(player.x, canvas.width - player.width);
        player.y = Math.min(player.y, canvas.height - player.height);
    }
});

// ============================================
// OYUNCU İSTATİSTİKLERİNİ YÜKLEME
// ============================================

function loadPlayerStats() {
    // Karakter özelliklerini yükle (dengelenmiş hızlar)
    const character = localStorage.getItem('selectedCharacter');
    if (character === 'kadın') {
        player.speed = 4.5; // Zayıf ama hızlı (dengelenmiş)
        player.maxHealth = 80;
    } else if (character === 'kaslı') {
        player.speed = 3.5; // Dengelenmiş
        player.maxHealth = 120;
        player.damage = 12;
    } else if (character === 'normal') {
        player.speed = 4; // Dengelenmiş
        player.maxHealth = 100;
    }
    player.baseSpeed = player.speed; // Temel hızı sakla
    player.health = player.maxHealth;

    // Zırh özelliklerini yükle
    const armor = localStorage.getItem('selectedArmor');
    if (armor === 'hafif') {
        player.speed *= 1.25; // %25 hız artışı (azaltıldı)
        player.maxHealth = Math.floor(player.maxHealth * 0.9);
    } else if (armor === 'orta') {
        // Değişiklik yok
    } else if (armor === 'ağır') {
        player.speed *= 0.75; // %25 hız azalışı (azaltıldı)
        player.maxHealth = Math.floor(player.maxHealth * 1.3);
    }
    player.baseSpeed = player.speed; // Güncellenmiş temel hızı sakla
    player.health = player.maxHealth;

    // Silah özelliklerini yükle
    const weapon = localStorage.getItem('selectedWeapon');
    if (weapon === 'hızlı') {
        player.damage = 8;
        player.attackSpeed = 500; // Hızlı vuruş
    } else if (weapon === 'orta') {
        player.damage = 12;
        player.attackSpeed = 1000;
    } else if (weapon === 'ortaüst') {
        player.damage = 18;
        player.attackSpeed = 1000;
    } else if (weapon === 'ağır') {
        player.damage = 25;
        player.attackSpeed = 2000; // Yavaş vuruş
    }

    // UI'ı güncelle
    updateUI();
}

// Harita tipini yükle
function loadMapType() {
    mapType = localStorage.getItem('selectedMap') || 'orman';
    
    // Canvas arka planını ayarla
    if (mapType === 'orman') {
        canvas.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
    } else if (mapType === 'çöl') {
        canvas.style.background = 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)';
    }
}

// ============================================
// KAPI SEÇİMİ
// ============================================

function selectDoor(doorNumber) {
    selectedDoor = doorNumber;
    document.getElementById('door-selection').style.display = 'none';
    
    // Boss istatistiklerini random olarak ayarla
    initializeBoss();
    
    // Oyunu başlat
    gameState = 'playing';
    startBattle();
}

// Boss'u başlat
function initializeBoss() {
    // Kapıya göre random güç
    const randomMultiplier = 0.7 + Math.random() * 0.8; // 0.7 - 1.5 arası
    const levelMultiplier = 1 + (currentLevel - 1) * 0.5; // Bölüm artışı
    
    boss.maxHealth = Math.floor(100 * randomMultiplier * levelMultiplier);
    boss.health = boss.maxHealth;
    boss.speed = 2 * randomMultiplier;
    
    // Boss pozisyonunu ayarla
    boss.x = canvas.width / 2;
    boss.y = canvas.height / 4;
    
    // Oyuncu pozisyonunu ayarla
    player.x = canvas.width / 2;
    player.y = canvas.height * 0.75;
    
    // Projeleri temizle
    projectiles.length = 0;
    rockWalls.length = 0;
    
    // Boss UI'ını göster
    document.getElementById('boss-stats').style.display = 'block';
    updateUI();
}

// ============================================
// KLAVYE KONTROLLERİ
// ============================================

document.addEventListener('keydown', function(e) {
    keys[e.key.toLowerCase()] = true;
    
    // ESC tuşu ile duraklatma
    if (e.key === 'Escape' && gameState === 'playing') {
        togglePause();
    }
    
    // Space tuşu ile saldırı
    if (e.key === ' ' && gameState === 'playing' && !isPaused) {
        e.preventDefault();
        attackBoss();
    }
});

document.addEventListener('keyup', function(e) {
    keys[e.key.toLowerCase()] = false;
});

// ============================================
// OYUNCU HAREKETİ
// ============================================

function updatePlayer() {
    if (gameState !== 'playing' || isPaused) return;
    
    // Sersemlik kontrolü - hızı güncelle
    if (player.stunned) {
        if (Date.now() > player.stunnedUntil) {
            // Sersemlik bitti, normal hıza dön
            player.stunned = false;
            player.speed = player.baseSpeed;
        } else {
            // Sersemleme sırasında hız %50 (normal hızın yarısı)
            player.speed = player.baseSpeed * 0.5;
        }
    } else {
        // Normal durumda temel hızı kullan
        player.speed = player.baseSpeed;
    }
    
    let newX = player.x;
    let newY = player.y;
    
    // Hareket kontrolleri (sersemleme olsa bile hareket edebilir)
    if (keys['w'] || keys['arrowup']) {
        newY -= player.speed;
    }
    if (keys['s'] || keys['arrowdown']) {
        newY += player.speed;
    }
    if (keys['a'] || keys['arrowleft']) {
        newX -= player.speed;
    }
    if (keys['d'] || keys['arrowright']) {
        newX += player.speed;
    }
    
    // Sınır kontrolü
    newX = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, newX));
    newY = Math.max(player.height / 2, Math.min(canvas.height - player.height / 2, newY));
    
    // Taş dağları ile çarpışma kontrolü (sadece taş dağına çarpmayı engeller)
    let canMove = true;
    for (let wall of rockWalls) {
        if (checkCollision(newX, newY, player.width, player.height, wall.x, wall.y, wall.width, wall.height)) {
            canMove = false;
            break;
        }
    }
    
    if (canMove) {
        player.x = newX;
        player.y = newY;
    }
}

// Boss'a saldır
function attackBoss() {
    const now = Date.now();
    if (now - player.lastAttack < player.attackSpeed) return;
    
    // Mesafe kontrolü (saldırı menzili)
    const distance = Math.sqrt(
        Math.pow(boss.x - player.x, 2) + Math.pow(boss.y - player.y, 2)
    );
    
    if (distance < 100) {
        boss.health -= player.damage;
        player.lastAttack = now;
        
        if (boss.health <= 0) {
            boss.health = 0;
            victory();
        }
        
        updateUI();
    }
}

// ============================================
// BOSS AI VE SKİLLER
// ============================================

function updateBoss() {
    if (gameState !== 'playing' || isPaused || boss.health <= 0) return;
    
    const now = Date.now();
    
    // Oyuncuya doğru bak
    boss.direction = Math.atan2(player.y - boss.y, player.x - boss.x);
    
    // Skill kullan
    if (now - boss.lastSkill > boss.skillCooldown && !boss.isAttacking) {
        const skillType = Math.floor(Math.random() * 3) + 1;
        useBossSkill(skillType);
        boss.lastSkill = now;
    }
    
    // Saldırı animasyonu güncelle
    if (boss.isAttacking) {
        boss.attackTimer -= 16; // ~60 FPS
        
        if (boss.attackTimer <= 0) {
            boss.isAttacking = false;
            boss.attackType = null;
        }
    }
    
    // Boss hareketi (oyuncuya yaklaş)
    const distance = Math.sqrt(
        Math.pow(boss.x - player.x, 2) + Math.pow(boss.y - player.y, 2)
    );
    
    if (distance > 150 && !boss.isAttacking) {
        boss.x += Math.cos(boss.direction) * boss.speed;
        boss.y += Math.sin(boss.direction) * boss.speed;
        
        // Boss'u ekran sınırları içinde tut
        boss.x = Math.max(boss.width / 2, Math.min(canvas.width - boss.width / 2, boss.x));
        boss.y = Math.max(boss.height / 2, Math.min(canvas.height - boss.height / 2, boss.y));
    }
}

// Boss skill kullanma
function useBossSkill(skillType) {
    boss.isAttacking = true;
    boss.attackType = skillType;
    
    if (skillType === 1) {
        // Skill 1: Yakın saldırı (ellerini birleştirip 360 derece vurur)
        boss.attackTimer = 500;
        const attackRadius = 120; // Saldırı yarıçapı
        const distance = Math.sqrt(
            Math.pow(boss.x - player.x, 2) + Math.pow(boss.y - player.y, 2)
        );
        
        // Boss'un etrafındaki 360 derece alanda oyuncu varsa hasar ver
        if (distance < attackRadius) {
            player.health -= 30;
            if (player.health <= 0) {
                player.health = 0;
                defeat();
            }
            updateUI();
        }
    } else if (skillType === 2) {
        // Skill 2: Havadan 2 taş fırlatma
        boss.attackTimer = 2000;
        
        // 2 taş oluştur (oyuncunun o anki pozisyonuna)
        const currentPlayerX = player.x;
        const currentPlayerY = player.y;
        
        for (let i = 0; i < 2; i++) {
            setTimeout(() => {
                const projectile = {
                    x: currentPlayerX + (Math.random() - 0.5) * 100,
                    y: -50,
                    targetX: currentPlayerX,
                    targetY: currentPlayerY,
                    radius: 30,
                    landed: false,
                    landingTime: Date.now() + 1000,
                    damaged: false
                };
                projectiles.push(projectile);
            }, i * 500);
        }
    } else if (skillType === 3) {
        // Skill 3: Ayağını yere vurup taş dağı oluşturma
        boss.attackTimer = 1500;
        
        // Boss'un baktığı yöne taş dağı oluştur
        const wallX = boss.x + Math.cos(boss.direction) * 150;
        const wallY = boss.y + Math.sin(boss.direction) * 150;
        
        // Sınır kontrolü
        const wallWidth = 100;
        const wallHeight = 100;
        const finalX = Math.max(wallWidth/2, Math.min(canvas.width - wallWidth/2, wallX));
        const finalY = Math.max(wallHeight/2, Math.min(canvas.height - wallHeight/2, wallY));
        
        // Taş dağını oluştur
        const wall = {
            x: finalX - wallWidth / 2,
            y: finalY - wallHeight / 2,
            width: wallWidth,
            height: wallHeight,
            createdAt: Date.now(),
            duration: 800, // 0.8 saniye sonra yok olur (sersemleme geçmeden)
            hasStunnedPlayer: false // Oyuncuyu sersemletti mi kontrolü
        };
        
        rockWalls.push(wall);
        
        // Taş dağı oluşturulduğunda oyuncu yakınsa (içine girmese bile) sersemlet
        // Taş dağının merkezine mesafe kontrolü yap
        const wallCenterX = finalX;
        const wallCenterY = finalY;
        const distanceToWall = Math.sqrt(
            Math.pow(player.x - wallCenterX, 2) + Math.pow(player.y - wallCenterY, 2)
        );
        
        // Eğer oyuncu taş dağına 80px mesafede veya daha yakınsa sersemlet
        if (distanceToWall < 80 && !player.stunned) {
            player.stunned = true;
            player.stunnedUntil = Date.now() + 1000; // 1 saniye sersemlik
            player.health -= 15;
            wall.hasStunnedPlayer = true;
            
            if (player.health <= 0) {
                player.health = 0;
                defeat();
            }
            updateUI();
        }
    }
}

// Projeleri güncelle
function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        const now = Date.now();
        
        if (!proj.landed && now >= proj.landingTime) {
            proj.landed = true;
            proj.landY = proj.targetY;
            
            // Oyuncuya hasar ver (sadece bir kez)
            if (!proj.damaged) {
                const distance = Math.sqrt(
                    Math.pow(proj.targetX - player.x, 2) + Math.pow(proj.targetY - player.y, 2)
                );
                
                if (distance < proj.radius + player.width / 2) {
                    player.health -= 20;
                    proj.damaged = true;
                    if (player.health <= 0) {
                        player.health = 0;
                        defeat();
                    }
                    updateUI();
                }
            }
        }
        
        // Projeyi kaldır (3 saniye sonra)
        if (now > proj.landingTime + 3000) {
            projectiles.splice(i, 1);
        }
    }
}

// Taş dağlarını güncelle
function updateRockWalls() {
    const now = Date.now();
    for (let i = rockWalls.length - 1; i >= 0; i--) {
        const wall = rockWalls[i];
        
        // Süresi dolmuş mu kontrol et
        if (now > wall.createdAt + wall.duration) {
            rockWalls.splice(i, 1);
            continue;
        }
        
        // Oyuncu ile çarpışma kontrolü (içine girdiğinde)
        if (checkCollision(player.x, player.y, player.width, player.height, wall.x, wall.y, wall.width, wall.height)) {
            // Sersemlet ve yavaşlat (sadece bir kez ve daha önce sersemletilmediyse)
            if (!player.stunned && !wall.hasStunnedPlayer) {
                player.stunned = true;
                player.stunnedUntil = Date.now() + 1000; // 1 saniye sersemlik
                // Hız zaten updatePlayer'da %50'ye düşecek
                player.health -= 15;
                wall.hasStunnedPlayer = true;
                
                if (player.health <= 0) {
                    player.health = 0;
                    defeat();
                }
                updateUI();
            }
        }
    }
}

// Çarpışma kontrolü
function checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 - w1/2 < x2 + w2/2 &&
           x1 + w1/2 > x2 - w2/2 &&
           y1 - h1/2 < y2 + h2/2 &&
           y1 + h1/2 > y2 - h2/2;
}

// ============================================
// ÇİZİM FONKSİYONLARI
// ============================================

function draw() {
    // Canvas'ı temizle (arka plan harita rengi ile çizilecek)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === 'playing') {
        // Oyuncuyu çiz
        ctx.fillStyle = player.stunned ? '#888' : player.color;
        ctx.fillRect(
            player.x - player.width / 2,
            player.y - player.height / 2,
            player.width,
            player.height
        );
        
        // Oyuncu kenarlığı
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            player.x - player.width / 2,
            player.y - player.height / 2,
            player.width,
            player.height
        );
        
        // Oyuncu sağlık gösterge
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Oyuncu', player.x, player.y - player.height / 2 - 5);
        ctx.textAlign = 'left';
        
        // Boss çiz
        if (boss.health > 0) {
            ctx.fillStyle = boss.color;
            ctx.fillRect(
                boss.x - boss.width / 2,
                boss.y - boss.height / 2,
                boss.width,
                boss.height
            );
            
            // Boss kenarlığı
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.strokeRect(
                boss.x - boss.width / 2,
                boss.y - boss.height / 2,
                boss.width,
                boss.height
            );
            
            // Boss yönü göster
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(boss.x, boss.y);
            ctx.lineTo(
                boss.x + Math.cos(boss.direction) * 50,
                boss.y + Math.sin(boss.direction) * 50
            );
            ctx.stroke();
            
            // Boss sağlık gösterge
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('BOSS', boss.x, boss.y - boss.height / 2 - 5);
            ctx.textAlign = 'left';
        }
        
        // Projeleri çiz
        ctx.fillStyle = '#8b4513';
        for (let proj of projectiles) {
            if (!proj.landed) {
                // Düşen taş işareti (kırmızı alan)
                ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                ctx.beginPath();
                ctx.arc(proj.targetX, proj.targetY, proj.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Taş
                ctx.fillStyle = '#8b4513';
                const progress = (Date.now() - (proj.landingTime - 1000)) / 1000;
                const currentY = -50 + (proj.targetY + 50) * progress;
                ctx.beginPath();
                ctx.arc(proj.targetX, currentY, proj.radius, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Yerdeki taş
                ctx.beginPath();
                ctx.arc(proj.targetX, proj.landY, proj.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Taş dağlarını çiz
        ctx.fillStyle = '#555';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        for (let wall of rockWalls) {
            ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
            ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
        }
        
        // Boss saldırı animasyonu (360 derece)
        if (boss.isAttacking && boss.attackType === 1) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
            ctx.beginPath();
            ctx.arc(boss.x, boss.y, 120, 0, Math.PI * 2); // 360 derece saldırı alanı
            ctx.fill();
            
            // Saldırı çemberi kenarlığı
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }
}

// ============================================
// OYUN DÖNGÜSÜ
// ============================================

function gameLoop() {
    if (gameState === 'playing' && !isPaused) {
        updatePlayer();
        updateBoss();
        updateProjectiles();
        updateRockWalls();
    }
    
    draw();
    requestAnimationFrame(gameLoop);
}

// ============================================
// OYUN DURUMLARI
// ============================================

function startBattle() {
    gameState = 'playing';
    isPaused = false;
}

function victory() {
    gameState = 'victory';
    
    // Diğer yolun boss özelliklerini göster
    const otherDoor = selectedDoor === 1 ? 2 : 1;
    const otherBossHealth = Math.floor(boss.maxHealth * (0.7 + Math.random() * 0.8));
    
    showInfoBox(
        'Zafer!',
        `Boss'u yendiniz!<br><br>` +
        `<strong>Yendiğiniz Boss:</strong><br>` +
        `Can: ${boss.maxHealth}<br><br>` +
        `<strong>Diğer Kapıdaki Boss (Kapı ${otherDoor}):</strong><br>` +
        `Tahmini Can: ${otherBossHealth}`,
        [
            { text: 'Yeni Bölüme Geç', action: nextLevel },
            { text: 'Ana Menü', action: goToMainMenu }
        ]
    );
}

function defeat() {
    gameState = 'defeat';
    
    showInfoBox(
        'Kaybettiniz',
        'Boss sizi yendi. Sorun yok, tekrar deneyiniz!',
        [
            { text: 'Tekrar Dene', action: retry },
            { text: 'Ana Menü', action: goToMainMenu }
        ]
    );
}

function nextLevel() {
    currentLevel++;
    
    // Oyuncu istatistiklerini artır
    player.maxHealth = Math.floor(player.maxHealth * 1.2);
    player.health = player.maxHealth;
    player.damage = Math.floor(player.damage * 1.15);
    
    // Bölümü güncelle
    document.getElementById('current-level').textContent = currentLevel;
    
    // Yeni kapı seçimi
    selectedDoor = null;
    gameState = 'doorSelection';
    document.getElementById('door-selection').style.display = 'block';
    document.getElementById('info-box').classList.remove('show');
    
    updateUI();
}

function retry() {
    // Bölümü 1'e sıfırla ve oyuncu istatistiklerini yeniden yükle
    currentLevel = 1;
    
    // Oyuncu istatistiklerini başlangıç değerlerine döndür
    loadPlayerStats();
    
    // Boss'u başlat
    initializeBoss();
    
    // Oyun durumunu ayarla
    gameState = 'playing';
    isPaused = false;
    document.getElementById('info-box').classList.remove('show');
    updateUI();
}

function togglePause() {
    isPaused = !isPaused;
    const pauseMenu = document.getElementById('pause-menu');
    if (isPaused) {
        pauseMenu.classList.add('show');
    } else {
        pauseMenu.classList.remove('show');
    }
}

function resumeGame() {
    isPaused = false;
    document.getElementById('pause-menu').classList.remove('show');
}

function goToMainMenu() {
    window.location.href = 'index.html';
}

// ============================================
// UI GÜNCELLEMELERİ
// ============================================

function updateUI() {
    // Oyuncu sağlık
    document.getElementById('player-health').textContent = Math.max(0, Math.floor(player.health));
    document.getElementById('player-max-health').textContent = Math.floor(player.maxHealth);
    const healthPercent = (player.health / player.maxHealth) * 100;
    document.getElementById('player-health-bar').style.width = healthPercent + '%';
    
    // Boss sağlık
    if (gameState === 'playing') {
        document.getElementById('boss-health').textContent = Math.max(0, Math.floor(boss.health));
        document.getElementById('boss-max-health').textContent = Math.floor(boss.maxHealth);
        const bossHealthPercent = (boss.health / boss.maxHealth) * 100;
        document.getElementById('boss-health-bar').style.width = bossHealthPercent + '%';
    }
    
    // Bölüm
    document.getElementById('current-level').textContent = currentLevel;
}

// Bilgilendirme kutusunu göster
function showInfoBox(title, content, buttons) {
    document.getElementById('info-title').textContent = title;
    document.getElementById('info-content').innerHTML = content;
    
    const buttonsContainer = document.getElementById('info-buttons');
    buttonsContainer.innerHTML = '';
    
    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.textContent = btn.text;
        button.onclick = btn.action;
        buttonsContainer.appendChild(button);
    });
    
    document.getElementById('info-box').classList.add('show');
}
