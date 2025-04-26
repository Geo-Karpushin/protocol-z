// ENGINE \\

let canvas = undefined

let MIN_POINT_PX = undefined;
let CONST_DELTA_X = undefined;
let DELTA_X = 0;
let CONST_DELTA_Y = undefined;
let DELTA_Y = 0;
let SCALE = 1;

let ctx = undefined;

let TURRETS = [];
let BOXES = [];
let BULLETS = [];
let RENDER_OBJECTS = [];
let RENDER_MENU = [
    {
        pos: "rel",
        x: 50,
        y: 30,
        id: "gameover",
        visiable: false,
        items: [
            [{
                type: "text",
                text: "GAME OVER",
                fontStyle: "bold",
                font: "Arial",
                fontSize: 100
            }],
            [{
                type: "text",
                text: "Результат:",
                fontStyle: "bold",
                font: "Arial",
                fontSize: 60
            },
            {
                type: "text",
                text: "100",
                fontStyle: "bold",
                font: "Arial",
                fontSize: 60
            }],
            [{
                type: "button",
                text: "Заново",
                fontSize: 124,
                font: "Arial",
                act: () => {location.reload();}
            }]
        ]
    },
    {
        pos: "rel",
        x: 50,
        y: 0,
        id: "score",
        bgColor: "#00000000",
        visiable: true,
        items: [
            [{
                type: "text",
                text: "SCORE:",
                fontSize: 16,
                color: "#fff"
            },
            {
                type: "text",
                text: "0",
                fontSize: 16,
                color: "#fff"
            }],
            [{
                type: "text",
                text: "Здоровье:",
                font: "Arial",
                fontSize: 10
            },
            {
                type: "progressbar",
                height: 2,
                width: 30,
                value: 100,
                max: 100
            }]
        ]
    }
];
let BUTTONS = [];

const UI_STATE = {
    hoveredElement: null,
};

function CONVERT_ANGLE(x) { return ((x + 360) % 360); }

function NORMALIZE_ANGLE(x) { x = CONVERT_ANGLE(x); return x > 180 ? x - 360 : x; }

function GET_ALGLE(cx1, cy1, cx2, cy2) {
    let delta = Math.round(Math.atan((cx1 - cx2)/(cy1 - cy2)) * 180 / Math.PI);
    let to = ((cy1 >= cy2) ? 90 - delta : -delta - 90) % 180;
    return to
}

function CHECK_COLLISION(x1, y1, x2, y2, r){
    return Math.sqrt((x1 - x2)**2 + (y1 - y2)**2) <= r
}

