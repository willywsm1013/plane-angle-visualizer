import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let plane1, plane2;
let normal1Helper, normal2Helper;
let angleDisplay;
let angleVisualization; // 角度可視化對象
let planeIntersectionLine; // 平面交線

const planeSize = 4; // 平面視覺大小
const normalLength = 1.5; // 法向量長度

// --- UI 元素 ---
const sliderPlane2RotX = document.getElementById('plane2-rotX');
const sliderPlane2RotY = document.getElementById('plane2-rotY');
const resetViewButton = document.getElementById('reset-view');
const showAngleButton = document.getElementById('show-angle');
angleDisplay = document.getElementById('angle-value');
const sceneContainer = document.getElementById('scene-container');

// --- 初始化 ---
function init() {
    // 基本檢查：確保容器存在
    if (!sceneContainer) {
        console.error("找不到場景容器元素！");
        return;
    }

    // 場景設置
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);

    // 相機設置
    const width = getContainerWidth();
    const height = getContainerHeight();
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 2, 6);
    camera.lookAt(0, 0, 0);

    // 渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    sceneContainer.appendChild(renderer.domElement);

    // 燈光
    const ambientLight = new THREE.AmbientLight(0x404040, 2.0);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // 相機控制
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 2;
    controls.maxDistance = 20;
    controls.target.set(0, 0, 0);
    controls.update();

    // --- 創建平面 ---
    const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);

    // 平面 1（藍色）- 固定平面
    const material1 = new THREE.MeshStandardMaterial({
        color: 0x007bff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
        metalness: 0.1,
        roughness: 0.6
    });
    plane1 = new THREE.Mesh(planeGeometry, material1);
    plane1.name = "藍色平面（固定）";
    // 設置藍色平面的固定位置 - 水平
    plane1.rotation.set(0, 0, 0);
    scene.add(plane1);

    // 添加平面 1 的網格輔助線，使平面更容易看清
    const wireframe1 = new THREE.LineSegments(
        new THREE.WireframeGeometry(planeGeometry),
        new THREE.LineBasicMaterial({ color: 0x0055a5, linewidth: 1 })
    );
    plane1.add(wireframe1);

    // 平面 2（綠色）- 可旋轉平面
    const material2 = new THREE.MeshStandardMaterial({
        color: 0x28a745,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
        metalness: 0.1,
        roughness: 0.6
    });
    plane2 = new THREE.Mesh(planeGeometry, material2);
    plane2.name = "綠色平面（可旋轉）";
    scene.add(plane2);

    // 添加平面 2 的網格輔助線
    const wireframe2 = new THREE.LineSegments(
        new THREE.WireframeGeometry(planeGeometry),
        new THREE.LineBasicMaterial({ color: 0x1a6e2e, linewidth: 1 })
    );
    plane2.add(wireframe2);

    // --- 創建法向量箭頭 ---
    const origin = new THREE.Vector3(0, 0, 0);

    // 法向量 1（紅色）
    normal1Helper = new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, 1), 
        origin, 
        normalLength, 
        0xff0000, 
        0.3, 
        0.2
    );
    normal1Helper.name = "藍色平面法向量";
    scene.add(normal1Helper);

    // 法向量 2（黃色）
    normal2Helper = new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, 1), 
        origin, 
        normalLength, 
        0xffff00, 
        0.3, 
        0.2
    );
    normal2Helper.name = "綠色平面法向量";
    scene.add(normal2Helper);

    // 創建平面交線可視化
    createIntersectionLine();

    // 創建角度可視化
    createAngleVisualization();

    // 添加坐標軸輔助
    const axesHelper = new THREE.AxesHelper(1.5);
    scene.add(axesHelper);

    // 添加輔助文字標籤
    addTextLabels();

    // 添加事件監聽
    setupEventListeners();
    
    // 設置初始位置並計算角度
    updatePlanesAndAngle();

    // 處理窗口大小調整
    window.addEventListener('resize', onWindowResize, false);

    // 開始動畫循環
    animate();

    console.log("場景初始化成功。");
}

// --- 獲取容器尺寸 ---
function getContainerWidth() {
    return sceneContainer ? sceneContainer.clientWidth : window.innerWidth;
}

function getContainerHeight() {
    return sceneContainer ? sceneContainer.clientHeight : window.innerHeight;
}

