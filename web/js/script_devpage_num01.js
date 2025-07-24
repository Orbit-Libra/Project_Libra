// 전역 변수
let csvData = null;
let filteredData = null;
let availableColumns = [];
let availableYears = [];
let mainChart = null;
let sideChart = null;
let addedDataCounter = 0;

// CSV 파일 로드
async function loadCSVData() {
    try {
        console.log('필터링데이터.csv 파일 로딩 중...');
        
        const csvPath = '../../resource/csv_files/필터링데이터.csv';
        
        const response = await fetch(csvPath);
        if (!response.ok) {
            throw new Error(`CSV 파일을 찾을 수 없습니다: ${csvPath} (상태: ${response.status})`);
        }
        
        const csvText = await response.text();
        
        // CSV 파싱
        csvData = parseCSV(csvText);
        
        console.log('CSV 데이터 로드 완료:', csvData.length, '행');
        console.log('컬럼명:', Object.keys(csvData[0] || {}));
        
        // 컬럼 정보 추출
        extractColumns();
        
        // 연도 정보 추출
        extractYears();
        
        // UI 초기화
        initializeSelectors();
        
        return csvData;
    } catch (error) {
        console.error('CSV 로드 실패:', error);
        showError(`필터링데이터.csv 파일을 불러올 수 없습니다: ${error.message}`);
        return null;
    }
}

// CSV 파싱 함수
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
        throw new Error('CSV 파일이 비어있거나 형식이 올바르지 않습니다.');
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    console.log('발견된 헤더:', headers);
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                const value = values[index];
                // 숫자 변환 시도
                const numValue = parseFloat(value);
                row[header] = isNaN(numValue) ? value : numValue;
            });
            data.push(row);
        }
    }
    
    return data;
}

// CSV 라인 파싱 (쉼표와 따옴표 처리)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result.map(val => val.replace(/"/g, ''));
}

// 컬럼 정보 추출
function extractColumns() {
    if (!csvData || csvData.length === 0) return;
    
    availableColumns = Object.keys(csvData[0]);
    console.log('사용 가능한 컬럼:', availableColumns);
}

// 연도 정보 추출 (YR 컬럼에서)
function extractYears() {
    if (!csvData || csvData.length === 0) return;
    
    const yearSet = new Set();
    csvData.forEach(row => {
        if (row.YR && !isNaN(row.YR)) {
            yearSet.add(parseInt(row.YR));
        }
    });
    
    availableYears = Array.from(yearSet).sort((a, b) => a - b);
    console.log('사용 가능한 연도:', availableYears);
}

// 셀렉터 초기화
function initializeSelectors() {
    // 연도 셀렉터 초기화
    const yearSelect = document.getElementById('yearSelect');
    availableYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = `${year}년`;
        yearSelect.appendChild(option);
    });
    
    // X축, Y축 셀렉터 초기화
    const xAxisSelect = document.getElementById('xAxisSelect');
    const yAxisSelect = document.getElementById('yAxisSelect');
    
    availableColumns.forEach(column => {
        const xOption = document.createElement('option');
        xOption.value = column;
        xOption.textContent = column;
        xAxisSelect.appendChild(xOption);
        
        const yOption = document.createElement('option');
        yOption.value = column;
        yOption.textContent = column;
        yAxisSelect.appendChild(yOption);
    });
}

// 연도 변경 이벤트
function onYearChange() {
    const selectedYear = document.getElementById('yearSelect').value;
    console.log('선택된 연도:', selectedYear);
    
    updateCurrentInfo();
    
    if (isReadyToChart()) {
        generateChart();
    }
}

// 축 변경 이벤트
function onAxisChange() {
    const xAxis = document.getElementById('xAxisSelect').value;
    const yAxis = document.getElementById('yAxisSelect').value;
    
    console.log('축 선택:', { xAxis, yAxis });
    
    // Y축이 선택되면 옵션 표시
    const yAxisOptions = document.getElementById('yAxisOptions');
    if (yAxis) {
        yAxisOptions.style.display = 'block';
    } else {
        yAxisOptions.style.display = 'none';
    }
    
    updateCurrentInfo();
    
    if (isReadyToChart()) {
        generateChart();
    }
}

// Y축 옵션 변경 이벤트
function onOptionsChange() {
    updateCurrentInfo();
    
    if (isReadyToChart()) {
        generateChart();
    }
}

