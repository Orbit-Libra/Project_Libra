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

// 차트 타입 변경 이벤트
function onChartTypeChange() {
    const chartType = document.querySelector('input[name="chartType"]:checked').value;
    console.log('차트 타입 변경:', chartType);
    
    updateCurrentInfo();
    updateMainChartTitle();
    
    if (isReadyToChart()) {
        generateChart();
    }
}

// 메인 차트 제목 업데이트
function updateMainChartTitle() {
    const chartType = document.querySelector('input[name="chartType"]:checked').value;
    const titleElement = document.getElementById('mainChartTitle');
    
    if (chartType === 'bar') {
        titleElement.textContent = '데이터 분포 (막대그래프)';
    } else if (chartType === 'line') {
        titleElement.textContent = '함수형 그래프 (곡선)';
    } else if (chartType === 'scatter') {
        titleElement.textContent = '산점도 그래프 (추세선 포함)';
    }
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
            year: row.YR,
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
        
        // 차트 타입에 따라 메인 차트 생성
        const chartType = document.querySelector('input[name="chartType"]:checked').value;
        if (chartType === 'bar') {
            createBarChart(processedData);
        } else if (chartType === 'line') {
            createLineChart(processedData);
        } else if (chartType === 'scatter') {
            createScatterChart(processedData);
        }
        
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

// 막대 차트 생성
function createBarChart(data) {
    const ctx = document.getElementById('mainChart').getContext('2d');
    
    if (mainChart) {
        mainChart.destroy();
    }
    
    const xAxis = document.getElementById('xAxisSelect').value;
    const yAxis = document.getElementById('yAxisSelect').value;
    const yearFilterEnabled = document.getElementById('yearFilterCheckbox').checked;
    
    let chartData;
    
    if (yearFilterEnabled) {
        // 연도별 필터링 적용 - 연도별로 그룹화 후 X축 값별로 정렬
        const groupedByYear = {};
        data.forEach(item => {
            const year = item.year || '미지정';
            if (!groupedByYear[year]) {
                groupedByYear[year] = {};
            }
            const xKey = item.x.toString();
            if (!groupedByYear[year][xKey]) {
                groupedByYear[year][xKey] = [];
            }
            groupedByYear[year][xKey].push(item.y);
        });
        
        // 연도별로 평균 계산하여 데이터 생성
        chartData = [];
        Object.keys(groupedByYear).sort().forEach(year => {
            Object.keys(groupedByYear[year]).sort((a, b) => {
                const aNum = parseFloat(a);
                const bNum = parseFloat(b);
                if (!isNaN(aNum) && !isNaN(bNum)) {
                    return aNum - bNum;
                } else {
                    return a.localeCompare(b);
                }
            }).forEach(xKey => {
                const values = groupedByYear[year][xKey];
                const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
                chartData.push({
                    x: `${year}-${xKey}`,
                    y: avgValue,
                    label: `${year}년 ${xKey}`
                });
            });
        });
    } else {
        // 기존 방식 - X축 값별로 그룹화하여 평균 계산
        const groupedData = {};
        data.forEach(item => {
            const xKey = item.x.toString();
            if (!groupedData[xKey]) {
                groupedData[xKey] = [];
            }
            groupedData[xKey].push(item.y);
        });
        
        chartData = Object.keys(groupedData).map(key => ({
            x: key,
            y: groupedData[key].reduce((a, b) => a + b, 0) / groupedData[key].length,
            label: key
        }));
        
        // X축 값 기준으로 오름차순 정렬
        chartData.sort((a, b) => {
            const aNum = parseFloat(a.x);
            const bNum = parseFloat(b.x);
            
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return aNum - bNum;
            } else {
                return a.x.localeCompare(b.x);
            }
        });
    }
    
    // 막대 너비 계산 (데이터 수에 따라 조정) - 모든 데이터 표시
    const displayData = chartData; // 모든 데이터 표시
    
    const config = {
        type: 'bar',
        data: {
            labels: displayData.map(item => item.label || item.x),
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
                    text: `${xAxis} vs ${yAxis}`,
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
                        text: xAxis + (yearFilterEnabled ? ' (연도별)' : '')
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 0,
                        font: {
                            size: Math.max(8, Math.min(12, 400 / displayData.length))
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yAxis + ' (처리된 값)'
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
                    categoryPercentage: Math.max(0.1, Math.min(0.9, 30 / displayData.length)),
                    barPercentage: 0.8
                }
            }
        }
    };
    
    mainChart = new Chart(ctx, config);
}

