// --- إعدادات Firebase والاتصال ---
const firebaseConfig = {
    apiKey: "AIzaSyCcFRLMsewcgYXYgVvdkyQHf-imoJHHzng",
    authDomain: "mrhamdy-1c406.firebaseapp.com",
    databaseURL: "https://mrhamdy-1c406-default-rtdb.firebaseio.com",
    projectId: "mrhamdy-1c406",
    storageBucket: "mrhamdy-1c406.firebasestorage.app",
    messagingSenderId: "806268398144",
    appId: "1:806268398144:web:e7c9b87205cbb6fb2b4da5"
};

// التأكد من تحميل مكتبة فايربيس قبل التشغيل
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    // 1. المتصلون الآن
    // إنشاء عنصر العداد في الهيدر
    const header = document.querySelector('.main-header');
    const onlineBadge = document.createElement('div');
    onlineBadge.className = 'online-badge';
    onlineBadge.innerHTML = '● مباشر: <span id="real-count">0</span>';
    header.insertBefore(onlineBadge, header.querySelector('.menu-wrapper'));

    const onlineRef = db.ref('admin/online_users');
    const userStatusRef = onlineRef.push(true);
    userStatusRef.onDisconnect().remove();

    onlineRef.on('value', (snapshot) => {
        document.getElementById('real-count').innerText = snapshot.numChildren() || 0;
    });

    // 2. التنبيهات
    const notifyRef = db.ref('admin/notification');
    notifyRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if(data && data.text) {
            const msg = document.createElement('div');
            msg.style = "position:fixed; top:100px; left:50%; transform:translateX(-50%); background:var(--neon-blue); color:black; padding:15px 30px; border-radius:10px; z-index:2000; box-shadow:0 0 20px var(--neon-blue); font-weight:bold; animation:bounceIn 0.5s;";
            msg.innerHTML = `<i class="fas fa-bell"></i> تنبيه هام: ${data.text}`;
            document.body.appendChild(msg);
            setTimeout(() => msg.remove(), 10000);
        }
    });

    // 3. تغيير البوستر
    // (سيتم تفعيله فقط إذا كانت الصورة موجودة في الصفحة)
}

// القائمة الجانبية
const menuBtn = document.getElementById('menuBtn');
const sideNav = document.getElementById('sideNav');

menuBtn.onclick = () => {
    sideNav.classList.toggle('open');
    menuBtn.classList.toggle('active');
};

// متغيرات لتخزين حالة الأنظمة المختلفة
let boardPages = [];
let boardPageIndex = 0;
let pdfPages = [];
let pdfPageIndex = 0;
let currentPdfUrl = null;
let currentSystemType = 'board';

// تبديل الأنظمة (سبورة / ملفات)
function switchSystem(type) {
    if (type === 'files') {
        document.getElementById('fileInput').click();
        return;
    }

    // حفظ حالة النظام الحالي قبل التبديل
    if (currentSystemType === 'board') {
        boardPages = pages;
        boardPageIndex = currentPageIndex;
    } else if (currentSystemType === 'pdf') {
        pdfPages = pages;
        pdfPageIndex = currentPageIndex;
    }

    currentSystemType = type;

    // استعادة حالة النظام الجديد
    if (type === 'board') {
        pages = boardPages || [];
        currentPageIndex = boardPageIndex || 0;
    } else if (type === 'pdf') {
        pages = pdfPages || [];
        currentPageIndex = pdfPageIndex || 0;
    }

    document.getElementById('workspace').style.display = 'block';
    document.querySelectorAll('.sys-content').forEach(s => s.style.display = 'none');
    
    // التأكد من وجود حاوية للنظام (إنشاءها ديناميكياً للـ PDF)
    let sysDiv = document.getElementById(type + '-system');
    if (!sysDiv) {
        sysDiv = document.createElement('div');
        sysDiv.id = type + '-system';
        sysDiv.className = 'sys-content';
        document.querySelector('.workspace').appendChild(sysDiv);
    }
    sysDiv.style.display = 'block';

    // تهيئة الكانفاس داخل الحاوية المناسبة
    initCanvas(type + '-system');
}