function renderO(object) {
    ctx.save();

    ctx.fillStyle = "fcolor" in object ? object.fcolor : "#fff";
    ctx.strokeStyle = "scolor" in object ? object.scolor : "#fff";
    // All x and y here are precent of the game field height/width, where (0, 0) are left top and (100, 100) are right bottom
    switch(object.type){
        case "rect":
            // {type: "rect", fcolor: "#...", x: x, y: y, w: weight, h: height, *life: ticks} 
            ctx.fillRect(((object.x) / 100 * MIN_POINT_PX)*SCALE - DELTA_X + CONST_DELTA_X, ((object.y) / 100 * MIN_POINT_PX)*SCALE - DELTA_Y + CONST_DELTA_Y, object.w*SCALE / 100 * MIN_POINT_PX, object.h*SCALE / 100 * MIN_POINT_PX);
            break;
        case "text":
            // {type: "text", fcolor: "#...", text: "text", x: x, y: y, font: "font name", fontSize: size, fontStyle: "style", *life: ticks}
            if ("align" in object) ctx.textAlign = object.align;
            if ("baseline" in object) ctx.textBaseline = object.baseline;
            let font = (object.fontSize || 10) * SCALE + "px ";
            font += (object.font || "Arial");
            font += " " + (object.fontStyle || "");
            ctx.font = font;
            ctx.fillText(
                object.text, 
                (object.x / 100 * MIN_POINT_PX) * SCALE - DELTA_X + CONST_DELTA_X,
                (object.y / 100 * MIN_POINT_PX) * SCALE - DELTA_Y + CONST_DELTA_Y
            );
            break;
        case "circle":
            // {type: "circle", scolor: "#...", x: x, y: y, r: radius, *life: ticks}
            ctx.beginPath();
            ctx.arc((object.x / 100 * MIN_POINT_PX)*SCALE - DELTA_X + CONST_DELTA_X, (object.y / 100 * MIN_POINT_PX)*SCALE - DELTA_Y + CONST_DELTA_Y, SCALE*object.r / 100 * MIN_POINT_PX / 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.closePath();
            ctx.stroke();
            break;
        case "line":
            // {type: "line", scolor: "#...", x: x, y: y, tx: target_x, ty: target_y, *life: ticks}
            ctx.beginPath();
            ctx.moveTo((object.x / 100 * MIN_POINT_PX)*SCALE - DELTA_X + CONST_DELTA_X, (object.y / 100 * MIN_POINT_PX)*SCALE - DELTA_Y + CONST_DELTA_Y);
            ctx.lineTo((object.tx / 100 * MIN_POINT_PX)*SCALE - DELTA_X + CONST_DELTA_X, (object.ty / 100 * MIN_POINT_PX)*SCALE - DELTA_Y + CONST_DELTA_Y);
            ctx.closePath();
            ctx.stroke();
            break;
    };
    //*life - count of ticks for game (in script.js). Not used in engine.
    ctx.restore();
}

function isInsideRect(x, y, rect_x, rect_y, rect_w, rect_h) {
    return x > rect_x && x < rect_x + rect_w && y < rect_y + rect_h && y > rect_y
}

function renderM(menu) {
    if (!menu.visiable) return;

    ctx.save();

    if (menu.pos === "abs") {
        const config = {
            padding: 2,
            spacing: 1.5,
            progressBarSize: [40, 1],
            textColor: "#FFFFFF",
            buttonColor: "#3498db",
            bgColor: "rgba(0,0,0,0.8)",
            ...menu.config
        };

        let totalHeight = 0;
        let maxWidth = 0;
        const elements = [];

        menu.items.forEach(row => {
            let rowWidth = 0;
            let rowHeight = 0;
            
            row.forEach(element => {
                const elem = { type: element.type };

                ctx.font = (element.fontSize || 10) * SCALE + "px " + (element.font || "Arial") + " " + (element.fontStyle || "");
                let metrics = ctx.measureText(element.text || "");
                
                switch(element.type) {
                    case 'button':
                        elem.width = (metrics.width / (MIN_POINT_PX * SCALE)) * 100 + config.spacing * 2;
                        elem.height = ((element.fontSize || 10) / MIN_POINT_PX) * 100 + config.spacing * 2;
                        elem.act = element.act;
                        break;

                    case 'text':
                        elem.width = (metrics.width / (MIN_POINT_PX * SCALE)) * 100;
                        elem.height = ((element.fontSize || 10) / MIN_POINT_PX) * 100;
                        break;
                        
                    case 'progressbar':
                        elem.width = elem.width || config.progressBarSize[0];
                        elem.height = elem.height || config.progressBarSize[1];
                        break;
                }
                
                elements.push(elem);
                rowWidth += elem.width;
                rowHeight = Math.max(rowHeight, elem.height);
            });

            maxWidth = Math.max(maxWidth, rowWidth + (row.length - 1) * config.spacing);
            totalHeight += rowHeight + config.spacing;
        });

        const menuWidth = maxWidth + 2 * config.padding;
        const menuHeight = totalHeight + 2 * config.padding;
        const startX = menu.x - menuWidth / 2;
        const startY = menu.y;

        renderO({
            type: "rect",
            x: startX,
            y: startY,
            w: menuWidth,
            h: menuHeight,
            fcolor: menu.bgColor || config.bgColor
        });

        let currentY = startY + config.padding;
        let elementIndex = 0;

        menu.items.forEach((row) => {
            let currentX = startX + config.padding;
            const rowHeight = Math.max(...row.map(() => elements[elementIndex].height));

            row.forEach((element) => {
                const elem = elements[elementIndex];
                const elemY = currentY + (rowHeight - elem.height) / 2;

                switch(element.type) {
                    case 'text':
                        renderO({
                            type: "text",
                            text: element.text,
                            x: currentX + elem.width/2,
                            y: elemY + elem.height/2,
                            fcolor: config.textColor,
                            align: "center",
                            baseline: "middle",
                            font: element.font,
                            fontSize: element.fontSize,
                            fontStyle: element.fontStyle
                        });
                        break;

                    case 'button':
                        renderO({
                            type: "rect",
                            x: currentX,
                            y: elemY,
                            w: elem.width,
                            h: elem.height,
                            fcolor: UI_STATE.hoveredElement === elementIndex 
                                ? "#2980b9" 
                                : config.buttonColor
                        });

                        renderO({
                            type: "text",
                            text: element.text,
                            x: currentX + elem.width/2,
                            y: elemY + elem.height/2,
                            fcolor: config.textColor,
                            align: "center",
                            baseline: "middle",
                            font: element.font,
                            fontSize: element.fontSize,
                            fontStyle: element.fontStyle
                        });
                        BUTTONS.push({x: currentX, y: elemY, w: elem.width, h: elem.height, do: elem.act});
                        break;

                    case 'progressbar':
                        renderO({
                            type: "rect",
                            x: currentX,
                            y: elemY,
                            w: elem.width,
                            h: elem.height,
                            fcolor: "#2c3e50"
                        });

                        renderO({
                            type: "rect",
                            x: currentX,
                            y: elemY,
                            w: (element.value / element.max) * elem.width,
                            h: elem.height,
                            fcolor: "#27ae60"
                        });
                        break;
                }

                currentX += elem.width + config.spacing;
                elementIndex++;
            });

            currentY += rowHeight + config.spacing;
        });
    } else if (menu.pos === "rel") {
        let elements = [];
        let totalWidth = 0;
        let totalHeight = 0;
        const padding = 2;
    
        menu.items.forEach(row => {
            let rowWidth = 0;
            let rowHeight = 0;
    
            row.forEach(element => {
                ctx.save();
                ctx.font = `${element.fontStyle || ""} ${element.fontSize / SCALE || 10}px ${element.font || "Arial"}`;
                
                let elem = { 
                    type: element.type,
                    width: 0,
                    height: 0
                };

                const metrics = ctx.measureText(element.text || "");
    
                switch(element.type) {
                    case 'text':
                        elem.width = ((metrics.width / MIN_POINT_PX) * 100 + padding) / SCALE;
                        elem.height = (element.fontSize) / SCALE / MIN_POINT_PX * 100;
                        break;
    
                    case 'button':
                        elem.width = (metrics.width / MIN_POINT_PX) * 100 / SCALE;
                        elem.height = (element.fontSize) / SCALE / MIN_POINT_PX * 100;
                        elem.act = element.act;
                        break;
    
                    case 'progressbar':
                        elem.width = (element.width || 30) / SCALE;
                        elem.height = (element.height || 2) / SCALE;
                        break;
                }
    
                elements.push(elem);
                rowWidth += elem.width;
                rowHeight = Math.max(rowHeight, elem.height);
                ctx.restore();
            });
    
            totalWidth = Math.max(totalWidth, rowWidth);
            totalHeight += rowHeight + padding / SCALE;
        });
    
        // Позиционирование меню (центр верхней границы)
        const menuX = (menu.x + (DELTA_X) / MIN_POINT_PX * 100) / SCALE - totalWidth / 2;
        const menuY = (menu.y + (DELTA_Y) / MIN_POINT_PX * 100) / SCALE;
    
        // Отрисовка фона
        renderO({
            type: "rect",
            x: menuX,
            y: menuY,
            w: totalWidth + padding * 2 / SCALE,
            h: totalHeight + padding * 2 / SCALE,
            fcolor: menu.bgColor || "rgba(0,0,0,0.7)"
        });
    
        // Рендер элементов
        let currentY = menuY + padding / SCALE;
        let elementIndex = 0;
    
        menu.items.forEach(row => {
            let currentX = menuX + padding / SCALE;
            const rowHeight = Math.max(...row.map(() => elements[elementIndex].height));
    
            row.forEach(element => {
                const elem = elements[elementIndex++];
    
                const elemPos = {
                    x: currentX,
                    y: currentY + (rowHeight - elem.height) / 2
                };
    
                switch(element.type) {
                    case 'text':
                        renderO({
                            type: "text",
                            text: element.text,
                            x: elemPos.x + elem.width / 2,
                            y: elemPos.y + elem.height / 2,
                            fcolor: element.color || "#FFF",
                            align: "center",
                            baseline: "middle",
                            font: element.font,
                            fontSize: element.fontSize / SCALE,
                            fontStyle: element.fontStyle
                        });
                        break;
    
                    case 'button':
                        renderO({
                            type: "rect",
                            x: elemPos.x,
                            y: elemPos.y,
                            w: elem.width,
                            h: elem.height,
                            fcolor: element.bgColor || "#3498db"
                        });

                        renderO({
                            type: "text",
                            text: element.text,
                            x: elemPos.x + elem.width / 2,
                            y: elemPos.y + elem.height / 2,
                            fcolor: element.color || "#FFF",
                            align: "center",
                            baseline: "middle",
                            font: element.font,
                            fontSize: element.fontSize / SCALE
                        });
                        
                        BUTTONS.push({x: elemPos.x, y: elemPos.y, w: elem.width, h: elem.height, do: elem.act});
                        break;
    
                    case 'progressbar':
                        renderO({
                            type: "rect",
                            x: elemPos.x,
                            y: elemPos.y,
                            w: elem.width,
                            h: elem.height,
                            fcolor: element.bgColor || "#2c3e50"
                        });
    
                        renderO({
                            type: "rect",
                            x: elemPos.x,
                            y: elemPos.y,
                            w: (element.value / element.max) * elem.width,
                            h: elem.height,
                            fcolor: element.color || "#27ae60"
                        });
                        break;
                }
    
                currentX += elem.width + padding / SCALE;
            });
    
            currentY += rowHeight + padding / SCALE;
        });
    }

    ctx.restore();
}



// canvas.addEventListener('mousemove', (e) => {
//     checkHover(у.offsetX, e.offsetY);
//     if(UI_STATE.activeMenu) renderM(UI_STATE.activeMenu);
// });

function getCanvasCoords(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) / (rect.width / canvas.width),
        y: (e.clientY - rect.top) / (rect.height / canvas.height)
    };
}

