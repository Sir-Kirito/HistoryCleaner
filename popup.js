const filterListElement = document.getElementById('filter-list');
const loadFilterInput = document.getElementById('load-filter-input');
const loadFiltersButton = document.getElementById('load-filters');
const adultButton = document.getElementById('adult-button');
let totalDeletedCount = 0; // Silinen öğe sayısını takip et

// Kaydedilmiş filtreleri yükle
function loadSavedFilters() {
    const savedFilters = JSON.parse(localStorage.getItem('filters')) || [];
    filterListElement.innerHTML = ''; // Önceki öğeleri temizle
    savedFilters.forEach(filter => {
        const div = document.createElement('div');
        div.textContent = filter;
        div.addEventListener('click', () => {
            clearHistory(filter); // Geçmişi bu filtre ile temizle
        });

        // Çöp kutusu simgesi ekleme
        const trashIcon = document.createElement('span');
        trashIcon.textContent = '🗑️'; // Çöp kutusu simgesi
        trashIcon.classList.add('trash-icon');
        trashIcon.addEventListener('click', (event) => {
            event.stopPropagation(); // Olayın üst öğeye yayılmasını önle
            removeFilter(filter); // Filtreyi sil
        });

        div.appendChild(trashIcon); // Çöp kutusu simgesini ekle
        filterListElement.appendChild(div);
    });

    // Filtre sayısını göster
    document.getElementById('filter-count').innerHTML = `Toplam Filtre: ${savedFilters.length}`;
}

// Geri bildirimi 3 saniye sonra gizle
function hideMessageAfterDelay(messageId) {
    setTimeout(() => {
        document.getElementById(messageId).innerHTML = '';
    }, 3000);
}

// Geçmişi belirtilen filtre ile temizle
async function clearHistory(filter) {
    totalDeletedCount = 0; // Her işlem öncesi sayacı sıfırla
    try {
        const historyItems = await chrome.history.search({ text: '', maxResults: 1000 });
        const toDelete = historyItems.filter(item => 
            item.title.includes(filter) || item.url.includes(filter)
        ); // Eşleşen öğeleri filtrele

        if (toDelete.length > 0) {
            await Promise.all(toDelete.map(async item => {
                try {
                    await chrome.history.deleteUrl({ url: item.url });
                    totalDeletedCount++; // Silinen öğe sayısını artır
                } catch (deleteError) {
                    console.error("Silme hatası:", deleteError); // Hata durumunda konsola yazdır
                }
            }));

            // Geri bildirim mesajını ayarla
            const successMessage = `${totalDeletedCount} öğe silindi! <span class='status success'>✔️</span>`;
            document.getElementById('status-message').innerHTML = successMessage;
            document.getElementById('filter-status-message').innerHTML = successMessage; // Filtreler sekmesinde de göster
            hideMessageAfterDelay('status-message'); // Geri bildirimi gizle
            hideMessageAfterDelay('filter-status-message'); // Geri bildirimi gizle
        } else {
            const errorMessage = "Silinecek öğe bulunamadı. <span class='status error'>❌</span>";
            document.getElementById('status-message').innerHTML = errorMessage;
            document.getElementById('filter-status-message').innerHTML = errorMessage; // Filtreler sekmesinde de göster
            hideMessageAfterDelay('status-message'); // Geri bildirimi gizle
            hideMessageAfterDelay('filter-status-message'); // Geri bildirimi gizle
        }
    } catch (error) {
        console.error("Hata:", error); // Hata bilgilerini konsola yazdır
        const errorMessage = "Bir hata oluştu. <span class='status error'>❌</span>";
        document.getElementById('status-message').innerHTML = errorMessage;
        document.getElementById('filter-status-message').innerHTML = errorMessage; // Filtreler sekmesinde de göster
        hideMessageAfterDelay('status-message'); // Geri bildirimi gizle
        hideMessageAfterDelay('filter-status-message'); // Geri bildirimi gizle
    }
}