function closeWorkspace() {
    document.getElementById('workspace').style.display = 'none';
}

// نظام الشات
const chatContainer = document.getElementById('chatContainer');
const unreadBadge = document.getElementById('unreadBadge');
const msgInput = document.getElementById('msgInput');
const chatBox = document.getElementById('chatBox');

function toggleChat() {
    const isVisible = chatContainer.style.display === 'flex';
    chatContainer.style.display = isVisible ? 'none' : 'flex';
    if (!isVisible) unreadBadge.style.display = 'none';
}

document.getElementById('chatToggleBtn').onclick = toggleChat;

document.getElementById('sendBtn').onclick = () => {
    if (msgInput.value.trim() === "") return;
    const msg = document.createElement('div');
    msg.className = 'message admin';
    msg.innerHTML = `<strong>أ. حمدي:</strong> <br> ${msgInput.value}`;
    chatBox.appendChild(msg);
    msgInput.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;
};

// محاكاة وصول رسالة طالب (لتجربة النقطة الزرقاء)
setTimeout(() => {
    if (chatContainer.style.display !== 'flex') {
        unreadBadge.style.display = 'block';
    }
}, 5000);

// نظام الملفات والرفع
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

fileInput.accept = '.pdf,image/*'; // السماح بملفات PDF والصور

dropZone.onclick = () => fileInput.click();

fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        // التحقق مما إذا كان الملف PDF
        if (file.type === 'application/pdf') {
            currentPdfUrl = URL.createObjectURL(file);
            switchSystem('pdf');
            return;
        } 
        // التحقق مما إذا كان الملف صورة
        else if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    // العودة لنظام السبورة للصور
                    switchSystem('board');
                    pages = [{ paths: [], images: [], bgColor: '#f4f4f9', bgImage: img }];
                    currentPageIndex = 0;
                    // تحديد الصفحة الجديدة كصفحة حالية
                    loadPage(0);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            alert('يرجى اختيار ملف PDF أو صورة (JPG, PNG) للشرح عليه');
        }
    }
};

// نظام السبورة البسيط (تمهيداً للملف المنفصل)
let canvas, ctx;
// متغيرات الحالة للسبورة الذكية
let drawPaths = []; // لتخزين مسارات الرسم
let placedImages = []; // لتخزين الصور المضافة
let pages = []; // لتخزين الصفحات
let currentPageIndex = 0;

let currentTool = 'pen'; // pen, move, eraser
let selectedImage = null; // الصورة المحددة حالياً للتحريك
let isDragging = false;
let isResizing = false; // حالة تغيير الحجم
let startX, startY;
let currentResizeHandler = null; // متغير لتخزين دالة تغيير الحجم لمنع التكرار

