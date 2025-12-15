// 全域變數

// 原人物 G (右邊移動角色 - 唯一可控制的角色)
let idleSpriteSheet;
let idleAnimation = [];
// 站立動畫規格
const IDLE_SPRITE_TOTAL_WIDTH = 510; 
const IDLE_FRAME_WIDTH = 65;         // 影格寬度 63+3
const IDLE_FRAME_HEIGHT = 94;        // 影格高度 94
const NUM_IDLE_FRAMES = 8;
const IDLE_ANIMATION_SPEED = 16; 

let walkSpriteSheet;
let walkAnimation = [];
const WALK_FRAME_WIDTH = 60;
const WALK_FRAME_HEIGHT = 112;
const NUM_WALK_FRAMES = 7;
const WALK_ANIMATION_SPEED = 4;  

// 角色狀態
let x, y; // 原人物 G 的位置 (可移動)
let centerCharX, leftCharX; // 中間和左邊角色的固定位置 (不可移動)
let characterSpeed = 3; 
let isWalkingRight = false; 
let isWalkingLeft = false;  
let facing = 1; 

// --- 新增角色 1 (中間靜止角色) ---
let newCharSpriteSheet;
let newCharAnimation = [];
const NEW_CHAR_SPRITE_TOTAL_WIDTH = 332;
const NEW_CHAR_FRAME_WIDTH_AVG = NEW_CHAR_SPRITE_TOTAL_WIDTH / 8; // 41.5
const NEW_CHAR_FRAME_HEIGHT = 39;
const NUM_NEW_CHAR_FRAMES = 8;
const NEW_CHAR_ANIMATION_SPEED = 24; // 已調慢

// --- 新增角色 2 (最左邊的 M-walk 角色) ---
let thirdCharSpriteSheet;
let thirdCharAnimation = [];
const THIRD_CHAR_SPRITE_TOTAL_WIDTH = 452;
const THIRD_CHAR_FRAME_WIDTH_AVG = THIRD_CHAR_SPRITE_TOTAL_WIDTH / 6; // 75.333...
const THIRD_CHAR_FRAME_HEIGHT = 114;
const NUM_THIRD_CHAR_FRAMES = 6;
const THIRD_CHAR_ANIMATION_SPEED = 6; 

// --- 置中參數 ---
const CHARACTER_SPACING = 30; // 兩個角色之間的間隔像素

// --- 對話框參數 ---
const ACTIVATION_DISTANCE = 50; // 兩個角色中心點小於此距離時觸發對話框
let speechText = ":你好:3"; // 將對話框文字改為可變的 let
const PADDING = 10;
const TEXT_SIZE = 14;

// --- 遊戲問答機制 ---
let quizTable; // 儲存從 CSV 載入的題庫
let currentQuestion; // 當前的題目物件
let gameState = 'IDLE'; // 遊戲狀態: IDLE, ASKING, CORRECT, WRONG
let inputField; // 文字輸入框
let submitButton; // 送出按鈕
let bgImage; // 背景圖片


/**
 * 預載入：在 setup() 和 draw() 之前載入所有資源。
 */
function preload() {
  // Note: Assuming asset paths are relative to the HTML file.
  // If your assets are in a subfolder, adjust the paths.
  idleSpriteSheet = loadImage('../1(G-Stop)/1(G-Stop-All).png');
  walkSpriteSheet = loadImage('../1(G-walk)/1(G-walk-All).png');
  newCharSpriteSheet = loadImage('../3(Stop)/3(Stop-All).png');
  thirdCharSpriteSheet = loadImage('../2(M-walk)/2(M-walk-All).png');
  quizTable = loadTable('../quiz.txt', 'csv', 'header'); // 載入 TXT 格式的題庫
  bgImage = loadImage('../Stages.png'); // 載入背景圖片
}



/**
 * 設定：只執行一次，用於初始化。
 */