function checkHover(x, y) {
    const coords = convertToGameCoords(x, y);
    UI_STATE.hoveredElement = null;

    for(let i = 0; i < UI_STATE.elementsCache.length; i++) {
        const elem = UI_STATE.elementsCache[i];
        if(coords.x >= elem.x &&
           coords.x <= elem.x + elem.w &&
           coords.y >= elem.y &&
           coords.y <= elem.y + elem.h) {
            UI_STATE.hoveredElement = i;
            break;
        }
    }
}

function convertToGameCoords(x, y) {
    return {
        x: (x / (MIN_POINT_PX * SCALE)) * 100 + DELTA_X - CONST_DELTA_X,
        y: (y / (MIN_POINT_PX * SCALE)) * 100 + DELTA_Y - CONST_DELTA_Y
    };
}

function render() {
    BUTTONS = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < RENDER_OBJECTS.length; i++){
        renderO(RENDER_OBJECTS[i]);
    }
    for (let i = 0; i < RENDER_MENU.length; i++){
        renderM(RENDER_MENU[i]);
    }
}

// SCRIPT \\

canvas = document.getElementById("canvas");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

ctx = canvas.getContext('2d');

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";

MIN_POINT_PX = Math.min(window.innerWidth, window.innerHeight);
let MAX_POINT_PX = Math.sqrt(Math.max(window.innerWidth, window.innerHeight)**2 + MIN_POINT_PX**2);
CONST_DELTA_X = (canvas.width  - MIN_POINT_PX) / 2;
CONST_DELTA_Y = (canvas.height - MIN_POINT_PX) / 2;