// 가중치 유효성 검사
function validateWeight() {
    const weightInput = document.getElementById('weightInput');
    const weightError = document.getElementById('weightError');
    const value = weightInput.value.trim();
    
    if (value === '' || isNaN(parseFloat(value))) {
        weightError.style.display = 'block';
        return false;
    } else {
        weightError.style.display = 'none';
        updateCurrentInfo();
        if (isReadyToChart()) {
            generateChart();
        }
        return true;
    }
}

// 데이터 컬럼 추가
function addDataColumn() {
    addedDataCounter++;
    const container = document.getElementById('addedDataContainer');
    
    const dataItem = document.createElement('div');
    dataItem.className = 'added-data-item';
    dataItem.id = `addedData_${addedDataCounter}`;
    
    dataItem.innerHTML = `
        <button class="delete-btn" onclick="removeDataColumn(${addedDataCounter})" title="삭제">×</button>
        <div class="added-data-title">추가 데이터 #${addedDataCounter}</div>
        
        <div class="option-group">
            <label>컬럼 선택</label>
            <select class="option-input added-column-select" onchange="onOptionsChange()">
                <option value="">선택하세요</option>
                ${availableColumns.map(col => `<option value="${col}">${col}</option>`).join('')}
            </select>
        </div>
        
        <div class="option-group">
            <label>가중치</label>
            <input type="text" class="option-input added-weight" value="1" onchange="validateAddedWeight(${addedDataCounter})">
            <div class="error-message" id="addedWeightError_${addedDataCounter}">올바른 실수 값을 입력하세요.</div>
        </div>
        
        <div class="option-group">
            <div class="checkbox-group">
                <input type="checkbox" class="added-log-checkbox" onchange="onOptionsChange()">
                <label>로그함수 적용</label>
            </div>
        </div>
        
        <div class="option-group">
            <label>적용 순서</label>
            <select class="option-input added-order-select" onchange="onOptionsChange()">
                <option value="weight_first">가중치 → 로그함수</option>
                <option value="log_first">로그함수 → 가중치</option>
            </select>
        </div>
    `;
    
    container.appendChild(dataItem);
    updateCurrentInfo();
}

// 데이터 컬럼 제거
function removeDataColumn(id) {
    const dataItem = document.getElementById(`addedData_${id}`);
    if (dataItem) {
        dataItem.remove();
        updateCurrentInfo();
        
        if (isReadyToChart()) {
            generateChart();
        }
    }
}

// 추가된 데이터의 가중치 유효성 검사
function validateAddedWeight(id) {
    const weightInput = document.querySelector(`#addedData_${id} .added-weight`);
    const weightError = document.getElementById(`addedWeightError_${id}`);
    const value = weightInput.value.trim();
    
    if (value === '' || isNaN(parseFloat(value))) {
        weightError.style.display = 'block';
        return false;
    } else {
        weightError.style.display = 'none';
        updateCurrentInfo();
        if (isReadyToChart()) {
            generateChart();
        }
        return true;
    }
}

// 차트 생성 준비 상태 확인
function isReadyToChart() {
    const xAxis = document.getElementById('xAxisSelect').value;
    const yAxis = document.getElementById('yAxisSelect').value;
    const weight = document.getElementById('weightInput').value;
    
    return xAxis && yAxis && !isNaN(parseFloat(weight));
}

// 데이터 필터링
function filterData() {
    if (!csvData) return [];
    
    const selectedYear = document.getElementById('yearSelect').value;
    
    if (selectedYear === '전체') {
        return csvData;
    } else {
        return csvData.filter(row => row.YR == selectedYear);
    }
}

// Y축 데이터 계산 (가중치, 로그함수, 추가 데이터 적용)
function calculateYAxisData(data) {
    const yAxis = document.getElementById('yAxisSelect').value;
    const weight = parseFloat(document.getElementById('weightInput').value) || 1;
    const applyLog = document.getElementById('logCheckbox').checked;
    const order = document.getElementById('orderSelect').value;
    
    if (!yAxis) return [];
    
    const result = data.map(row => {
        let yValue = parseFloat(row[yAxis]) || 0;
        
        // 메인 Y축 데이터 계산
        if (order === 'weight_first') {
            // 가중치 먼저
            yValue *= weight;
            if (applyLog && yValue > 0) {
                yValue = Math.log(yValue);
            }
        } else {
            // 로그함수 먼저
            if (applyLog && yValue > 0) {
                yValue = Math.log(yValue);
            }
            yValue *= weight;
        }
        
        // 추가 데이터 계산 및 합산
        const addedDataItems = document.querySelectorAll('.added-data-item');
        addedDataItems.forEach(item => {
            const columnSelect = item.querySelector('.added-column-select');
            const addedWeight = parseFloat(item.querySelector('.added-weight').value) || 1;
            const addedLog = item.querySelector('.added-log-checkbox').checked;
            const addedOrder = item.querySelector('.added-order-select').value;
            const column = columnSelect.value;
            
            if (column && row[column] !== undefined) {
                let addedValue = parseFloat(row[column]) || 0;
                
                if (addedOrder === 'weight_first') {
                    addedValue *= addedWeight;
                    if (addedLog && addedValue > 0) {
                        addedValue = Math.log(addedValue);
                    }
                } else {
                    if (addedLog && addedValue > 0) {
                        addedValue = Math.log(addedValue);
                    }
                    addedValue *= addedWeight;
                }
                
                yValue += addedValue;
            }
        });
        
        return {
            x: row[document.getElementById('xAxisSelect').value],
            y: yValue,
            originalRow: row
        };
    });
    
    return result.filter(item => !isNaN(item.y));
}