// --- 初始化文字標籤 ---
function addTextLabels() {
    // 這部分可以使用CSS2D或CSS3DRenderer實現
    // 但為了保持簡單，我們暫時使用顏色標記
}

// --- 創建平面交線 ---
function createIntersectionLine() {
    const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0xff5500,
        linewidth: 2
    });
    
    const points = [
        new THREE.Vector3(-planeSize/2, 0, 0),
        new THREE.Vector3(planeSize/2, 0, 0)
    ];
    
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    planeIntersectionLine = new THREE.Line(lineGeometry, lineMaterial);
    planeIntersectionLine.name = "平面交線";
    planeIntersectionLine.visible = false; // 初始隱藏
    scene.add(planeIntersectionLine);
}

// --- 創建角度可視化 ---
function createAngleVisualization() {
    // 創建角度弧形
    const curve = new THREE.EllipseCurve(
        0, 0,             // 圓心
        0.7, 0.7,        // x半徑，y半徑
        0, Math.PI / 2,   // 起始角度，結束角度
        false,            // 順時針
        0                // 旋轉
    );
    
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0xff3366, linewidth: 2 });
    
    angleVisualization = new THREE.Line(geometry, material);
    angleVisualization.name = "角度可視化";
    angleVisualization.visible = false; // 初始隱藏
    scene.add(angleVisualization);
}

// --- 更新平面交線 ---
function updateIntersectionLine() {
    // 計算兩個平面的法向量
    const normal1 = calculateWorldNormal(plane1);
    const normal2 = calculateWorldNormal(plane2);
    
    // 交線方向是兩個法向量的叉積
    const intersectionDir = new THREE.Vector3().crossVectors(normal1, normal2).normalize();
    
    // 更新交線的方向和位置
    if (intersectionDir.length() > 0.01) { // 避免平行平面產生的問題
        // 設置交線的長度和位置
        const lineLength = planeSize * 1.5;
        const lineStart = new THREE.Vector3().copy(intersectionDir).multiplyScalar(-lineLength/2);
        const lineEnd = new THREE.Vector3().copy(intersectionDir).multiplyScalar(lineLength/2);
        
        // 更新線的幾何形狀
        const positions = planeIntersectionLine.geometry.attributes.position.array;
        
        positions[0] = lineStart.x;
        positions[1] = lineStart.y;
        positions[2] = lineStart.z;
        
        positions[3] = lineEnd.x;
        positions[4] = lineEnd.y;
        positions[5] = lineEnd.z;
        
        planeIntersectionLine.geometry.attributes.position.needsUpdate = true;
    }
}

// --- 更新角度可視化 ---
function updateAngleVisualization(normal1, normal2, angleRad) {
    if (!angleVisualization) return;
    
    // 確保法向量是單位向量
    const n1 = new THREE.Vector3().copy(normal1).normalize();
    const n2 = new THREE.Vector3().copy(normal2).normalize();
    
    // 計算中間的四元數，用於在兩個法向量之間創建弧
    const tempQuaternion = new THREE.Quaternion();
    tempQuaternion.setFromUnitVectors(n1, n2);
    
    // 創建一個圓弧來代表角度
    const curve = new THREE.EllipseCurve(
        0, 0,             // 圓心
        0.7, 0.7,        // x半徑，y半徑
        0, angleRad,      // 起始角度，結束角度
        false,            // 順時針
        0                // 旋轉
    );
    
    const points = curve.getPoints(50);
    const positions = new Float32Array(points.length * 3);
    
    // 創建一個局部坐標系，其中n1是z軸
    const localToWorld = new THREE.Matrix4();
    
    // 找到一個垂直於n1的向量作為x軸
    const xAxis = new THREE.Vector3(1, 0, 0);
    if (Math.abs(n1.dot(xAxis)) > 0.9) {
        xAxis.set(0, 1, 0);
    }
    
    // 計算y軸（叉積）
    const yAxis = new THREE.Vector3().crossVectors(n1, xAxis).normalize();
    // 重新計算x軸以確保正交
    xAxis.crossVectors(yAxis, n1).normalize();
    
    // 建立坐標變換矩陣
    localToWorld.makeBasis(xAxis, yAxis, n1);
    
    // 變換弧的所有點
    for (let i = 0; i < points.length; i++) {
        const vertex = new THREE.Vector3(points[i].x, points[i].y, 0);
        vertex.applyMatrix4(localToWorld);
        positions[i * 3] = vertex.x;
        positions[i * 3 + 1] = vertex.y;
        positions[i * 3 + 2] = vertex.z;
    }
    
    // 更新幾何數據
    angleVisualization.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    angleVisualization.geometry.attributes.position.needsUpdate = true;
}