let PLANE_UNDER_CONTROL = "";
let PRE_PLANE_UNDER_CONTROL = "";
let SPAWN_DELAY_TICKS = 0;
let CLIENT_X = 0;
let PREVIOUS_CLIENT_X = 0;
let CLIENT_Y = 0;
let PREVIOUS_CLIENT_Y = 0;
let IS_MOUSE_PRESSED = false;

let MS_PER_TICK = 50;

let TURRET_SPAWN_COOLDOWN = 1 * 1000 / MS_PER_TICK;
let lastTurretSpawnAttempt = 0;
let TURRET_SPAWN_CHANCE = 1;

let BASE = {hp: 100, bots: 0, res: 0, exp: 0}
let PLANES = {
};

RENDER_OBJECTS.push({type: "circle", scolor: "#aaa", fcolor: "#42aaff", x: 50, y: 50, r: 5, life: Infinity});  

function ADD_PLANE(x, y, speed, a, da, to) {
    let maxn = ALPHABET.length - 10;
    let name = "";
    do {
        for (let i = 0; i < 3; i++) {
            name += ALPHABET[Math.round(Math.random() * maxn)];
            if (i == 0) {
                maxn += 9;
            }
        }
    } while (name in PLANES)
    PLANES[name] = {cur: {x: x, y: y}, speed: speed, a: a, da: da, to: to};
}