// 산점도 차트 생성 (추세선 포함)
function createScatterChart(data) {
    const ctx = document.getElementById('mainChart').getContext('2d');
    
    if (mainChart) {
        mainChart.destroy();
    }
    
    const xAxis = document.getElementById('xAxisSelect').value;
    const yAxis = document.getElementById('yAxisSelect').value;
    const yearFilterEnabled = document.getElementById('yearFilterCheckbox').checked;
    
    let datasets = [];
    
    if (yearFilterEnabled) {
        // 연도별로 분리하여 다른 색상으로 표시
        const groupedByYear = {};
        data.forEach(item => {
            const year = item.year || '미지정';
            if (!groupedByYear[year]) {
                groupedByYear[year] = [];
            }
            groupedByYear[year].push({
                x: parseFloat(item.x) || 0,
                y: item.y
            });
        });
        
        // 연도별로 데이터셋 생성
        const colors = [
            'rgba(66, 165, 245, 0.8)',
            'rgba(244, 67, 54, 0.8)',
            'rgba(76, 175, 80, 0.8)',
            'rgba(255, 193, 7, 0.8)',
            'rgba(156, 39, 176, 0.8)',
            'rgba(255, 87, 34, 0.8)'
        ];
        
        Object.keys(groupedByYear).sort().forEach((year, index) => {
            const yearData = groupedByYear[year];
            const color = colors[index % colors.length];
            
            // 산점도 데이터셋
            datasets.push({
                label: `${year}년`,
                data: yearData,
                backgroundColor: color,
                borderColor: color.replace('0.8)', '1)'),
                pointRadius: 4,
                pointHoverRadius: 6,
                showLine: false,
                type: 'scatter'
            });
            
            // 각 연도별 추세선 계산 및 추가
            if (yearData.length > 1) {
                const trendData = calculateTrendLine(yearData);
                datasets.push({
                    label: `${year}년 추세선`,
                    data: trendData,
                    borderColor: color.replace('0.8)', '0.4)'),
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    showLine: true,
                    type: 'line'
                });
            }
        });
    } else {
        // 전체 데이터를 하나의 산점도로 표시
        const scatterData = data.map(item => ({
            x: parseFloat(item.x) || 0,
            y: item.y
        }));
        
        // 산점도 데이터셋
        datasets.push({
            label: '데이터 포인트',
            data: scatterData,
            backgroundColor: 'rgba(66, 165, 245, 0.8)',
            borderColor: 'rgba(66, 165, 245, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            showLine: false,
            type: 'scatter'
        });
        
        // 전체 추세선 계산 및 추가
        if (scatterData.length > 1) {
            const trendData = calculateTrendLine(scatterData);
            datasets.push({
                label: '추세선',
                data: trendData,
                borderColor: 'rgba(66, 165, 245, 0.4)',
                backgroundColor: 'transparent',
                fill: false,
                tension: 0,
                pointRadius: 0,
                pointHoverRadius: 0,
                showLine: true,
                type: 'line'
            });
        }
    }
    
    // X축과 Y축 범위 계산
    const allXValues = data.map(item => parseFloat(item.x) || 0);
    const allYValues = data.map(item => item.y);
    
    const xMin = Math.min(...allXValues);
    const xMax = Math.max(...allXValues);
    const yMin = Math.min(...allYValues);
    const yMax = Math.max(...allYValues);
    
    const xPadding = (xMax - xMin) * 0.05;
    const yPadding = (yMax - yMin) * 0.1;
    
    const config = {
        type: 'scatter',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `${xAxis} vs ${yAxis} (산점도)`,
                    font: {
                        size: 12
                    }
                },
                legend: {
                    display: yearFilterEnabled && datasets.length > 2
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: xAxis
                    },
                    min: xMin - xPadding,
                    max: xMax + xPadding,
                    ticks: {
                        font: {
                            size: 10
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yAxis + ' (처리된 값)'
                    },
                    min: yMin - yPadding,
                    max: yMax + yPadding,
                    ticks: {
                        font: {
                            size: 10
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'point'
            }
        }
    };
    
    mainChart = new Chart(ctx, config);
}

// 추세선 계산 함수 (최소제곱법)
function calculateTrendLine(data) {
    if (data.length < 2) return [];
    
    const n = data.length;
    const sumX = data.reduce((sum, point) => sum + point.x, 0);
    const sumY = data.reduce((sum, point) => sum + point.y, 0);
    const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumX2 = data.reduce((sum, point) => sum + point.x * point.x, 0);
    
    // 기울기와 y절편 계산
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // X값 범위에서 추세선 포인트 생성
    const xValues = data.map(point => point.x).sort((a, b) => a - b);
    const minX = xValues[0];
    const maxX = xValues[xValues.length - 1];
    
    return [
        { x: minX, y: slope * minX + intercept },
        { x: maxX, y: slope * maxX + intercept }
    ];
}