// 상관계수 계산
function calculateCorrelation(processedData) {
    if (processedData.length < 2) return 0;
    
    const xValues = processedData.map(item => parseFloat(item.x) || 0);
    const yValues = processedData.map(item => item.y);
    
    const n = xValues.length;
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);
    const sumY2 = yValues.reduce((sum, y) => sum + y * y, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    if (denominator === 0) return 0;
    
    return numerator / denominator;
}

// 차트 생성
async function generateChart() {
    if (!csvData) {
        await loadCSVData();
        if (!csvData) return;
    }
    
    if (!isReadyToChart()) {
        showError('X축과 Y축을 모두 선택하고 올바른 가중치를 입력하세요.');
        return;
    }
    
    showLoading();
    
    try {
        // 데이터 필터링 및 처리
        filteredData = filterData();
        const processedData = calculateYAxisData(filteredData);
        
        if (processedData.length === 0) {
            showError('처리할 데이터가 없습니다.');
            return;
        }
        
        // 상관계수 계산
        const correlation = calculateCorrelation(processedData);
        
        // 메인 차트 생성 (막대그래프)
        createMainChart(processedData);
        
        // 사이드 차트 생성 (상관계수)
        createSideChart(correlation);
        
        // 정보 업데이트
        updateDataCount(processedData.length);
        updateCorrelation(correlation);
        
        // 플레이스홀더 숨기기
        document.getElementById('mainChartPlaceholder').style.display = 'none';
        document.getElementById('sideChartPlaceholder').style.display = 'none';
        
    } catch (error) {
        console.error('차트 생성 실패:', error);
        showError('차트 생성 중 오류가 발생했습니다: ' + error.message);
    } finally {
        hideLoading();
    }
}

// 메인 차트 생성 (막대그래프)
function createMainChart(data) {
    const ctx = document.getElementById('mainChart').getContext('2d');
    
    if (mainChart) {
        mainChart.destroy();
    }
    
    // 데이터를 X축 값별로 그룹화하여 평균 계산
    const groupedData = {};
    data.forEach(item => {
        const xKey = item.x.toString();
        if (!groupedData[xKey]) {
            groupedData[xKey] = [];
        }
        groupedData[xKey].push(item.y);
    });
    
    const chartData = Object.keys(groupedData).map(key => ({
        x: key,
        y: groupedData[key].reduce((a, b) => a + b, 0) / groupedData[key].length
    }));
    
    // X축 값 기준으로 오름차순 정렬
    chartData.sort((a, b) => {
        // 숫자인지 확인하여 적절히 정렬
        const aNum = parseFloat(a.x);
        const bNum = parseFloat(b.x);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum; // 숫자면 숫자 정렬
        } else {
            return a.x.localeCompare(b.x); // 문자면 문자 정렬
        }
    });
    
    // 너무 많은 데이터는 가독성을 위해 제한 (상위 50개)
    const displayData = chartData.slice(0, 50);
    
    const config = {
        type: 'bar',
        data: {
            labels: displayData.map(item => item.x),
            datasets: [{
                label: 'Y축 값',
                data: displayData.map(item => item.y),
                backgroundColor: 'rgba(66, 165, 245, 0.8)',
                borderColor: 'rgba(66, 165, 245, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `${document.getElementById('xAxisSelect').value} vs ${document.getElementById('yAxisSelect').value}`,
                    font: {
                        size: 12
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: document.getElementById('xAxisSelect').value
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 0,
                        font: {
                            size: 10
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: document.getElementById('yAxisSelect').value + ' (처리된 값)'
                    },
                    ticks: {
                        font: {
                            size: 10
                        }
                    }
                }
            },
            elements: {
                bar: {
                    // 막대의 위치를 X축 데이터 값에 맞춰 조정
                    categoryPercentage: 0.8,
                    barPercentage: 0.9
                }
            }
        }
    };
    
    mainChart = new Chart(ctx, config);
}