function VOCALIZE(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.VOCALIZE = window.speechSynthesis.getVoices()[1];
    window.speechSynthesis.speak(utterance);
}

function SUMMON_NEW_PLANE(centralX = 0, centralY = 0) {
    SPAWN_DELAY_TICKS = Math.round(Math.random() * 50);
    let a = Math.round(180 * (Math.random()*2 - 1));
    ADD_PLANE((0.5 * (MIN_POINT_PX + MAX_POINT_PX * Math.cos(a / 180 * Math.PI - Math.PI))) / MIN_POINT_PX * 100 + centralX, (0.5 * (MIN_POINT_PX + MAX_POINT_PX * Math.sin(a / 180 * Math.PI - Math.PI))) / MIN_POINT_PX * 100 + centralY, 0.2 + Math.round(Math.random() * 10) / 10, a, 5 + Math.random()*30, a);
}

function TURN(a, b, da, isleft = undefined) {
    at = CONVERT_ANGLE(a - b)
    bt = CONVERT_ANGLE(b - a);
    if (isleft === undefined) isleft = (bt <= at ? true : false)
    return NORMALIZE_ANGLE(a + Math.min(da, Math.abs(a - b)) * (isleft ? 1 : -1))
}

window.addEventListener("mousedown", () => {
    IS_MOUSE_PRESSED = true;
});

window.addEventListener("mouseup", () => {
    IS_MOUSE_PRESSED = false;
});