function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 解決殘影問題：禁用平滑處理和抗鋸齒
  noSmooth(); 
  
  // 垂直置中：所有角色的 Y 座標設定為畫布高度的一半
  y = height / 2; 
  
  // 在 setup 中設定初始 X 座標 (計算三個角色整體居中的位置)
  recalculateCenterPositions();
  
  // --- 動畫切割 (省略重複程式碼) ---
  
  // 原人物 G (右) 動畫切割 (站立 - 63x94 均勻切割)
  for (let i = 0; i < NUM_IDLE_FRAMES; i++) {
    let frame = idleSpriteSheet.get(i * IDLE_FRAME_WIDTH, 0, IDLE_FRAME_WIDTH, IDLE_FRAME_HEIGHT);
    idleAnimation.push(frame);
  }
  
  // 原人物 G (右) 動畫切割 (走路)
  for (let i = 0; i < NUM_WALK_FRAMES; i++) {
    let frame = walkSpriteSheet.get(i * WALK_FRAME_WIDTH, 0, WALK_FRAME_WIDTH, WALK_FRAME_HEIGHT);
    walkAnimation.push(frame);
  }

  // 新增角色 1 (中) 動畫切割
  let currentX_1 = 0;
  for (let i = 0; i < NUM_NEW_CHAR_FRAMES; i++) {
    const frameW = (i < 4) ? 41 : 42; 
    let frame = newCharSpriteSheet.get(currentX_1, 0, frameW, NEW_CHAR_FRAME_HEIGHT);
    newCharAnimation.push(frame);
    currentX_1 += frameW;
  }

  // 新增角色 2 (左) 動畫切割
  let currentX_2 = 0;
  for (let i = 0; i < NUM_THIRD_CHAR_FRAMES; i++) {
    const frameW = (i < 4) ? 75 : 76; 
    let frame = thirdCharSpriteSheet.get(currentX_2, 0, frameW, THIRD_CHAR_FRAME_HEIGHT);
    thirdCharAnimation.push(frame);
    currentX_2 += frameW;
  }
  
  imageMode(CENTER);

  // --- 建立 DOM 元素 ---
  inputField = createInput();
  inputField.position(width / 2 - 100, height - 50);
  inputField.size(120);

  submitButton = createButton('回答');
  submitButton.position(inputField.x + inputField.width + 10, height - 50);
  submitButton.mousePressed(checkAnswer);

  // 初始時隱藏 UI
  updateUI();
}

/**
 * 計算並設定所有角色的起始 X 座標。
 */
function recalculateCenterPositions() {
  const totalWidth = 
    THIRD_CHAR_FRAME_WIDTH_AVG + CHARACTER_SPACING + 
    NEW_CHAR_FRAME_WIDTH_AVG + CHARACTER_SPACING + 
    IDLE_FRAME_WIDTH; 
  
  const startX = (width / 2) - (totalWidth / 2); 
  
  leftCharX = startX + (THIRD_CHAR_FRAME_WIDTH_AVG / 2);
  centerCharX = startX + THIRD_CHAR_FRAME_WIDTH_AVG + CHARACTER_SPACING + (NEW_CHAR_FRAME_WIDTH_AVG / 2);

  x = startX + 
      THIRD_CHAR_FRAME_WIDTH_AVG + CHARACTER_SPACING + 
      NEW_CHAR_FRAME_WIDTH_AVG + CHARACTER_SPACING + 
      (IDLE_FRAME_WIDTH / 2);
}

/**
 * 繪製對話框在中間角色上方
 */
function drawSpeechBubble(textToShow) {
  // 對話框中心點
  const bubbleX = centerCharX;
  // 對話框位置：在中間角色頭部上方約 20 像素處
  const bubbleY = y - NEW_CHAR_FRAME_HEIGHT / 2 - 20; 

  push();
  // 設置文字屬性
  textSize(TEXT_SIZE);
  textAlign(CENTER, CENTER);
  
  // 計算對話框尺寸
  const textW = textWidth(textToShow);
  const bubbleW = textW + PADDING * 2;
  const bubbleH = TEXT_SIZE + PADDING * 2;
  
  // 繪製對話框主體
  fill(255); // 白色背景
  stroke(0); // 黑色邊框
  rectMode(CENTER);
  rect(bubbleX, bubbleY, bubbleW, bubbleH, 5); // 圓角半徑 5

  // 繪製對話框尾巴（一個簡單的三角形）
  noStroke(); // 確保尾巴沒有邊框，看起來更平滑
  fill(255); // 白色填充
  triangle(
    bubbleX - 5, bubbleY + bubbleH / 2,  // 尾巴左下角
    bubbleX + 5, bubbleY + bubbleH / 2,  // 尾巴右下角
    bubbleX, bubbleY + bubbleH / 2 + 5  // 尾巴尖端
  );
  stroke(0); // 恢復邊框
  line(bubbleX - 5, bubbleY + bubbleH / 2, bubbleX, bubbleY + bubbleH / 2 + 5);
  line(bubbleX + 5, bubbleY + bubbleH / 2, bubbleX, bubbleY + bubbleH / 2 + 5);
  
  // 繪製文字
  fill(0); // 黑色文字
  noStroke();
  text(textToShow, bubbleX, bubbleY);
  pop();
}

/**
 * 從題庫中隨機挑選一個新問題
 */
function pickNewQuestion() {
  const randomIndex = floor(random(quizTable.getRowCount()));
  currentQuestion = quizTable.getRow(randomIndex);
  speechText = currentQuestion.getString('question'); // 取得 'question' 欄位的文字
  gameState = 'ASKING';
  updateUI();
}

/**
 * 檢查答案
 */
function checkAnswer() {
  if (gameState !== 'ASKING') return;

  const userAnswer = inputField.value();
  const correctAnswer = currentQuestion.getString('answer');

  if (userAnswer === correctAnswer) {
    speechText = currentQuestion.getString('correct_feedback');
    gameState = 'CORRECT';
  } else {
    speechText = currentQuestion.getString('wrong_feedback');
    gameState = 'WRONG';
  }
  updateUI();
}