// Yetişkin içerikleri temizle
async function clearAdultContent() {
    const url = "https://raw.githubusercontent.com/Sir-Kirito/HistoryCleaner/refs/heads/main/AdultFilter"; // Yetişkin içerik filtresi URL'si
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP hatası! Status: ${response.status}`); // HTTP hatası kontrolü
        }
        const text = await response.text();
        const adultFilters = text.split('\n').map(s => s.trim()).filter(s => s); // Her satırı ayrı filtre olarak yükle

        const historyItems = await chrome.history.search({ text: '', maxResults: 1000 });
        let toDelete = [];

        adultFilters.forEach(filter => {
            historyItems.forEach(item => {
                if (item.title.includes(filter) || item.url.includes(filter)) {
                    toDelete.push(item); // Eşleşen öğeyi silme listesine ekle
                }
            });
        });

        if (toDelete.length > 0) {
            await Promise.all(toDelete.map(async item => {
                try {
                    await chrome.history.deleteUrl({ url: item.url });
                    totalDeletedCount++; // Silinen öğe sayısını artır
                } catch (deleteError) {
                    console.error("Silme hatası:", deleteError); // Hata durumunda konsola yazdır
                }
            }));
            const successMessage = `${totalDeletedCount} yetişkin içeriği silindi! <span class='status success'>✔️</span>`;
            document.getElementById('filter-status-message').innerHTML = successMessage;
            hideMessageAfterDelay('filter-status-message'); // Geri bildirimi gizle
            totalDeletedCount = 0; // Sayacı sıfırla
        } else {
            const errorMessage = "Silinecek öğe bulunamadı. <span class='status error'>❌</span>";
            document.getElementById('filter-status-message').innerHTML = errorMessage;
            hideMessageAfterDelay('filter-status-message'); // Geri bildirimi gizle
        }
    } catch (error) {
        console.error("Hata:", error); // Hata bilgilerini konsola yazdır
        const errorMessage = "Bir hata oluştu. <span class='status error'>❌</span>";
        document.getElementById('filter-status-message').innerHTML = errorMessage; // Filtreler sekmesinde de göster
        hideMessageAfterDelay('filter-status-message'); // Geri bildirimi gizle
    }
}

// Filtreleri kaydet
document.getElementById('save-filter').addEventListener('click', () => {
    const filterInput = document.getElementById('filter-input').value.trim();
    if (filterInput) {
        const savedFilters = JSON.parse(localStorage.getItem('filters')) || [];
        savedFilters.push(filterInput);
        localStorage.setItem('filters', JSON.stringify(savedFilters)); // Filtreleri yerel depolamaya kaydet
        loadSavedFilters(); // Listeyi güncelle
        document.getElementById('filter-input').value = ''; // Metin kutusunu temizle
        const successMessage = "Filtre kaydedildi! <span class='status success'>✔️</span>";
        document.getElementById('status-message').innerHTML = successMessage;
        document.getElementById('filter-status-message').innerHTML = successMessage; // Filtreler sekmesinde de göster
        hideMessageAfterDelay('status-message'); // Geri bildirimi gizle
        hideMessageAfterDelay('filter-status-message'); // Geri bildirimi gizle
    }
});

// Geçmişi temizle
document.getElementById('clear-history').addEventListener('click', async () => {
    const filterInput = document.getElementById('filter-input').value;
    const filters = filterInput.split(",").map(s => s.trim()).filter(s => s); // Boş filtreleri temizle

    console.log("Filtreler:", filters); // Debug çıktısı

    try {
        const historyItems = await chrome.history.search({ text: '', maxResults: 1000 });
        console.log("Geçmiş Öğeleri:", historyItems); // Geçmiş öğelerini konsola yazdır

        let toDelete = []; // Silinecek öğeleri burada toplayacağız

        if (filters.length === 0) {
            console.log("Filtreler boş, hiçbir öğe silinmeyecek."); // Debug çıktısı
            const errorMessage = "Silinecek öğe bulunamadı. <span class='status error'>❌</span>";
            document.getElementById('status-message').innerHTML = errorMessage;
            document.getElementById('filter-status-message').innerHTML = errorMessage; // Filtreler sekmesinde de göster
            hideMessageAfterDelay('status-message'); // Geri bildirimi gizle
            hideMessageAfterDelay('filter-status-message'); // Geri bildirimi gizle
            return; // Hiçbir şey silmeden çık
        }

        filters.forEach(filter => {
            historyItems.forEach(item => {
                if (item.title.includes(filter) || item.url.includes(filter)) {
                    toDelete.push(item); // Eşleşen öğeyi silme listesine ekle
                }
            });
        });

        console.log("Silinecek Öğeler:", toDelete); // Debug çıktısı

        if (toDelete.length > 0) {
            await Promise.all(toDelete.map(async item => {
                try {
                    await chrome.history.deleteUrl({ url: item.url });
                    totalDeletedCount++; // Silinen öğe sayısını artır
                } catch (deleteError) {
                    console.error("Silme hatası:", deleteError); // Hata durumunda konsola yazdır
                }
            }));
            const successMessage = "İşlem tamamlandı! <span class='status success'>✔️</span>";
            document.getElementById('status-message').innerHTML = successMessage;
            document.getElementById('filter-status-message').innerHTML = successMessage; // Filtreler sekmesinde de göster
            hideMessageAfterDelay('status-message'); // Geri bildirimi gizle
            hideMessageAfterDelay('filter-status-message'); // Geri bildirimi gizle
        } else {
            const errorMessage = "Silinecek öğe bulunamadı. <span class='status error'>❌</span>";
            document.getElementById('status-message').innerHTML = errorMessage;
            document.getElementById('filter-status-message').innerHTML = errorMessage; // Filtreler sekmesinde de göster
            hideMessageAfterDelay('status-message'); // Geri bildirimi gizle
            hideMessageAfterDelay('filter-status-message'); // Geri bildirimi gizle
        }
    } catch (error) {
        console.error("Hata:", error); // Hata bilgilerini konsola yazdır
        const errorMessage = "Bir hata oluştu. <span class='status error'>❌</span>";
        document.getElementById('status-message').innerHTML = errorMessage;
        document.getElementById('filter-status-message').innerHTML = errorMessage; // Filtreler sekmesinde de göster
        hideMessageAfterDelay('status-message'); // Geri bildirimi gizle
        hideMessageAfterDelay('filter-status-message'); // Geri bildirimi gizle
    }
});

// Çöp kutusu simgesine tıklandığında filtreyi sil
function removeFilter(filter) {
    const savedFilters = JSON.parse(localStorage.getItem('filters')) || [];
    const updatedFilters = savedFilters.filter(f => f !== filter); // Silinecek filtreyi çıkar
    localStorage.setItem('filters', JSON.stringify(updatedFilters)); // Güncellenmiş filtreleri kaydet
    loadSavedFilters(); // Listeyi güncelle
    const successMessage = "Filtre silindi! <span class='status success'>✔️</span>";
    document.getElementById('status-message').innerHTML = successMessage;
    document.getElementById('filter-status-message').innerHTML = successMessage; // Filtreler sekmesinde de göster
    hideMessageAfterDelay('status-message'); // Geri bildirimi gizle
    hideMessageAfterDelay('filter-status-message'); // Geri bildirimi gizle
}

// Filtreleri yüklemek için buton
document.getElementById('load-filters').addEventListener('click', async () => {
    const url = loadFilterInput.value.trim();
    if (url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP hatası! Status: ${response.status}`); // HTTP hatası kontrolü
            }
            const text = await response.text();
            const loadedFilters = text.split('\n').map(s => s.trim()).filter(s => s); // Her satırı ayrı filtre olarak yükle
            const savedFilters = JSON.parse(localStorage.getItem('filters')) || [];
            const updatedFilters = [...savedFilters, ...loadedFilters]; // Yeni filtreleri ekle
            localStorage.setItem('filters', JSON.stringify(updatedFilters)); // Güncellenmiş filtreleri kaydet
            loadSavedFilters(); // Listeyi güncelle
            loadFilterInput.value = ''; // Metin kutusunu temizle
            const successMessage = `${loadedFilters.length} filtre yüklendi! <span class='status success'>✔️</span>`;
            document.getElementById('status-message').innerHTML = successMessage;
            document.getElementById('filter-status-message').innerHTML = successMessage; // Filtreler sekmesinde de göster
            hideMessageAfterDelay('status-message'); // Geri bildirimi gizle
            hideMessageAfterDelay('filter-status-message'); // Geri bildirimi gizle
        } catch (error) {
            console.error("Filtre yükleme hatası:", error); // Hata durumunda konsola yazdır
            const errorMessage = "Filtre yüklenirken hata oluştu. <span class='status error'>❌</span>";
            document.getElementById('status-message').innerHTML = errorMessage;
            document.getElementById('filter-status-message').innerHTML = errorMessage; // Filtreler sekmesinde de göster
            hideMessageAfterDelay('status-message'); // Geri bildirimi gizle
            hideMessageAfterDelay('filter-status-message'); // Geri bildirimi gizle
        }
    }
});