function initCanvas(containerId = 'board-system') {
    const boardSystem = document.getElementById(containerId);
    const isPdfMode = containerId === 'pdf-system';
    
    // تنظيف الحاوية لعدم تكرار العناصر عند الفتح والإغلاق
    boardSystem.innerHTML = '';
    
    // التحقق مما إذا كانت هناك بيانات سابقة لعدم مسحها عند التبديل
    if (pages.length === 0) {
        pages = [{ paths: [], images: [], bgColor: '#f4f4f9', bgImage: null }];
        currentPageIndex = 0;
    }

    // 1. إنشاء شريط التنقل العلوي (الصفحات)
    const topNav = document.createElement('div');
    topNav.className = 'board-top-nav';
    topNav.innerHTML = `
        <div class="nav-controls">
            <span style="color:var(--neon-blue); font-weight:bold; margin-left:10px;">
                ${isPdfMode ? '📄 تعديل الملف' : '🎨 السبورة الذكية'}
            </span>
            <button class="tool-btn" id="toggleToolsBtn" style="width:auto; padding:5px 15px;">⚙️ إعدادات</button>
        </div>
        <div class="nav-controls">
            <button class="tool-btn" id="prevPageBtn" style="width:auto; padding:5px 15px;">&lt;</button>
            <span id="pageIndicator" style="color:white; font-weight:bold;">1 / 1</span>
            <button class="tool-btn" id="nextPageBtn" style="width:auto; padding:5px 15px;">&gt;</button>
        </div>
        <div class="nav-controls">
            <button class="exit-circle-btn" onclick="closeWorkspace()" title="خروج">✕</button>
        </div>
    `;

    // 2. إنشاء نافذة الإعدادات (Modal)
    const toolbar = document.createElement('div');
    toolbar.className = 'settings-modal';
    toolbar.id = 'settingsModal';
    toolbar.innerHTML = `
        <div class="settings-header">
            <h3>لوحة التحكم</h3>
        </div>
        
        <div class="settings-body">
            <!-- قسم الأدوات -->
            <div class="tool-section">
                <h4>أدوات الرسم</h4>
                <div class="tools-grid">
                    <button class="tool-btn active" id="btnPen" onclick="setTool('pen')">✏️ قلم</button>
                    <button class="tool-btn" id="btnRect" onclick="setTool('rect')">⬜ مستطيل</button>
                    <button class="tool-btn" id="btnCircle" onclick="setTool('circle')">⭕ دائرة</button>
                    <button class="tool-btn" id="btnMove" onclick="setTool('move')">✋ تحريك</button>
                    <button class="tool-btn" id="btnEraser" onclick="setTool('eraser')">🧹 ممحاة</button>
                </div>
            </div>

            <!-- قسم الألوان -->
            <div class="tool-section">
                <h4>اللون والحجم</h4>
                <div class="color-palette" style="margin-bottom:10px;">
                    <div class="color-swatch" style="background:#000000" onclick="setColor('#000000')"></div>
                    <div class="color-swatch" style="background:#f4f4f9" onclick="setColor('#f4f4f9')"></div>
                    <div class="color-swatch" style="background:#ff0000" onclick="setColor('#ff0000')"></div>
                    <div class="color-swatch" style="background:#00ff00" onclick="setColor('#00ff00')"></div>
                    <div class="color-swatch" style="background:#0000ff" onclick="setColor('#0000ff')"></div>
                </div>
                <div style="display:flex; gap:10px; align-items:center;">
                    <input type="color" id="customColor" value="#000000" style="width:40px;">
                    <input type="range" id="penSize" min="1" max="20" value="5" style="flex:1;">
                </div>
            </div>

            <!-- قسم الخلفيات والصور -->
            <div class="tool-section">
                <h4>الوسائط والخلفية</h4>
                <div class="tools-grid">
                    <button class="tool-btn" onclick="setBg('#f4f4f9')">⬜ هادئة</button>
                    <button class="tool-btn" onclick="setBg('#000000')">⬛ سوداء</button>
                    <button class="tool-btn" onclick="setBg('#1a4d1a')">🟩 خضراء</button>
                    <button class="tool-btn" onclick="document.getElementById('bgImgInput').click()">🖼️ خلفية</button>
                    <button class="tool-btn" onclick="document.getElementById('addImgInput').click()">📷 صورة</button>
                </div>
                <input type="file" id="bgImgInput" accept="image/*" style="display:none">
                <input type="file" id="addImgInput" accept="image/*" style="display:none">
            </div>

            <!-- إجراءات -->
            <div class="tool-section">
                <button class="tool-btn" id="clearBtn" style="background:var(--neon-red); border-color:var(--neon-red); width:100%;">🗑️ مسح محتوى الصفحة</button>
            </div>
        </div>
    `;

    // إعدادات الرسم
    let penColor = '#000000';
    let penWidth = 5;
    let isDrawing = false;

    // تفعيل زر الإعدادات
    topNav.querySelector('#toggleToolsBtn').onclick = () => {
        toolbar.classList.toggle('active');
    };

    // دوال المساعدة (Global Scope داخل الدالة)
    window.setTool = (tool) => {
        currentTool = tool;
        toolbar.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        if(tool === 'pen') toolbar.querySelector('#btnPen').classList.add('active');
        if(tool === 'rect') toolbar.querySelector('#btnRect').classList.add('active');
        if(tool === 'circle') toolbar.querySelector('#btnCircle').classList.add('active');
        if(tool === 'move') toolbar.querySelector('#btnMove').classList.add('active');
        if(tool === 'eraser') toolbar.querySelector('#btnEraser').classList.add('active');
    };

    window.setColor = (color) => {
        penColor = color;
        toolbar.querySelector('#customColor').value = color;
    };

    window.setBg = (color) => {
        pages[currentPageIndex].bgImage = null;
        pages[currentPageIndex].bgColor = color;
        if (!isPdfMode && typeof redraw === 'function') redraw();
    };

    // إعدادات الأدوات
    toolbar.querySelector('#customColor').onchange = (e) => penColor = e.target.value;
    toolbar.querySelector('#penSize').oninput = (e) => penWidth = e.target.value;
    
    // في حالة نظام PDF، نستخدم iframe للعرض المباشر
    if (isPdfMode) {
        boardSystem.appendChild(topNav);
        const iframe = document.createElement('iframe');
        iframe.src = currentPdfUrl;
        iframe.type = "application/pdf";
        iframe.style.width = '100%';
        iframe.style.height = 'calc(100% - 40px)';
        iframe.style.border = 'none';
        iframe.setAttribute('allow', 'fullscreen');
        boardSystem.appendChild(iframe);
        
        boardSystem.appendChild(toolbar);
        return;
    }

    // 3. إنشاء حاوية الكانفاس والكانفاس نفسه
    const container = document.createElement('div');
    container.className = 'canvas-container';
    canvas = document.createElement('canvas');
    canvas.id = 'drawingCanvas';
    container.appendChild(canvas);
    container.appendChild(topNav); // إضافة الشريط العلوي
    container.appendChild(toolbar); // إضافة الشريط الجانبي

    boardSystem.appendChild(container);

    ctx = canvas.getContext('2d');
    
    // ضبط الأبعاد
    if (currentResizeHandler) {
        window.removeEventListener('resize', currentResizeHandler);
    }

    currentResizeHandler = () => {
        if (!canvas || !canvas.parentElement) return;
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
        redraw();
    };
    
    window.addEventListener('resize', currentResizeHandler);
    setTimeout(currentResizeHandler, 50); // استدعاء أولي
    
    document.getElementById('clearBtn').onclick = () => {
        drawPaths = [];
        placedImages = [];
        saveCurrentPage();
        redraw();
    };

    // منطق الصفحات
    function loadPage(index) {
        drawPaths = pages[index].paths;
        placedImages = pages[index].images;
        currentPageIndex = index;
        // التأكد من وجود لون خلفية افتراضي
        if (!pages[index].bgColor) pages[index].bgColor = '#f4f4f9';
        updatePageIndicator();
        if(typeof redraw === 'function') redraw();
    }

    function saveCurrentPage() {
        // تحديث المسارات والصور فقط للحفاظ على الخلفية الموجودة
        pages[currentPageIndex].paths = drawPaths;
        pages[currentPageIndex].images = placedImages;
    }

    function updatePageIndicator() {
        document.getElementById('pageIndicator').innerText = `${currentPageIndex + 1} / ${pages.length}`;
    }

    document.getElementById('prevPageBtn').onclick = () => {
        if (currentPageIndex > 0) {
            loadPage(currentPageIndex - 1);
        }
    };

    document.getElementById('nextPageBtn').onclick = () => {
        if (currentPageIndex === pages.length - 1) {
            pages.push({ paths: [], images: [], bgColor: '#f4f4f9', bgImage: null });
        }
        loadPage(currentPageIndex + 1);
    };

    // التعامل مع الصور
    const handleImage = (input, isBg) => {
        input.onchange = (e) => {
            const file = e.target.files[0];
            if(!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    if(isBg) {
                        pages[currentPageIndex].bgImage = img;
                        redraw();
                    } else {
                        // إضافة صورة ككائن قابل للتحريك
                        // حساب حجم مناسب للصورة (تصغيرها إذا كانت كبيرة)
                        const baseSize = 250;
                        const scale = Math.min(baseSize / img.width, baseSize / img.height, 1);
                        const w = img.width * scale;
                        const h = img.height * scale;

                        placedImages.push({
                            img: img,
                            x: (canvas.width - w) / 2,
                            y: (canvas.height - h) / 2,
                            width: w,
                            height: h
                        });
                        setTool('move'); // تفعيل أداة التحريك تلقائياً
                        redraw();
                    }
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
            input.value = ''; // تفريغ الإدخال للسماح باختيار نفس الملف مرة أخرى
        };
    };

    handleImage(document.getElementById('bgImgInput'), true);
    handleImage(document.getElementById('addImgInput'), false);

    // إنشاء كانفاس مؤقت (طبقة الرسم) لمعالجة الممحاة بشكل صحيح دون التأثير على الخلفية
    const inkCanvas = document.createElement('canvas');
    const inkCtx = inkCanvas.getContext('2d');

    // --- المحرك الرئيسي للسبورة (Redraw Loop) ---
    function redraw() {
        // تحديث أبعاد طبقة الرسم لتطابق السبورة
        if (inkCanvas.width !== canvas.width || inkCanvas.height !== canvas.height) {
            inkCanvas.width = canvas.width;
            inkCanvas.height = canvas.height;
        }

        // 1. مسح السبورة
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const page = pages[currentPageIndex];

        // 2. رسم الخلفية
        if (page && page.bgImage) {
            ctx.drawImage(page.bgImage, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = (page && page.bgColor) ? page.bgColor : '#f4f4f9';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // 3. رسم الصور المضافة (الطبقة الوسطى)
        placedImages.forEach(obj => {
            ctx.drawImage(obj.img, obj.x, obj.y, obj.width, obj.height);
            
            // رسم إطار حول الصورة المحددة
            if (obj === selectedImage) {
                ctx.strokeStyle = '#00f3ff';
                ctx.lineWidth = 3;
                ctx.setLineDash([10, 5]); // إطار متقطع
                ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
                ctx.setLineDash([]); // إعادة الخط لمتصل

                // رسم مقبض تغيير الحجم (دائرة في الزاوية اليمنى السفلى)
                ctx.beginPath();
                ctx.fillStyle = '#00f3ff';
                ctx.arc(obj.x + obj.width, obj.y + obj.height, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.closePath();
            }
        });

        // 4. رسم الخطوط على الطبقة المؤقتة (Ink Layer)
        inkCtx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
        inkCtx.lineCap = 'round';
        inkCtx.lineJoin = 'round';

        drawPaths.forEach(path => {
            inkCtx.beginPath();
            
            // تفعيل وضع المسح أو الرسم
            if (path.mode === 'erase') {
                inkCtx.globalCompositeOperation = 'destination-out';
                inkCtx.lineWidth = path.width;
            } else {
                inkCtx.globalCompositeOperation = 'source-over';
                inkCtx.strokeStyle = path.color;
                inkCtx.lineWidth = path.width;
            }
            
            if (path.type === 'rect') {
                inkCtx.rect(path.x, path.y, path.w, path.h);
                inkCtx.stroke();
            } else if (path.type === 'circle') {
                inkCtx.arc(path.x, path.y, path.r, 0, 2 * Math.PI);
                inkCtx.stroke();
            } else {
                // رسم حر (القلم)
                if (path.points && path.points.length > 0) {
                    inkCtx.moveTo(path.points[0].x, path.points[0].y);
                    for (let i = 1; i < path.points.length; i++) {
                        inkCtx.lineTo(path.points[i].x, path.points[i].y);
                    }
                    inkCtx.stroke();
                }
            }
        });

        // 5. دمج طبقة الرسم مع السبورة الرئيسية
        ctx.drawImage(inkCanvas, 0, 0);
    }

    // --- معالجة الأحداث (الماوس واللمس) ---
    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        if (e.touches) {
            return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        }
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function startPos(e) {
        e.preventDefault();
        const pos = getPos(e);

        if (currentTool === 'move') {
            // 1. التحقق من مقبض تغيير الحجم أولاً
            if (selectedImage) {
                const handleX = selectedImage.x + selectedImage.width;
                const handleY = selectedImage.y + selectedImage.height;
                if (Math.abs(pos.x - handleX) <= 15 && Math.abs(pos.y - handleY) <= 15) {
                    isResizing = true;
                    startX = pos.x;
                    startY = pos.y;
                    return;
                }
            }

            // التحقق من النقر فوق صورة (بالترتيب العكسي لاختيار الصورة العلوية)
            selectedImage = null;
            
            for (let i = placedImages.length - 1; i >= 0; i--) {
                const obj = placedImages[i];
                if (pos.x >= obj.x && pos.x <= obj.x + obj.width && pos.y >= obj.y && pos.y <= obj.y + obj.height) {
                    selectedImage = obj;
                    isDragging = true;
                    startX = pos.x - obj.x;
                    startY = pos.y - obj.y;
                    
                    // إعادة ترتيب الصورة لتصبح في الأعلى
                    placedImages.splice(i, 1);
                    placedImages.push(obj);
                    break;
                }
            }
            redraw();
        } else {
            // بدء الرسم
            isDrawing = true;
            
            let type = 'free';
            if (currentTool === 'rect') type = 'rect';
            if (currentTool === 'circle') type = 'circle';

            const page = pages[currentPageIndex];

            const newPath = {
                type: type,
                mode: currentTool === 'eraser' ? 'erase' : 'draw', // تحديد الوضع (رسم أو مسح)
                color: penColor,
                width: currentTool === 'eraser' ? 20 : penWidth,
                points: [], x: 0, y: 0, w: 0, h: 0, r: 0
            };

            ctx.beginPath(); // ضمان عدم اتصال الخطوط القديمة بالجديدة
            if (type === 'free') newPath.points = [{x: pos.x, y: pos.y}];
            else { newPath.x = pos.x; newPath.y = pos.y; }

            drawPaths.push(newPath);
            if (type === 'free') draw(e); // رسم نقطة فورية للقلم
        }
    }
    
    function endPos() {
        isDrawing = false;
        isDragging = false;
        isResizing = false;
        saveCurrentPage(); // حفظ التغييرات عند رفع اليد
    }
    
    function draw(e) {
        e.preventDefault();
        const pos = getPos(e);

        if (isResizing && selectedImage) {
            // حساب الحجم الجديد بناءً على حركة الماوس
            const dx = pos.x - startX;
            const dy = pos.y - startY;
            selectedImage.width = Math.max(20, selectedImage.width + dx); // منع الصورة من أن تصبح صغيرة جداً
            selectedImage.height = Math.max(20, selectedImage.height + dy);
            startX = pos.x;
            startY = pos.y;
            redraw();
        } else if (isDragging && selectedImage) {
            selectedImage.x = pos.x - startX;
            selectedImage.y = pos.y - startY;
            redraw();
        } else if (isDrawing) {
            const currentPath = drawPaths[drawPaths.length - 1];
            
            if (currentPath.type === 'rect') {
                currentPath.w = pos.x - currentPath.x;
                currentPath.h = pos.y - currentPath.y;
            } else if (currentPath.type === 'circle') {
                const dx = pos.x - currentPath.x;
                const dy = pos.y - currentPath.y;
                currentPath.r = Math.sqrt(dx*dx + dy*dy);
            } else {
                // إضافة النقطة للمسار الحالي (حر)
                currentPath.points.push({x: pos.x, y: pos.y});
            }
            redraw();
        }
    }

    canvas.addEventListener('mousedown', startPos);
    canvas.addEventListener('mouseup', endPos);
    canvas.addEventListener('mousemove', draw);
    
    // أحداث اللمس للموبايل
    canvas.addEventListener('touchstart', startPos, {passive: false});
    canvas.addEventListener('touchend', endPos);
    canvas.addEventListener('touchmove', draw, {passive: false});

    // تحميل الصفحة الحالية عند البدء
    loadPage(currentPageIndex);
}