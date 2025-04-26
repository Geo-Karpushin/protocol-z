// ENGINE \\

let canvas = undefined

let MIN_POINT_PX = undefined;
let CONST_DELTA_X = undefined;
let DELTA_X = 0;
let CONST_DELTA_Y = undefined;
let DELTA_Y = 0;
let SCALE = 1;

let ctx = undefined;

let RENDER_OBJECTS = [];
let RENDER_MENU = [
    {
        x: 50, // Центр верхней границы по X
        y: 20, // Верхняя позиция по Y
        items: [
            [{
                type: "text",
                text: "Главное меню",
                fontStyle: "bold",
                font: "Arial",
                fontSize: 24
            }],
            [{
                type: "button",
                text: "Начать игру",
                fontSize: 124,
                font: "Arial",
                act: () => {console.log(123);}
            }],
            [{
                type: "progressbar",
                height: 40,
                width: 4,
                value: 65,
                max: 100
            }]
        ]
    }
];
let BUTTONS = [];
// let RENDER_MENU = [];

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
    console.log(x, y, rect_x, rect_y, rect_w, rect_h)
    return x > rect_x && x < rect_x + rect_w && y < rect_y + rect_h && y > rect_y
}

function renderM(menu) {
    ctx.save();

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

    BUTTONS = [];

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
        fcolor: config.bgColor
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
                    BUTTONS.push({x: currentX, y: elemY, w: elem.width, h: elem.height, do: elem.act})
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
let SCORE = 0;

let IS_MOUSE_PRESSED = false;

let MS_PER_TICK = 1000;

let PLANES = {
};

RENDER_OBJECTS.push({type: "circle", scolor: "#aaa", x: 50, y: 50, r: 95, life: Infinity});  

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
})

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
        if (!isInsideRect(e.offsetX / MIN_POINT_PX * 100, e.offsetY / MIN_POINT_PX * 100, BUTTONS[i].x, BUTTONS[i].y, BUTTONS[i].w, BUTTONS[i].h)) continue;
        BUTTONS[i].do();
        break;
    }

    if (!CHECK_COLLISION(CLIENT_X, CLIENT_Y, 50, 50, 0.95 * 50)) return;
    if (PRE_PLANE_UNDER_CONTROL != "" && PRE_PLANE_UNDER_CONTROL != PLANE_UNDER_CONTROL) {
        PLANE_UNDER_CONTROL = PRE_PLANE_UNDER_CONTROL;
        return;
    }
    if (PLANE_UNDER_CONTROL == "") return;
    PLANES[PLANE_UNDER_CONTROL].to = GET_ALGLE(CLIENT_X, CLIENT_Y, PLANES[PLANE_UNDER_CONTROL].cur.x, PLANES[PLANE_UNDER_CONTROL].cur.y);
    VOCALIZE(`Flight ${PLANE_UNDER_CONTROL.split("").join(" ")}, vector to ${Math.round((180 + PLANES[PLANE_UNDER_CONTROL].to)/10)}`);
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
    RENDER_OBJECTS.push({type: "text", fcolor: "#fff", text: `SCORE: ${SCORE}`, x: 90, y: 10, life: 1});
    PRE_PLANE_UNDER_CONTROL = "";
    for (plane in PLANES) {
        // if (PLANES[plane].uc && !CHECK_COLLISION(PLANES[plane].cur.x, PLANES[plane].cur.y, 50, 50, 0.9 * 50)) {
        //     VOCALIZE(`ATC, flight ${PLANES[plane].name} is going to leave your airspace..`);
        //     PLANES[plane].uc = false;
        // } else if (!PLANES[plane].uc && CHECK_COLLISION(PLANES[plane].cur.x, PLANES[plane].cur.y, 50, 50, 0.9 * 50)) {
        //     PLANES[plane].uc = true;
        // } else if (!PLANES[plane].uc && CHECK_COLLISION(PLANES[plane].cur.x, PLANES[plane].cur.y, 50, 50, 0.95 * 50)) {
        //     VOCALIZE(`Good morning ATC, flight ${PLANES[plane].name} entering your airspace`);
        // }
        // let d = (-180 >= PLANES[plane].to <= 0 ? PLANES[plane].to : -)- PLANES[plane].a;
        PLANES[plane].a = TURN(PLANES[plane].a, PLANES[plane].to, PLANES[plane].da, undefined);

        PLANES[plane].cur.x += Math.cos(PLANES[plane].a * Math.PI / 180) * PLANES[plane].speed;
        PLANES[plane].cur.y += Math.sin(PLANES[plane].a * Math.PI / 180) * PLANES[plane].speed;
        for (plane2 in PLANES) {
            if (plane == plane2) continue;
            if (CHECK_COLLISION(PLANES[plane].cur.x, PLANES[plane].cur.y, PLANES[plane2].cur.x, PLANES[plane2].cur.y, 2)) {
                RENDER_OBJECTS.push({type: "rect", fcolor: "#f00", x: PLANES[plane].cur.x, y: PLANES[plane].cur.y, w: 0.4, h: 0.4, life: 1});
                RENDER_OBJECTS.push({type: "circle", scolor: "#f00", x: PLANES[plane].cur.x, y: PLANES[plane].cur.y, r: 2, life: 1});
                RENDER_OBJECTS.push({type: "rect", fcolor: "#f00", x: PLANES[plane2].cur.x, y: PLANES[plane2].cur.y, w: 0.4, h: 0.4, life: 1});
                RENDER_OBJECTS.push({type: "circle", scolor: "#f00", x: PLANES[plane2].cur.x, y: PLANES[plane2].cur.y, r: 2, life: 1});
                render();
                MS_PER_TICK = Infinity;
            }
        }
        if (CHECK_COLLISION(PLANES[plane].cur.x, PLANES[plane].cur.y, 50, 50, 0.95 * 50)) {
            SCORE++;
        }
        RENDER_OBJECTS.push({type: "text", fcolor: "#0f0", text: plane, x: PLANES[plane].cur.x - 1, y: PLANES[plane].cur.y - 1, life: 1});
        RENDER_OBJECTS.push({type: "circle", scolor: "#0f0", x: PLANES[plane].cur.x, y: PLANES[plane].cur.y, r: 2, life: 1});
        RENDER_OBJECTS.push({type: "rect", fcolor: (plane == PLANE_UNDER_CONTROL ? "#0f0" : (plane == PRE_PLANE_UNDER_CONTROL ? "#008080" : "#006400")), x: PLANES[plane].cur.x - 0.2, y: PLANES[plane].cur.y - 0.2, w: 0.4, h: 0.4, life: 1});
        RENDER_OBJECTS.push({type: "rect", fcolor: "#0f0", x: PLANES[plane].cur.x, y: PLANES[plane].cur.y, w: 0.2, h: 0.2, life: 5});
        RENDER_OBJECTS.push({type: "line", scolor: "#ff0", x: PLANES[plane].cur.x, y: PLANES[plane].cur.y, tx: PLANES[plane].cur.x + Math.cos(PLANES[plane].to * Math.PI / 180) * PLANES[plane].speed * 2.5, ty: PLANES[plane].cur.y + Math.sin(PLANES[plane].to * Math.PI / 180) * PLANES[plane].speed * 2.5, life: 1});
        RENDER_OBJECTS.push({type: "line", scolor: "#0f0", x: PLANES[plane].cur.x, y: PLANES[plane].cur.y, tx: PLANES[plane].cur.x + Math.cos(PLANES[plane].a * Math.PI / 180) * PLANES[plane].speed * 2.5, ty: PLANES[plane].cur.y + Math.sin(PLANES[plane].a * Math.PI / 180) * PLANES[plane].speed * 2.5, life: 1});
    }
    for (plane in PLANES) {
        if (CHECK_COLLISION(CLIENT_X, CLIENT_Y, 50, 50, 0.95 * 50) && CHECK_COLLISION(CLIENT_X, CLIENT_Y, PLANES[plane].cur.x, PLANES[plane].cur.y, 3)) {
            RENDER_OBJECTS.push({type: "circle", fcolor: "#008080", x: PLANES[plane].cur.x, y: PLANES[plane].cur.y, r: 3, life: 1});
            PRE_PLANE_UNDER_CONTROL = plane;
            break;
        }
    };
    if (SPAWN_DELAY_TICKS <= 0) {
        SUMMON_NEW_PLANE();
    }
    render();
    SPAWN_DELAY_TICKS -= 1;
    timer = setTimeout(run, MS_PER_TICK);
}, MS_PER_TICK);

render();