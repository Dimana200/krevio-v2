// Глобални променливи и помощни функции от оригиналния код
var STATE = {
    user: null,
    profile: null,
    page: 'feed',
    lastMsgTime: 0,
    msgCount: 0,
    videos: [],
    following: []
};

function el(id) { return document.getElementById(id); }

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    var p = el('page-' + pageId);
    if (p) p.classList.add('active');
    
    document.querySelectorAll('.bn').forEach(b => b.classList.remove('active'));
    var b = el('bn-' + pageId);
    if (b) b.classList.add('active');
    
    STATE.page = pageId;
}

// Инициализация на Lucide и старт
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
    // Тук добави логиката за проверка на потребител
});