// 사이드 차트 생성 (상관계수)
function createSideChart(correlation) {
    const ctx = document.getElementById('sideChart').getContext('2d');
    
    if (sideChart) {
        sideChart.destroy();
    }
    
    // 상관계수를 시각화 (막대그래프)
    const config = {
        type: 'bar',
        data: {
            labels: ['상관계수'],
            datasets: [{
                label: '상관계수',
                data: [correlation],
                backgroundColor: correlation >= 0 ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)',
                borderColor: correlation >= 0 ? 'rgba(76, 175, 80, 1)' : 'rgba(244, 67, 54, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'X-Y 상관관계',
                    font: {
                        size: 11
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: 9
                        }
                    }
                },
                y: {
                    min: -1,
                    max: 1,
                    title: {
                        display: true,
                        text: '상관계수',
                        font: {
                            size: 10
                        }
                    },
                    ticks: {
                        font: {
                            size: 9
                        },
                        stepSize: 0.5
                    }
                }
            }
        }
    };
    
    sideChart = new Chart(ctx, config);
}

// 현재 분석 정보 업데이트
function updateCurrentInfo() {
    document.getElementById('currentYear').textContent = document.getElementById('yearSelect').value;
    document.getElementById('currentXAxis').textContent = document.getElementById('xAxisSelect').value || '-';
    document.getElementById('currentYAxis').textContent = document.getElementById('yAxisSelect').value || '-';
    document.getElementById('currentWeight').textContent = document.getElementById('weightInput').value;
    document.getElementById('currentLog').textContent = document.getElementById('logCheckbox').checked ? '적용' : '미적용';
    
    const order = document.getElementById('orderSelect').value;
    document.getElementById('currentOrder').textContent = order === 'weight_first' ? '가중치 → 로그함수' : '로그함수 → 가중치';
    
    const addedDataCount = document.querySelectorAll('.added-data-item').length;
    document.getElementById('currentAddedData').textContent = `${addedDataCount}개`;
}

function updateDataCount(count) {
    document.getElementById('dataCount').textContent = `${count}개`;
}

function updateCorrelation(correlation) {
    document.getElementById('currentCorrelation').textContent = correlation.toFixed(4);
}