// Yetişkin içerikleri temizle butonuna tıklanıldığında
adultButton.addEventListener('click', clearAdultContent);

// Sayfa yüklendiğinde kaydedilmiş filtreleri yükle
window.onload = loadSavedFilters;

// "Filtreler" sekmesine geçiş
document.getElementById('filters-tab').addEventListener('click', () => {
    document.getElementById('main-menu').style.display = 'none'; // Ana menüyü gizle
    document.getElementById('filters-menu').style.display = 'block'; // Filtreler menüsünü göster
});

// "Ana Menü" sekmesine geçiş
document.getElementById('main-tab').addEventListener('click', () => {
    document.getElementById('filters-menu').style.display = 'none'; // Filtreler menüsünü gizle
    document.getElementById('main-menu').style.display = 'block'; // Ana menüyü göster
});

// Filtrelerle geçmişi temizle
document.getElementById('clear-filters').addEventListener('click', async () => {
    const filters = JSON.parse(localStorage.getItem('filters')) || []; // Kayıtlı filtreleri al

    if (filters.length === 0) {
        const errorMessage = "Silinecek öğe bulunamadı. <span class='status error'>❌</span>";
        document.getElementById('filter-status-message').innerHTML = errorMessage; // Filtreler sekmesinde göster
        hideMessageAfterDelay('filter-status-message'); // Geri bildirimi gizle
        return;
    }

    try {
        const historyItems = await chrome.history.search({ text: '', maxResults: 1000 });
        let toDelete = [];

        filters.forEach(filter => {
            historyItems.forEach(item => {
                if (item.title.includes(filter) || item.url.includes(filter)) {
                    toDelete.push(item); // Eşleşen öğeyi silme listesine ekle
                }
            });
        });

        if (toDelete.length > 0) {
            await Promise.all(toDelete.map(async item => {
                try {
                    await chrome.history.deleteUrl({ url: item.url });
                    totalDeletedCount++; // Silinen öğe sayısını artır
                } catch (deleteError) {
                    console.error("Silme hatası:", deleteError); // Hata durumunda konsola yazdır
                }
            }));
            const successMessage = `${totalDeletedCount} filtre ile eşleşen geçmiş silindi! <span class='status success'>✔️</span>`;
            document.getElementById('filter-status-message').innerHTML = successMessage; // Filtreler sekmesinde göster
            hideMessageAfterDelay('filter-status-message'); // Geri bildirimi gizle
            totalDeletedCount = 0; // Sayacı sıfırla
        } else {
            const errorMessage = "Silinecek öğe bulunamadı. <span class='status error'>❌</span>";
            document.getElementById('filter-status-message').innerHTML = errorMessage; // Filtreler sekmesinde göster
            hideMessageAfterDelay('filter-status-message'); // Geri bildirimi gizle
        }
    } catch (error) {
        console.error("Hata:", error); // Hata bilgilerini konsola yazdır
        const errorMessage = "Bir hata oluştu. <span class='status error'>❌</span>";
        document.getElementById('filter-status-message').innerHTML = errorMessage; // Filtreler sekmesinde göster
        hideMessageAfterDelay('filter-status-message'); // Geri bildirimi gizle
    }
});
