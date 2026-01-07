// ============================================
// MENÜ YÖNETİMİ
// ============================================

// Sayfa yüklendiğinde seçim durumlarını güncelle
window.addEventListener('DOMContentLoaded', function() {
    updateSelectionStatus();
});

// Seçim durumlarını güncelleme fonksiyonu
function updateSelectionStatus() {
    // Karakter seçim durumunu güncelle
    const characterStatus = localStorage.getItem('characterStatus');
    if (characterStatus) {
        document.getElementById('character-status').textContent = characterStatus;
        document.getElementById('character-status').style.color = '#4ade80';
    }

    // Zırh seçim durumunu güncelle
    const armorStatus = localStorage.getItem('armorStatus');
    if (armorStatus) {
        document.getElementById('armor-status').textContent = armorStatus;
        document.getElementById('armor-status').style.color = '#4ade80';
    }

    // Silah seçim durumunu güncelle
    const weaponStatus = localStorage.getItem('weaponStatus');
    if (weaponStatus) {
        document.getElementById('weapon-status').textContent = weaponStatus;
        document.getElementById('weapon-status').style.color = '#4ade80';
    }

    // Harita seçim durumunu güncelle
    const mapStatus = localStorage.getItem('mapStatus');
    if (mapStatus) {
        document.getElementById('map-status').textContent = mapStatus;
        document.getElementById('map-status').style.color = '#4ade80';
    }
}

// Oyunu başlatma fonksiyonu
function startGame() {
    // Tüm seçimlerin yapılıp yapılmadığını kontrol et
    const character = localStorage.getItem('selectedCharacter');
    const armor = localStorage.getItem('selectedArmor');
    const weapon = localStorage.getItem('selectedWeapon');
    const map = localStorage.getItem('selectedMap');

    // Eğer herhangi bir seçim eksikse hata göster
    if (!character || !armor || !weapon || !map) {
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = 'Oyuna başlamak için tüm seçimleri yapınız!';
        errorMessage.classList.add('show');
        
        // 3 saniye sonra hata mesajını gizle
        setTimeout(() => {
            errorMessage.classList.remove('show');
        }, 3000);
        return;
    }

    // Tüm seçimler tamamsa oyun sayfasına yönlendir
    window.location.href = 'game.html';
}