// --- 設置事件監聽器 ---
function setupEventListeners() {
    // 只監聽綠色平面的控制滑桿
    if (sliderPlane2RotX) sliderPlane2RotX.addEventListener('input', updatePlanesAndAngle);
    if (sliderPlane2RotY) sliderPlane2RotY.addEventListener('input', updatePlanesAndAngle);
    
    // 按鈕事件監聽
    if (resetViewButton) resetViewButton.addEventListener('click', resetView);
    if (showAngleButton) showAngleButton.addEventListener('click', toggleAngleVisualization);
}

// --- 重置視角 ---
function resetView() {
    if (!controls) return;
    
    controls.reset();
    camera.position.set(0, 2, 6);
    camera.lookAt(0, 0, 0);
    controls.update();
}

// --- 切換角度可視化 ---
function toggleAngleVisualization() {
    if (!angleVisualization || !planeIntersectionLine) return;
    
    angleVisualization.visible = !angleVisualization.visible;
    planeIntersectionLine.visible = !planeIntersectionLine.visible;
    
    // 更新按鈕文字
    if (showAngleButton) {
        showAngleButton.textContent = angleVisualization.visible ? "隱藏實際角度" : "顯示實際角度";
    }
}

// --- 更新函數 ---
function updatePlanesAndAngle() {
    // 確保所有元素都初始化完成
    if (!plane1 || !plane2 || !normal1Helper || !normal2Helper || !angleDisplay ||
        !sliderPlane2RotX || !sliderPlane2RotY) {
        console.warn("更新被調用前，部分元素尚未初始化。");
        return;
    }

    // 藍色平面保持固定不變
    
    // 只更新綠色平面的旋轉
    plane2.rotation.set(parseFloat(sliderPlane2RotX.value), parseFloat(sliderPlane2RotY.value), 0, 'XYZ');

    // 確保在旋轉後更新世界矩陣
    plane1.updateMatrixWorld();
    plane2.updateMatrixWorld();

    // 計算世界坐標下的法向量
    const normal1 = calculateWorldNormal(plane1);
    const normal2 = calculateWorldNormal(plane2);

    // 更新箭頭輔助
    normal1Helper.setDirection(normal1);
    normal2Helper.setDirection(normal2);

    // 計算法向量之間的角度
    if (normal1.lengthSq() > 0.001 && normal2.lengthSq() > 0.001) {
        const angleRad = normal1.angleTo(normal2);
        const angleDeg = THREE.MathUtils.radToDeg(angleRad);

        // 顯示角度
        angleDisplay.textContent = angleDeg.toFixed(2);
        
        // 更新角度可視化
        updateAngleVisualization(normal1, normal2, angleRad);
        
        // 更新平面交線
        updateIntersectionLine();
    } else {
        angleDisplay.textContent = "無法計算";
    }
}

// --- 計算世界坐標下的法向量 ---
function calculateWorldNormal(planeMesh) {
    const normal = new THREE.Vector3(0, 0, 1); // 平面幾何體的默認法向量沿著正Z軸
    const quaternion = new THREE.Quaternion();
    planeMesh.getWorldQuaternion(quaternion); // 獲取物體的世界旋轉
    normal.applyQuaternion(quaternion);       // 將世界旋轉應用於默認法向量
    return normal;
}

// --- 處理窗口大小調整 ---
function onWindowResize() {
    if (!camera || !renderer || !sceneContainer) return;

    const width = getContainerWidth();
    const height = getContainerHeight();

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// --- 動畫循環 ---
function animate() {
    requestAnimationFrame(animate);

    // 檢查是否初始化
    if (!controls || !renderer || !scene || !camera) return;

    controls.update(); // 更新控制（需要用於阻尼效果）
    renderer.render(scene, camera); // 渲染場景
}

// --- 啟動一切 ---
// 確保DOM完全加載後初始化Three.js
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init(); // DOMContentLoaded已經觸發
}