window.addEventListener("resize", () => {
    DELTA_X /= MIN_POINT_PX;
    DELTA_Y /= MIN_POINT_PX;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    MIN_POINT_PX = Math.min(window.innerWidth, window.innerHeight);
    DELTA_X *= MIN_POINT_PX;
    DELTA_Y *= MIN_POINT_PX;
    MAX_POINT_PX = Math.sqrt(Math.max(window.innerWidth, window.innerHeight)**2 + MIN_POINT_PX**2);
    CONST_DELTA_X = (canvas.width - MIN_POINT_PX) / 2;
    CONST_DELTA_Y = (canvas.height - MIN_POINT_PX) / 2;
    // while (!CHECK_COLLISION(0.5*canvas.width, 0.5*canvas.height, 0.5*MIN_POINT_PX*SCALE - DELTA_X + CONST_DELTA_X, 0.5*MIN_POINT_PX*SCALE - DELTA_Y + CONST_DELTA_Y, SCALE*(MAX_POINT_PX - 0.95*MIN_POINT_PX)/2)){
    //     DELTA_X -= 0.1 * SCALE * MIN_POINT_PX;
    //     DELTA_Y -= 0.1 * SCALE * MIN_POINT_PX;
    // }
    render();
})

window.addEventListener("mousemove", (e) => {
    let NR_CLIENT_X = (e.offsetX - CONST_DELTA_X) / SCALE / MIN_POINT_PX * 100;
    let NR_CLIENT_Y = (e.offsetY - CONST_DELTA_Y) / SCALE / MIN_POINT_PX * 100;
    if (IS_MOUSE_PRESSED && e.which == 3){
        DELTA_X += (PREVIOUS_CLIENT_X - NR_CLIENT_X) * SCALE * MIN_POINT_PX / 100;
        DELTA_Y += (PREVIOUS_CLIENT_Y - NR_CLIENT_Y) * SCALE * MIN_POINT_PX / 100;
        if (!CHECK_COLLISION(0.5*canvas.width, 0.5*canvas.height, 0.5*MIN_POINT_PX*SCALE - DELTA_X + CONST_DELTA_X, 0.5*MIN_POINT_PX*SCALE - DELTA_Y + CONST_DELTA_Y, SCALE*0.95*MIN_POINT_PX/2)){
            DELTA_X -= (PREVIOUS_CLIENT_X - NR_CLIENT_X) * SCALE * MIN_POINT_PX / 100;
            DELTA_Y -= (PREVIOUS_CLIENT_Y - NR_CLIENT_Y) * SCALE * MIN_POINT_PX / 100;
        }
        render();
    }
    PREVIOUS_CLIENT_X = NR_CLIENT_X;
    PREVIOUS_CLIENT_Y = NR_CLIENT_Y;
    CLIENT_X = NR_CLIENT_X + DELTA_X / SCALE / MIN_POINT_PX * 100;
    CLIENT_Y = NR_CLIENT_Y + DELTA_Y / SCALE / MIN_POINT_PX * 100;
});

window.addEventListener("wheel", (e) => {
    if (IS_MOUSE_PRESSED) return;
    let newm = Math.min(5, Math.max(0.8, SCALE + -e.deltaY / 1000));
    DELTA_X -= 0.5 * (SCALE - newm) * MIN_POINT_PX;
    DELTA_Y -= 0.5 * (SCALE - newm) * MIN_POINT_PX;
    SCALE = newm;
    if (!CHECK_COLLISION(0.5*canvas.width, 0.5*canvas.height, 0.5*MIN_POINT_PX*SCALE - DELTA_X + CONST_DELTA_X, 0.5*MIN_POINT_PX*SCALE - DELTA_Y + CONST_DELTA_Y, SCALE*(MAX_POINT_PX - 0.95*MIN_POINT_PX)/2)){
        DELTA_X = 0;
        CLIENT_X = 0;
        DELTA_Y = 0;
        CLIENT_Y = 0;
    }
    render();
});