// 로딩 표시/숨김
function showLoading() {
    document.getElementById('mainChartLoading').style.display = 'flex';
    document.getElementById('sideChartLoading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('mainChartLoading').style.display = 'none';
    document.getElementById('sideChartLoading').style.display = 'none';
}

// 에러 표시
function showError(message) {
    const mainPlaceholder = document.getElementById('mainChartPlaceholder');
    const sidePlaceholder = document.getElementById('sideChartPlaceholder');
    
    const errorContent = `
        <div class="placeholder-content">
            <div class="placeholder-icon">⚠️</div>
            <h4>오류 발생</h4>
            <p>${message}</p>
        </div>
    `;
    
    mainPlaceholder.innerHTML = errorContent;
    sidePlaceholder.innerHTML = errorContent;
    
    mainPlaceholder.style.display = 'flex';
    sidePlaceholder.style.display = 'flex';
    
    hideLoading();
}

// 네비게이션
function navigateTo(page) {
    switch(page) {
        case 'learning':
            window.location.href = 'page_chartpage_num01.html';
            break;
        case 'development':
            window.location.href = 'page_prediction_num01.html';
            break;
        case 'myservice':
            window.location.href = 'page_userpage_num01.html';
            break;
        case 'developer':
            // 현재 페이지
            break;
        case 'mypage':
            alert('마이 페이지로 이동합니다.');
            break;
        case 'main':
            window.location.href = 'page_mainpage_num01.html';
            break;
    }
}

// 차트 내보내기
function exportChart() {
    if (!mainChart || !sideChart) {
        alert('내보낼 차트가 없습니다. 먼저 차트를 생성해주세요.');
        return;
    }
    
    try {
        // 두 차트를 하나의 캔버스에 합치기
        const canvas1 = document.getElementById('mainChart');
        const canvas2 = document.getElementById('sideChart');
        
        const combinedCanvas = document.createElement('canvas');
        const padding = 20;
        combinedCanvas.width = canvas1.width + canvas2.width + padding * 3;
        combinedCanvas.height = Math.max(canvas1.height, canvas2.height) + padding * 2;
        
        const ctx = combinedCanvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);
        
        ctx.drawImage(canvas1, padding, padding);
        ctx.drawImage(canvas2, canvas1.width + padding * 2, padding);
        
        const url = combinedCanvas.toDataURL('image/png');
        
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `libra_feature_engineering_${timestamp}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        console.log('차트 내보내기 완료');
    } catch (error) {
        console.error('차트 내보내기 실패:', error);
        alert('차트 내보내기에 실패했습니다.');
    }
}

// 분석 저장
function saveAnalysis() {
    const xAxis = document.getElementById('xAxisSelect').value;
    const yAxis = document.getElementById('yAxisSelect').value;
    
    if (!xAxis || !yAxis) {
        alert('X축과 Y축을 선택한 후 저장해주세요.');
        return;
    }
    
    const analysisConfig = {
        year: document.getElementById('yearSelect').value,
        xAxis: xAxis,
        yAxis: yAxis,
        weight: document.getElementById('weightInput').value,
        applyLog: document.getElementById('logCheckbox').checked,
        order: document.getElementById('orderSelect').value,
        addedData: getAddedDataConfig(),
        timestamp: new Date().toISOString()
    };
    
    const savedAnalyses = JSON.parse(localStorage.getItem('libra_feature_analyses') || '[]');
    savedAnalyses.push(analysisConfig);
    localStorage.setItem('libra_feature_analyses', JSON.stringify(savedAnalyses));
    
    alert('현재 분석 설정이 저장되었습니다.');
    console.log('분석 저장 완료:', analysisConfig);
}

// 추가된 데이터 설정 가져오기
function getAddedDataConfig() {
    const addedDataItems = document.querySelectorAll('.added-data-item');
    const configs = [];
    
    addedDataItems.forEach((item, index) => {
        const column = item.querySelector('.added-column-select').value;
        const weight = item.querySelector('.added-weight').value;
        const applyLog = item.querySelector('.added-log-checkbox').checked;
        const order = item.querySelector('.added-order-select').value;
        
        if (column) {
            configs.push({
                column: column,
                weight: weight,
                applyLog: applyLog,
                order: order
            });
        }
    });
    
    return configs;
}

// 페이지 초기화
function initializePage() {
    console.log('피쳐엔지니어링 개발자페이지 초기화');
    
    // CSV 데이터 로드
    loadCSVData();
    
    // 현재 정보 업데이트
    updateCurrentInfo();
}

// 키보드 단축키
document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        generateChart();
    }
    
    if (event.ctrlKey && event.key === 'e') {
        event.preventDefault();
        exportChart();
    }
    
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        saveAnalysis();
    }
});

// 페이지 로드 완료 시 초기화
window.addEventListener('load', initializePage);

document.addEventListener('DOMContentLoaded', function() {
    console.log('피쳐엔지니어링 개발자페이지 DOM 로드 완료');
});

window.addEventListener('beforeunload', function() {
    if (mainChart) {
        mainChart.destroy();
    }
    if (sideChart) {
        sideChart.destroy();
    }
    console.log('피쳐엔지니어링 개발자페이지를 떠납니다.');
});

// 디버깅용 함수
function debugInfo() {
    console.log('=== 피쳐엔지니어링 디버깅 정보 ===');
    console.log('CSV 데이터:', csvData ? csvData.length + '행' : '없음');
    console.log('사용 가능한 컬럼:', availableColumns);
    console.log('사용 가능한 연도:', availableYears);
    console.log('현재 차트:', {
        mainChart: mainChart ? '있음' : '없음',
        sideChart: sideChart ? '있음' : '없음'
    });
    
    if (csvData && csvData.length > 0) {
        console.log('컬럼명:', Object.keys(csvData[0]));
        console.log('첫 번째 행:', csvData[0]);
    }
    
    console.log('현재 설정:', {
        year: document.getElementById('yearSelect').value,
        xAxis: document.getElementById('xAxisSelect').value,
        yAxis: document.getElementById('yAxisSelect').value,
        weight: document.getElementById('weightInput').value,
        applyLog: document.getElementById('logCheckbox').checked,
        order: document.getElementById('orderSelect').value,
        addedDataCount: document.querySelectorAll('.added-data-item').length
    });
}

// 개발자 도구용 전역 함수 등록
window.debugFeature = debugInfo;
window.libraFeature = {
    csvData,
    availableColumns,
    availableYears,
    mainChart,
    sideChart,
    generateChart,
    loadData: loadCSVData,
    debugInfo
};