/**
 * 根據遊戲狀態更新 UI (輸入框和按鈕) 的可見性
 */
function updateUI() {
  if (gameState === 'ASKING') {
    inputField.show();
    submitButton.show();
  } else {
    inputField.hide();
    submitButton.hide();
    inputField.value(''); // 清空輸入框
  }
}

/**
 * 繪製：連續執行，用於動畫和繪圖。
 */
function draw() {
  // 將背景圖片繪製到畫布上，並使其填滿整個畫面
  // 因為 imageMode 是 CENTER，所以從中心點繪製
  image(bgImage, width / 2, height / 2, width, height);
  
  // 1. 更新原人物 G (右) 位置和方向
  updateCharacterPosition();
  
  // 2. 繪製原人物 G (右)
  drawCharacter();

  // 3. 繪製新角色 1 (中)
  drawNewCharacter();

  // 4. 繪製第三個角色 M-walk (左)
  drawThirdCharacter();
  
  // 5. 🎯 檢查觸發條件並繪製對話框
  // 當原人物 G 和中間角色 3(Stop) 的中心點距離小於 ACTIVATION_DISTANCE (50) 時
  const distance = abs(x - centerCharX);

  if (distance < ACTIVATION_DISTANCE) {
    // 如果靠近且處於閒置狀態，就開始問問題
    if (gameState === 'IDLE') {
      pickNewQuestion();
    }
    // 如果是答對或答錯的狀態，靠近時可以觸發下一題
    if ((gameState === 'CORRECT' || gameState === 'WRONG') && frameCount % 120 === 0) { // 停留2秒後自動問下一題
        pickNewQuestion();
    }
    drawSpeechBubble(speechText);
  } else {
    // 遠離時，重設狀態
    if (gameState !== 'IDLE') {
      gameState = 'IDLE';
      updateUI();
    }
  }
}

/**
 * 處理原人物 G 的位置更新和邊界檢查 (只影響 x)
 */
function updateCharacterPosition() {
  if (isWalkingRight) {
    x += characterSpeed;
    facing = 1; 
  }
  
  if (isWalkingLeft) {
    x -= characterSpeed;
    facing = -1;
  }
  
  x = constrain(x, WALK_FRAME_WIDTH / 2, width - WALK_FRAME_WIDTH / 2);
  y = height / 2;
}


/**
 * 繪製原人物 G (右) 的動畫影格 (使用 x, y)
 */
function drawCharacter() {
  let currentAnimation;
  let frameCountSpeed;
  let numFrames;
  
  if (isWalkingRight || isWalkingLeft) {
    currentAnimation = walkAnimation;
    frameCountSpeed = WALK_ANIMATION_SPEED;
    numFrames = NUM_WALK_FRAMES;
  } else {
    currentAnimation = idleAnimation;    
    frameCountSpeed = IDLE_ANIMATION_SPEED;
    numFrames = NUM_IDLE_FRAMES;
  }
    
  const currentFrameIndex = floor(frameCount / frameCountSpeed) % numFrames;

  push();
  if (facing === -1) {
    scale(-1, 1);
    image(currentAnimation[currentFrameIndex], -x, y); 
  } else {
    image(currentAnimation[currentFrameIndex], x, y);
  }
  pop();
}

/**
 * 繪製新角色 1 (中) (使用固定的 centerCharX)
 */
function drawNewCharacter() {
  
  const newCharX = centerCharX;
  const newCharY = y; 

  const currentFrameIndex = floor(frameCount / NEW_CHAR_ANIMATION_SPEED) % NUM_NEW_CHAR_FRAMES;
  
  image(
    newCharAnimation[currentFrameIndex], 
    newCharX, 
    newCharY
  );
}

/**
 * 繪製第三個角色 M-walk (左) (使用固定的 leftCharX)
 */
function drawThirdCharacter() {
    
  const thirdCharX = leftCharX;
  const thirdCharY = y; 

  const currentFrameIndex = floor(frameCount / THIRD_CHAR_ANIMATION_SPEED) % NUM_THIRD_CHAR_FRAMES;
  
  image(
    thirdCharAnimation[currentFrameIndex], 
    thirdCharX, 
    thirdCharY
  );
}


// --- 鍵盤控制 ---

function keyPressed() {
  if (keyCode === RIGHT_ARROW) {
    isWalkingRight = true;
  } else if (keyCode === LEFT_ARROW) {
    isWalkingLeft = true;
  }
}

function keyReleased() {
  if (keyCode === RIGHT_ARROW) {
    isWalkingRight = false;
  } else if (keyCode === LEFT_ARROW) {
    isWalkingLeft = false;
  }
}

/**
 * 視窗尺寸改變時自動調整畫布大小
 */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  y = height / 2; 
  recalculateCenterPositions();

  // --- 調整 DOM 元素位置 ---
  if (inputField && submitButton) {
    inputField.position(width / 2 - 100, height - 50);
    submitButton.position(inputField.x + inputField.width + 10, height - 50);
  }
}