// 선형 차트 생성 (함수형 그래프)
function createLineChart(data) {
    const ctx = document.getElementById('mainChart').getContext('2d');
    
    if (mainChart) {
        mainChart.destroy();
    }
    
    const xAxis = document.getElementById('xAxisSelect').value;
    const yAxis = document.getElementById('yAxisSelect').value;
    const yearFilterEnabled = document.getElementById('yearFilterCheckbox').checked;
    
    let datasets = [];
    
    if (yearFilterEnabled) {
        // 연도별로 분리하여 여러 선으로 표시
        const groupedByYear = {};
        data.forEach(item => {
            const year = item.year || '미지정';
            if (!groupedByYear[year]) {
                groupedByYear[year] = [];
            }
            groupedByYear[year].push({
                x: parseFloat(item.x) || 0,
                y: item.y
            });
        });
        
        // 연도별로 데이터 정렬하고 데이터셋 생성
        const colors = [
            'rgba(66, 165, 245, 1)',
            'rgba(244, 67, 54, 1)',
            'rgba(76, 175, 80, 1)',
            'rgba(255, 193, 7, 1)',
            'rgba(156, 39, 176, 1)',
            'rgba(255, 87, 34, 1)'
        ];
        
        Object.keys(groupedByYear).sort().forEach((year, index) => {
            const yearData = groupedByYear[year].sort((a, b) => a.x - b.x);
            const color = colors[index % colors.length];
            
            datasets.push({
                label: `${year}년`,
                data: yearData,
                borderColor: color,
                backgroundColor: color.replace('1)', '0.2)'),
                fill: false,
                tension: 0.4,
                pointRadius: 2,
                pointHoverRadius: 4
            });
        });
    } else {
        // 전체 데이터를 하나의 선으로 표시
        const sortedData = data.map(item => ({
            x: parseFloat(item.x) || 0,
            y: item.y
        })).sort((a, b) => a.x - b.x);
        
        datasets.push({
            label: 'Y축 값',
            data: sortedData,
            borderColor: 'rgba(66, 165, 245, 1)',
            backgroundColor: 'rgba(66, 165, 245, 0.2)',
            fill: false,
            tension: 0.4,
            pointRadius: 2,
            pointHoverRadius: 4
        });
    }
    
    // X축과 Y축 범위 계산
    const allXValues = data.map(item => parseFloat(item.x) || 0);
    const allYValues = data.map(item => item.y);
    
    const xMin = Math.min(...allXValues);
    const xMax = Math.max(...allXValues);
    const yMin = Math.min(...allYValues);
    const yMax = Math.max(...allYValues);
    
    const xPadding = (xMax - xMin) * 0.05;
    const yPadding = (yMax - yMin) * 0.1;
    
    const config = {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `${xAxis} vs ${yAxis} (함수형)`,
                    font: {
                        size: 12
                    }
                },
                legend: {
                    display: yearFilterEnabled && datasets.length > 1
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: xAxis
                    },
                    min: xMin - xPadding,
                    max: xMax + xPadding,
                    ticks: {
                        font: {
                            size: 10
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yAxis + ' (처리된 값)'
                    },
                    min: yMin - yPadding,
                    max: yMax + yPadding,
                    ticks: {
                        font: {
                            size: 10
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
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
            layout: {
                padding: {
                    left: 10,
                    right: 10,
                    top: 10,
                    bottom: 10
                }
            },
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
    
    // 상관계수 퍼센트 표시
    const correlationPercent = (correlation * 100).toFixed(2);
    document.getElementById('correlationPercent').textContent = correlationPercent;
    document.getElementById('correlationInfo').style.display = 'block';
}

// 현재 분석 정보 업데이트
function updateCurrentInfo() {
    document.getElementById('currentYear').textContent = document.getElementById('yearSelect').value;
    
    const chartType = document.querySelector('input[name="chartType"]:checked').value;
    let chartTypeText = '';
    if (chartType === 'bar') {
        chartTypeText = '막대형 그래프';
    } else if (chartType === 'line') {
        chartTypeText = '함수형 그래프';
    } else if (chartType === 'scatter') {
        chartTypeText = '산점도 그래프';
    }
    document.getElementById('currentChartType').textContent = chartTypeText;
    
    document.getElementById('currentXAxis').textContent = document.getElementById('xAxisSelect').value || '-';
    document.getElementById('currentYearFilter').textContent = document.getElementById('yearFilterCheckbox').checked ? '적용' : '미적용';
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
    
    // 상관계수 정보 숨기기
    document.getElementById('correlationInfo').style.display = 'none';
    
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
        chartType: document.querySelector('input[name="chartType"]:checked').value,
        xAxis: xAxis,
        yearFilter: document.getElementById('yearFilterCheckbox').checked,
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
    updateMainChartTitle();
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
        chartType: document.querySelector('input[name="chartType"]:checked').value,
        xAxis: document.getElementById('xAxisSelect').value,
        yearFilter: document.getElementById('yearFilterCheckbox').checked,
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