// game clicks
canvas.addEventListener("click", (e) => {
    for (let i = 0; i < BUTTONS.length; i++){
        if (!isInsideRect(CLIENT_X, CLIENT_Y, BUTTONS[i].x, BUTTONS[i].y, BUTTONS[i].w, BUTTONS[i].h)) continue;
        BUTTONS[i].do();
        break;
    }

    for (let i = 0; i < TURRETS.length; i++) {
        let turret = TURRETS[i];
        if (CHECK_COLLISION(CLIENT_X, CLIENT_Y, turret.x, turret.y, 2)) {
            turret.hp -= 10;
            if (turret.hp <= 0) {
                BASE.exp += 50;
                TURRETS.splice(i, 1);
            }
            break;
        }
    }

    for (let i = 0; i < BOXES.length; i++) {
        let box = BOXES[i];
        if (CHECK_COLLISION(CLIENT_X, CLIENT_Y, box.x, box.y, 2)) {
            box.hp -= 10;
            if (box.hp <= 0) {
                BASE.exp += 50;
                BOXES.splice(i, 1);
            }
            break;
        }
    }

    // for (let i = 0; i < TURRETS.length; i++) {
    //     let turret = TURRETS[i];
    //     if (CHECK_COLLISION(CLIENT_X, CLIENT_Y, turret.x, turret.y, 2)) {
    //         turret.hp -= 10; // Урон по турели
    //         if (turret.hp <= 0) {
    //             BASE.exp += 50; // Награда за уничтожение
    //             TURRETS.splice(i, 1);
    //         }
    //         break;
    //     }
    // }
});

let timer = setTimeout(function run() {
    if (MS_PER_TICK == Infinity) {
        timer = setTimeout(run, MS_PER_TICK);
        return;
    }
    for (let i = 0; i < RENDER_OBJECTS.length; i++){
        RENDER_OBJECTS[i].life -= 1;
        if (RENDER_OBJECTS[i].life <= 0){
            RENDER_OBJECTS.splice(i, 1);
            i -= 1;
        }
    }
    
    if (lastTurretSpawnAttempt <= 0) {
        if (Math.random() < TURRET_SPAWN_CHANCE) {
            spawnBox();
        }
        lastTurretSpawnAttempt = TURRET_SPAWN_COOLDOWN;
    } else {
        lastTurretSpawnAttempt--;
    }
    
    BASE.hp = Math.min(100, (BASE.hp + 0.1));
    TURRET_SPAWN_COOLDOWN = Math.max(TURRET_SPAWN_COOLDOWN - 0.01, 1);
    updateBase();

    // Обновляем турели
    updateTurrets();
    RENDER_MENU.find((e) => {return e.id == "score"}).items[0][1].text = `${BASE.exp}`;
    render();
    timer = setTimeout(run, MS_PER_TICK);
}, MS_PER_TICK);

function updateBase() {
    if (BASE.hp <= 0) {
        MS_PER_TICK = Infinity;
        RENDER_MENU.find((e) => {return e.id == "gameover"}).visiable = true;
        RENDER_MENU.find((e) => {return e.id == "gameover"}).items[1][1].text = BASE.exp;
    }

    RENDER_MENU.find((e) => {return e.id == "score"}).items[1][1].value = BASE.hp;
}

let ROBOTS_HP = {}; // Можно добавить роботов позже

// Функция для создания коробки
function spawnBox() {
    // Генерируем случайный угол для точки на границе экрана
    let a = Math.round(360 * Math.random());
    
    // Вычисляем координаты за пределами экрана (как в SUMMON_NEW_PLANE)
    let x = (0.5 * (MIN_POINT_PX + MAX_POINT_PX * Math.cos(a / 180 * Math.PI - Math.PI))) / MIN_POINT_PX * 100;
    let y = (0.5 * (MIN_POINT_PX + MAX_POINT_PX * Math.sin(a / 180 * Math.PI - Math.PI))) / MIN_POINT_PX * 100;
    
    // Случайная точка внутри круга (50,50 радиус 50)
    let targetX = 25 + (Math.random() * 50) + 1;
    let targetY = 25 + (Math.random() * 50) + 1;
    
    // Убедимся, что точка внутри круга
    while (Math.sqrt((targetX - 50)**2 + (targetY - 50)**2) > 50) {
        let targetX = 25 + (Math.random() * 50) + 1;
        let targetY = 25 + (Math.random() * 50) + 1;
    }
    
    // Угол движения к целевой точке
    let angle = Math.atan2(targetY - y, targetX - x) * 180 / Math.PI;
    
    BOXES.push({
        x: x,
        y: y,
        hp: 10,
        speed: 1,
        angle: angle,
        targetX: targetX,
        targetY: targetY,
        life: Infinity
    });
}

function spawnTurret(x, y) {
    TURRETS.push({
        x: x,
        y: y,
        hp: 30,
        angle: 0,
        lastShotTime: 0,
        fireRate: 1.5,
        bulletSpeed: 3,
        damage: 3
    });
}

function turretShoot(turret) {
    let currentTime = Date.now();
    if (currentTime - turret.lastShotTime < 1000 / turret.fireRate) return;
    
    turret.lastShotTime = currentTime;
    
    // Создаем пулю
    BULLETS.push({
        x: turret.x,
        y: turret.y,
        angle: turret.angle,
        speed: turret.bulletSpeed,
        damage: turret.damage,
        life: 100 // время жизни пули в тиках
    });
    
    // Звук выстрела (можно добавить позже)
    // playSound('turret_shot');
}

function updateTurrets() {
    // Обновляем коробки
    for (let i = BOXES.length - 1; i >= 0; i--) {
        let box = BOXES[i];
        
        // Проверяем, достигла ли коробка целевой точки
        let distanceToTarget = Math.sqrt((box.x - box.targetX)**2 + (box.y - box.targetY)**2);
        
        if (distanceToTarget > box.speed) {
            // Двигаем коробку к цели
            box.x += Math.cos(box.angle * Math.PI / 180) * box.speed;
            box.y += Math.sin(box.angle * Math.PI / 180) * box.speed;
        } else {
            // Коробка достигла цели - создаем турель
            spawnTurret(box.targetX, box.targetY);
            BOXES.splice(i, 1);
        }
    }

    for (let box of BOXES) {
        RENDER_OBJECTS.push({
            type: "rect",
            fcolor: "#8B4513", // коричневый цвет для коробок
            x: box.x - 1,
            y: box.y - 1,
            w: 2,
            h: 2,
            life: 1
        });
    }
    
    // Обновляем турели
    for (let i = TURRETS.length - 1; i >= 0; i--) {
        let turret = TURRETS[i];
        
        // Просто стреляем в игрока
        turret.angle = GET_ALGLE(50, 50, turret.x, turret.y);
        
        // Стрельба
        if (Date.now() - turret.lastShotTime > 1000 / turret.fireRate) {
            turret.lastShotTime = Date.now();
            BULLETS.push({
                x: turret.x,
                y: turret.y,
                angle: turret.angle,
                speed: turret.bulletSpeed,
                damage: turret.damage,
                life: 100
            });
        }
        
        // Визуализация
        RENDER_OBJECTS.push({
            type: "rect",
            fcolor: "#8B0000",
            x: turret.x - 1.5,
            y: turret.y - 1.5,
            w: 3,
            h: 3,
            life: 1
        });
    }
    
    // Обновляем пули
    for (let i = BULLETS.length - 1; i >= 0; i--) {
        let bullet = BULLETS[i];
        bullet.x += Math.cos(bullet.angle * Math.PI / 180) * bullet.speed;
        bullet.y += Math.sin(bullet.angle * Math.PI / 180) * bullet.speed;
        
        if (CHECK_COLLISION(bullet.x, bullet.y, 50, 50, 2)) {
            BASE.hp -= bullet.damage;
            updateBase();
            BULLETS.splice(i, 1);
            continue;
        }
        
        bullet.life--;
        if (bullet.life <= 0) BULLETS.splice(i, 1);
        
        RENDER_OBJECTS.push({
            type: "rect",
            fcolor: "#FF4500",
            x: bullet.x - 0.3,
            y: bullet.y - 0.3,
            w: 0.6,
            h: 0.6,
            life: 1
        });
    }
}

render();