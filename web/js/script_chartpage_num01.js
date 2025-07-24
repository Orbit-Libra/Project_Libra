// 환경점수예측 분석 스크립트 (예측데이터총합.csv 사용)
// 파일명: script_chartpage_num01.js

// 전역 변수
let csvData = null;
let filteredData = null;
let selectedUniversities = new Set();
let currentChart = null;
let chartData = null;
let currentYear = null;
let availableYears = [];
let selectionMode = 'all'; // 'all' 또는 'manual'
let selectedDataRange = { start: 1, end: 1 };

// 차트 색상 팔레트
const CHART_COLORS = [
    '#42a5f5', '#29b6f6', '#1e88e5', '#1976d2', '#1565c0',
    '#0d47a1', '#81c784', '#66bb6a', '#4caf50', '#43a047',
    '#388e3c', '#2e7d32', '#ffb74d', '#ffa726', '#ff9800',
    '#fb8c00', '#f57c00', '#ef6c00', '#ff8a65', '#ff7043'
];

// 차트 타입별 한글명
const CHART_TYPE_NAMES = {
    'bar': '막대 차트',
    'line': '선 차트',
    'scatter': '산점도',
    'pie': '원형 차트'
};

// 정렬 방식별 한글명
const SORT_ORDER_NAMES = {
    'rank_asc': '환경점수 낮은 순',
    'rank_desc': '환경점수 높은 순',
    'university': '대학명 가나다순'
};

// Y축 범위 모드별 한글명
const Y_AXIS_MODE_NAMES = {
    'auto': '자동 조절',
    'dataRange': '데이터 범위 기준',
    'custom': '사용자 지정',
    'enhanced': '향상된 표시'
};

// CSV 파일 로드 (예측데이터총합.csv)
async function loadCSVData() {
    try {
        console.log('예측데이터총합.csv 파일 로딩 중...');
        
        // 단일 CSV 파일 경로
        const csvPath = `../../resource/csv_files/예측데이터총합.csv`;
        
        const response = await fetch(csvPath);
        if (!response.ok) {
            throw new Error(`CSV 파일을 찾을 수 없습니다: ${csvPath} (상태: ${response.status})`);
        }
        
        const csvText = await response.text();
        
        // CSV 파싱
        csvData = parseCSV(csvText);
        
        console.log('CSV 데이터 로드 완료:', csvData.length, '행');
        console.log('컬럼명:', Object.keys(csvData[0] || {}));
        
        // 사용 가능한 연도 추출
        extractAvailableYears();
        
        // 필터 옵션 업데이트
        updateFilterOptions();
        
        // 데이터 검증
        const validation = validateData(csvData);
        if (!validation.valid) {
            throw new Error(validation.message);
        }
        
        // 연도 셀렉트 박스 초기화
        initializeYearSelect();
        
        // 초기 필터 적용하여 데이터 범위 슬라이더 준비
        selectedDataRange = { start: 1, end: Math.min(50, csvData.length) }; // 기본값: 처음 50개
        updateDataRangeSliders();
        
        return csvData;
    } catch (error) {
        console.error('CSV 로드 실패:', error);
        showError(`예측데이터총합.csv 파일을 불러올 수 없습니다: ${error.message}`);
        return null;
    }
}

// 사용 가능한 연도 추출 (동적 범위 감지)
function extractAvailableYears() {
    if (!csvData || csvData.length === 0) return;
    
    const firstRow = csvData[0];
    availableYears = [];
    
    // SCR_EST_YYYY 형태의 컬럼명에서 연도 추출 (범위 제한 없이)
    Object.keys(firstRow).forEach(key => {
        const match = key.match(/^SCR_EST_(\d{4})$/);
        if (match) {
            const year = parseInt(match[1]);
            // 연도가 4자리 숫자이고 합리적인 범위 내에 있으면 추가
            if (year >= 1900 && year <= 2100) {
                availableYears.push(year);
            }
        }
    });
    
    // 연도 정렬 (내림차순 - 최신 연도부터)
    availableYears.sort((a, b) => b - a);
    
    console.log('CSV에서 감지된 사용 가능한 연도:', availableYears);
    console.log('연도 범위:', availableYears.length > 0 ? `${Math.min(...availableYears)} ~ ${Math.max(...availableYears)}` : '없음');
}

// 필터 옵션 업데이트
function updateFilterOptions() {
    if (!csvData || csvData.length === 0) return;
    
    // 각 필터별 고유값 추출
    const stypValues = new Set();
    const fndValues = new Set();
    const rgnValues = new Set();
    const uscValues = new Set();
    
    csvData.forEach(row => {
        if (row.STYP) stypValues.add(row.STYP);
        if (row.FND) fndValues.add(row.FND);
        if (row.RGN) rgnValues.add(row.RGN);
        if (row.USC) uscValues.add(row.USC);
    });
    
    // 필터 옵션 업데이트
    updateSelectOptions('stypFilter', Array.from(stypValues).sort());
    updateSelectOptions('fndFilter', Array.from(fndValues).sort());
    updateSelectOptions('rgnFilter', Array.from(rgnValues).sort());
    updateSelectOptions('uscFilter', Array.from(uscValues).sort());
}

// Select 옵션 업데이트
function updateSelectOptions(selectId, values) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    // 기존 옵션 제거 (전체 옵션 제외)
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    // 새 옵션 추가
    values.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });
}

// 연도 셀렉트 박스 초기화
function initializeYearSelect() {
    const yearSelect = document.getElementById('yearSelect');
    if (!yearSelect) return;
    
    // 기존 옵션 제거
    yearSelect.innerHTML = '';
    
    // 사용 가능한 연도로 옵션 추가
    availableYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = `${year}년`;
        yearSelect.appendChild(option);
    });
    
    // 기본값을 가장 최신 연도로 설정
    if (availableYears.length > 0) {
        currentYear = availableYears[0];
        yearSelect.value = currentYear;
        updateCurrentInfo();
    }
}

// CSV 파싱 함수 (개선됨)
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

// **핵심: generateChart 함수 정의**
function generateChart() {
    console.log('차트 생성 함수 호출됨');
    generateChartFromCSV();
}

// 선택 모드 설정
function setSelectionMode(mode) {
    selectionMode = mode;
    
    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => btn.classList.remove('active'));
    
    // 클릭된 버튼을 활성화
    const clickedBtn = Array.from(modeBtns).find(btn => 
        (mode === 'all' && btn.textContent.includes('필터링 후 전체')) ||
        (mode === 'manual' && btn.textContent.includes('수동 선택'))
    );
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }
    
    const selector = document.getElementById('universitySelector');
    const dataRangeGroup = document.getElementById('dataRangeSliderGroup');
    
    console.log(`선택 모드 변경: ${mode}`);
    
    if (mode === 'manual') {
        // 수동 선택 모드
        selector.classList.add('active');
        dataRangeGroup.style.display = 'none';
        console.log('대학 목록 업데이트 시작...');
        updateUniversityList();
        console.log('대학 목록 업데이트 완료');
    } else {
        // 전체 모드
        selector.classList.remove('active');
        dataRangeGroup.style.display = 'block';
        selectedUniversities.clear();
        updateDataRangeSliders();
    }
    
    updateCurrentInfo();
}

// 데이터 범위 슬라이더 초기화/업데이트
function updateDataRangeSliders() {
    const filtered = applyFilters();
    const dataCount = filtered.length;
    
    const startSlider = document.getElementById('dataStartSlider');
    const endSlider = document.getElementById('dataEndSlider');
    const minLabel = document.getElementById('dataMinLabel');
    const maxLabel = document.getElementById('dataMaxLabel');
    const countInfo = document.getElementById('dataCountInfo');
    
    // 필터링된 데이터 개수 표시
    countInfo.textContent = `필터링된 데이터: ${dataCount}개`;
    
    if (dataCount === 0) {
        // 데이터가 없을 때
        startSlider.min = 1;
        startSlider.max = 1;
        startSlider.value = 1;
        endSlider.min = 1;
        endSlider.max = 1;
        endSlider.value = 1;
        minLabel.textContent = '1';
        maxLabel.textContent = '1';
        document.getElementById('selectedDataRange').textContent = '데이터 없음';
        return;
    }
    
    // 슬라이더 범위 설정
    startSlider.min = 1;
    startSlider.max = dataCount;
    endSlider.min = 1;
    endSlider.max = dataCount;
    
    // 현재 값이 범위를 벗어나면 조정
    if (selectedDataRange.start > dataCount) {
        selectedDataRange.start = 1;
    }
    if (selectedDataRange.end > dataCount) {
        selectedDataRange.end = dataCount;
    }
    
    startSlider.value = selectedDataRange.start;
    endSlider.value = selectedDataRange.end;
    
    // 레이블 업데이트
    minLabel.textContent = '1';
    maxLabel.textContent = dataCount.toString();
    
    updateSelectedDataRangeDisplay();
}

// 데이터 슬라이더 변경 이벤트
function onDataSliderChange() {
    const startSlider = document.getElementById('dataStartSlider');
    const endSlider = document.getElementById('dataEndSlider');
    
    let startIdx = parseInt(startSlider.value);
    let endIdx = parseInt(endSlider.value);
    
    // 시작이 끝보다 크면 조정
    if (startIdx > endIdx) {
        if (event.target.id === 'dataStartSlider') {
            endIdx = startIdx;
            endSlider.value = endIdx;
        } else {
            startIdx = endIdx;
            startSlider.value = startIdx;
        }
    }
    
    selectedDataRange.start = startIdx;
    selectedDataRange.end = endIdx;
    
    updateSelectedDataRangeDisplay();
}

// 화살표 버튼으로 데이터 범위 조절
function adjustDataRange(type, delta) {
    const startSlider = document.getElementById('dataStartSlider');
    const endSlider = document.getElementById('dataEndSlider');
    const maxValue = parseInt(endSlider.max);
    
    if (type === 'start') {
        let newValue = selectedDataRange.start + delta;
        newValue = Math.max(1, Math.min(newValue, selectedDataRange.end));
        selectedDataRange.start = newValue;
        startSlider.value = newValue;
    } else if (type === 'end') {
        let newValue = selectedDataRange.end + delta;
        newValue = Math.max(selectedDataRange.start, Math.min(newValue, maxValue));
        selectedDataRange.end = newValue;
        endSlider.value = newValue;
    }
    
    updateSelectedDataRangeDisplay();
}

// 선택된 데이터 범위 표시 업데이트
function updateSelectedDataRangeDisplay() {
    const rangeDisplay = document.getElementById('selectedDataRange');
    const totalCount = parseInt(document.getElementById('dataMaxLabel').textContent) || 0;
    
    if (totalCount === 0) {
        rangeDisplay.textContent = '데이터 없음';
        return;
    }
    
    const selectedCount = selectedDataRange.end - selectedDataRange.start + 1;
    rangeDisplay.textContent = `${selectedDataRange.start}번째 ~ ${selectedDataRange.end}번째 (${selectedCount}개)`;
}

// 필터링 적용 (정렬 방식에 따른 정렬 추가)
function applyFilters() {
    if (!csvData) return [];
    
    const stypFilter = document.getElementById('stypFilter').value;
    const fndFilter = document.getElementById('fndFilter').value;
    const rgnFilter = document.getElementById('rgnFilter').value;
    const uscFilter = document.getElementById('uscFilter').value;
    const sortOrder = document.getElementById('sortOrder').value;
    
    // 필터링
    filteredData = csvData.filter(row => {
        if (stypFilter !== '전체' && row.STYP !== stypFilter) return false;
        if (fndFilter !== '전체' && row.FND !== fndFilter) return false;
        if (rgnFilter !== '전체' && row.RGN !== rgnFilter) return false;
        if (uscFilter !== '전체' && row.USC !== uscFilter) return false;
        
        // 현재 연도의 점수가 있는지 확인
        if (currentYear) {
            const scoreColumn = `SCR_EST_${currentYear}`;
            const scoreValue = row[scoreColumn];
            return scoreValue !== null && 
                   scoreValue !== undefined && 
                   scoreValue !== '' &&
                   scoreValue !== '-' &&
                   !isNaN(parseFloat(scoreValue)) &&
                   row['SNM']; // 학교명이 있어야 함
        }
        
        return true;
    });
    
    // 정렬 적용
    const scoreColumn = `SCR_EST_${currentYear}`;
    applySorting(filteredData, sortOrder, scoreColumn);
    
    return filteredData;
}

// 정렬 적용 함수 (연도별 점수 컬럼 사용)
function applySorting(data, sortOrder, scoreColumn) {
    switch(sortOrder) {
        case 'rank_asc':
            // 환경점수 오름차순 (낮은 점수부터)
            data.sort((a, b) => {
                const scoreA = parseFloat(a[scoreColumn]) || 0;
                const scoreB = parseFloat(b[scoreColumn]) || 0;
                return scoreA - scoreB;
            });
            break;
            
        case 'rank_desc':
            // 환경점수 내림차순 (높은 점수부터)
            data.sort((a, b) => {
                const scoreA = parseFloat(a[scoreColumn]) || 0;
                const scoreB = parseFloat(b[scoreColumn]) || 0;
                return scoreB - scoreA;
            });
            break;
            
        case 'university':
            // 대학명 가나다순
            data.sort((a, b) => {
                const nameA = (a['SNM'] || '').toString();
                const nameB = (b['SNM'] || '').toString();
                return nameA.localeCompare(nameB, 'ko');
            });
            break;
    }
}

// 대학 목록 업데이트
function updateUniversityList() {
    const listContainer = document.getElementById('universityList');
    if (!listContainer) {
        console.error('universityList 요소를 찾을 수 없습니다.');
        return;
    }
    
    const filtered = applyFilters();
    console.log(`필터링된 대학 수: ${filtered.length}개`);
    
    // 기존 목록 초기화
    listContainer.innerHTML = '';
    
    if (filtered.length === 0) {
        listContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">필터 조건에 맞는 대학이 없습니다.</div>';
        return;
    }
    
    filtered.forEach((row, index) => {
        const item = document.createElement('div');
        item.className = 'university-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `univ_${index}_${row.SNM}`;
        checkbox.value = row.SNM;
        checkbox.checked = selectedUniversities.has(row.SNM);
        checkbox.onchange = () => updateSelectedUniversities();
        
        const label = document.createElement('label');
        label.htmlFor = `univ_${index}_${row.SNM}`;
        label.textContent = row.SNM || 'Unknown';
        
        item.appendChild(checkbox);
        item.appendChild(label);
        listContainer.appendChild(item);
    });
    
    updateSelectedCount();
    console.log('대학 목록 DOM 업데이트 완료');
}

// 선택된 대학 업데이트
function updateSelectedUniversities() {
    selectedUniversities.clear();
    
    const checkboxes = document.querySelectorAll('#universityList input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        selectedUniversities.add(checkbox.value);
    });
    
    updateSelectedCount();
}

// 선택된 개수 업데이트
function updateSelectedCount() {
    const countElement = document.getElementById('selectedCount');
    if (countElement) {
        countElement.textContent = `${selectedUniversities.size}개 선택됨`;
    }
}

// 전체 선택/해제
function toggleAllUniversities() {
    const checkboxes = document.querySelectorAll('#universityList input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = !allChecked;
    });
    
    updateSelectedUniversities();
}

// CSV 데이터로 차트 생성 (수정됨)
async function generateChartFromCSV() {
    // CSV 데이터가 없으면 먼저 로드
    if (!csvData) {
        showLoading();
        await loadCSVData();
        if (!csvData) {
            hideLoading();
            return;
        }
        hideLoading();
    }
    
    const year = document.getElementById('yearSelect').value;
    currentYear = year;
    
    const chartTypeSelect = document.getElementById('chartType');
    const chartType = chartTypeSelect.value;
    
    console.log('차트 생성 요청:', { year, chartType, selectionMode });
    
    // 로딩 표시
    showLoading();
    
    try {
        // 데이터 처리 (출력 범위 모드에 따라)
        const processedData = processCSVDataForChart(csvData, year);
        
        if (processedData && processedData.length > 0) {
            // 차트 생성
            createChart(processedData, chartType);
            updateDataCount(processedData.length);
            
            // 통계 정보 표시
            const stats = calculateStatistics(processedData);
            if (stats) {
                console.log('통계 정보:', stats);
                console.log(`점수 범위: ${stats.min}점 ~ ${stats.max}점`);
            }
            
            // 플레이스홀더 숨기기
            document.getElementById('chartPlaceholder').style.display = 'none';
        } else {
            showError('선택한 조건에 해당하는 데이터가 없습니다.');
        }
    } catch (error) {
        console.error('차트 생성 실패:', error);
        showError('차트 생성 중 오류가 발생했습니다: ' + error.message);
    } finally {
        hideLoading();
    }
}

// CSV 데이터 처리 (출력 범위 모드 적용)
function processCSVDataForChart(data, selectedYear) {
    // 1단계: 선택된 연도의 점수 컬럼명 생성
    const scoreColumn = `SCR_EST_${selectedYear}`;
    console.log(`선택된 연도: ${selectedYear}, 점수 컬럼: ${scoreColumn}`);
    
    // 2단계: 필터 적용 및 정렬
    let filteredData = applyFilters();
    console.log('필터 적용 후 데이터 수:', filteredData.length);
    
    // 3단계: 출력 범위에 따라 데이터 선택
    let selectedData = [];
    
    if (selectionMode === 'manual' && selectedUniversities.size > 0) {
        // 수동 선택 모드
        selectedData = filteredData.filter(row => selectedUniversities.has(row.SNM));
        console.log(`수동 선택 모드: ${selectedData.length}개 대학 선택됨`);
    } else {
        // 전체 모드일 때는 데이터 범위 슬라이더 적용
        const startIdx = selectedDataRange.start - 1; // 1부터 시작하므로 -1
        const endIdx = selectedDataRange.end;
        selectedData = filteredData.slice(startIdx, endIdx);
        console.log(`전체 모드: ${startIdx + 1}번째~${endIdx}번째 선택됨 (실제: ${selectedData.length}개)`);
    }

    console.log('최종 선택된 데이터 수:', selectedData.length);

    // 4단계: 차트용 데이터 변환
    return selectedData.map((row, index) => {
        const score = parseFloat(row[scoreColumn]) || 0;
        return {
            university: row['SNM'] || 'Unknown',
            value: score,
            styp: row['STYP'] || '',
            fnd: row['FND'] || '',
            rgn: row['RGN'] || '',
            usc: row['USC'] || '',
            rank: index + 1, // 현재 순위
            label: `${row['SNM']} (점수: ${score})`
        };
    });
}

// Y축 범위 계산 함수
function calculateYAxisRange(data, mode) {
    if (!data || data.length === 0) {
        return { min: 0, max: 10 };
    }
    
    const values = data.map(item => item.value).filter(val => !isNaN(val));
    if (values.length === 0) {
        return { min: 0, max: 10 };
    }
    
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    
    switch(mode) {
        case 'auto':
            // Chart.js 기본 자동 조절
            return { min: undefined, max: undefined };
            
        case 'dataRange':
            // 데이터의 실제 범위
            return { min: dataMin, max: dataMax };
            
        case 'custom':
            // 사용자 지정 범위
            const customMin = document.getElementById('yAxisMin').value;
            const customMax = document.getElementById('yAxisMax').value;
            return {
                min: customMin !== '' ? parseFloat(customMin) : dataMin,
                max: customMax !== '' ? parseFloat(customMax) : dataMax
            };
            
        case 'enhanced':
            // 향상된 표시 (약간의 여백 추가)
            const range = dataMax - dataMin;
            const padding = Math.max(range * 0.1, 0.5); // 최소 0.5의 여백
            return {
                min: Math.max(0, dataMin - padding),
                max: dataMax + padding
            };
            
        default:
            return { min: 0, max: 10 };
    }
}

// Y축 모드 변경 이벤트
function onYAxisModeChange() {
    const mode = document.getElementById('yAxisMode').value;
    const customRangeGroup = document.getElementById('customRangeGroup');
    const customRangeGroupMax = document.getElementById('customRangeGroupMax');
    
    // 사용자 지정 모드일 때만 입력 필드 표시
    if (mode === 'custom') {
        if (customRangeGroup) customRangeGroup.style.display = 'block';
        if (customRangeGroupMax) customRangeGroupMax.style.display = 'block';
        
        // 현재 데이터 범위를 기본값으로 설정
        if (chartData && chartData.length > 0) {
            const values = chartData.map(item => item.value).filter(val => !isNaN(val));
            if (values.length > 0) {
                const dataMin = Math.min(...values);
                const dataMax = Math.max(...values);
                const yAxisMinInput = document.getElementById('yAxisMin');
                const yAxisMaxInput = document.getElementById('yAxisMax');
                if (yAxisMinInput) yAxisMinInput.value = dataMin;
                if (yAxisMaxInput) yAxisMaxInput.value = dataMax;
            }
        }
    } else {
        if (customRangeGroup) customRangeGroup.style.display = 'none';
        if (customRangeGroupMax) customRangeGroupMax.style.display = 'none';
    }
    
    updateCurrentInfo();
    
    // 차트가 있다면 새로운 Y축 설정으로 다시 생성
    if (currentChart && chartData) {
        const chartType = document.getElementById('chartType').value;
        createChart(chartData, chartType);
    }
}

// 사용자 지정 범위 변경 이벤트
function onCustomRangeChange() {
    const mode = document.getElementById('yAxisMode').value;
    if (mode === 'custom' && currentChart && chartData) {
        const chartType = document.getElementById('chartType').value;
        createChart(chartData, chartType);
    }
}

// Chart.js를 사용한 차트 생성
function createChart(data, chartType) {
    const ctx = document.getElementById('mainChart').getContext('2d');
    
    // 기존 차트 제거
    if (currentChart) {
        currentChart.destroy();
    }
    
    chartData = data;
    
    const labels = data.map(item => item.university);
    const values = data.map(item => item.value);
    
    const chartConfig = {
        type: chartType === 'scatter' ? 'scatter' : chartType,
        data: {
            labels: labels,
            datasets: [{
                label: '환경점수',
                data: chartType === 'scatter' ? 
                    data.map((item, index) => ({x: index, y: item.value})) : 
                    values,
                backgroundColor: chartType === 'pie' ? 
                    CHART_COLORS.slice(0, data.length) : 
                    CHART_COLORS[0] + '80',
                borderColor: CHART_COLORS[0],
                borderWidth: 2,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `환경점수 분석 (${currentYear}년)`,
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    color: '#42a5f5'
                },
                legend: {
                    display: chartType === 'pie',
                    position: 'bottom'
                }
            },
            scales: getScaleConfig(chartType),
            elements: {
                point: {
                    radius: chartType === 'scatter' ? 6 : 3,
                    hoverRadius: 8
                }
            }
        }
    };
    
    currentChart = new Chart(ctx, chartConfig);
    console.log('차트 생성 완료');
}

// 차트 타입별 스케일 설정 (Y축 범위 조절 기능 포함)
function getScaleConfig(chartType) {
    if (chartType === 'pie') {
        return {};
    }
    
    // Y축 범위 설정
    const yAxisMode = document.getElementById('yAxisMode')?.value || 'auto';
    const yAxisRange = calculateYAxisRange(chartData, yAxisMode);
    
    const scaleConfig = {
        x: {
            display: true,
            title: {
                display: true,
                text: '대학교',
                color: '#666'
            },
            ticks: {
                maxRotation: 90,
                minRotation: 90,
                font: {
                    size: 10
                }
            }
        },
        y: {
            display: true,
            title: {
                display: true,
                text: '환경점수',
                color: '#666'
            },
            beginAtZero: yAxisRange.min === undefined ? true : false
        }
    };
    
    // Y축 범위 설정 적용
    if (yAxisRange.min !== undefined) {
        scaleConfig.y.min = yAxisRange.min;
    }
    if (yAxisRange.max !== undefined) {
        scaleConfig.y.max = yAxisRange.max;
    }
    
    // 향상된 표시 모드에서는 틱 간격 조정
    if (yAxisMode === 'enhanced' && yAxisRange.min !== undefined && yAxisRange.max !== undefined) {
        const range = yAxisRange.max - yAxisRange.min;
        const stepSize = range / 8; // 8개 정도의 틱
        scaleConfig.y.ticks = {
            stepSize: Math.max(stepSize, 0.1),
            callback: function(value) {
                return Number(value).toFixed(1);
            }
        };
    }
    
    return scaleConfig;
}

// 평균값 데이터로 차트 업데이트
function updateChartWithAverageData() {
    if (!chartData) {
        console.log('차트 데이터가 없습니다.');
        return;
    }
    
    // 대학유형별 평균 계산
    const avgByType = {};
    const avgByFnd = {};
    const avgByRgn = {};
    const avgByUsc = {};
    
    chartData.forEach(item => {
        // 대학유형별
        if (item.styp && item.styp !== '') {
            if (!avgByType[item.styp]) avgByType[item.styp] = [];
            avgByType[item.styp].push(item.value);
        }
        
        // 설립별
        if (item.fnd && item.fnd !== '') {
            if (!avgByFnd[item.fnd]) avgByFnd[item.fnd] = [];
            avgByFnd[item.fnd].push(item.value);
        }
        
        // 지역별
        if (item.rgn && item.rgn !== '') {
            if (!avgByRgn[item.rgn]) avgByRgn[item.rgn] = [];
            avgByRgn[item.rgn].push(item.value);
        }
        
        // 규모별
        if (item.usc && item.usc !== '') {
            if (!avgByUsc[item.usc]) avgByUsc[item.usc] = [];
            avgByUsc[item.usc].push(item.value);
        }
    });
    
    // 대학유형별 평균으로 차트 생성
    const avgData = Object.keys(avgByType).map(type => ({
        university: type,
        value: avgByType[type].reduce((a, b) => a + b, 0) / avgByType[type].length,
        label: `${type} (평균: ${Math.round((avgByType[type].reduce((a, b) => a + b, 0) / avgByType[type].length) * 100) / 100})`,
        styp: type,
        fnd: '',
        rgn: '',
        usc: ''
    }));
    
    // 평균값 기준으로 정렬
    avgData.sort((a, b) => b.value - a.value);
    
    const chartType = document.getElementById('chartType').value;
    createChart(avgData, chartType);
}

// 데이터 검증 함수 (연도별 컬럼 확인)
function validateData(data) {
    if (!data || data.length === 0) {
        return { valid: false, message: '데이터가 없습니다.' };
    }
    
    const requiredColumns = ['SNM', 'STYP', 'FND', 'RGN', 'USC'];
    const availableColumns = Object.keys(data[0] || {});
    
    console.log('사용 가능한 컬럼:', availableColumns);
    console.log('필요한 컬럼:', requiredColumns);
    
    const missingColumns = requiredColumns.filter(col => !availableColumns.includes(col));
    if (missingColumns.length > 0) {
        return { 
            valid: false, 
            message: `필수 컬럼이 누락되었습니다: ${missingColumns.join(', ')}` 
        };
    }
    
    // 연도별 점수 컬럼이 하나 이상 있는지 확인
    const scoreColumns = availableColumns.filter(col => col.match(/^SCR_EST_\d{4}$/));
    if (scoreColumns.length === 0) {
        return {
            valid: false,
            message: 'SCR_EST_YYYY 형태의 점수 컬럼이 없습니다.'
        };
    }
    
    return { valid: true };
}

// 이벤트 핸들러 함수들
function navigateTo(page) {
    switch(page) {
        case 'learning':
            window.location.href = 'page_chartpage_num01.html';
            break;
        case 'development':
            window.location.href = 'page_prediction_num01.html';
            break;
        case 'myservice':
            window.location.href = 'page_userpage_num01.html';  // 현재 페이지
            break;
        case 'mypage':
            alert('마이 페이지로 이동합니다.');
            break;
        case 'main':
            window.location.href = 'page_mainpage_num01.html';
            break;
    }
}

function onYearChange() {
    const year = document.getElementById('yearSelect').value;
    console.log('연도 변경:', year);
    currentYear = year;
    
    updateCurrentInfo();
    
    // 데이터 범위 슬라이더 업데이트 (필터와 연도가 바뀌면 데이터가 달라질 수 있으므로)
    updateDataRangeSliders();
    
    // 수동 선택 모드일 때 대학 목록 업데이트
    if (selectionMode === 'manual') {
        updateUniversityList();
    }
    
    // 차트가 있다면 새로운 연도로 다시 생성
    if (currentChart || csvData) {
        generateChartFromCSV();
    }
}

function onFilterChange() {
    console.log('필터 변경');
    updateCurrentInfo();
    
    // 데이터 범위 슬라이더 업데이트
    updateDataRangeSliders();
    
    // 수동 선택 모드일 때 대학 목록 업데이트
    if (selectionMode === 'manual') {
        updateUniversityList();
    }
    
    // 차트가 있다면 새로운 필터로 다시 생성
    if (currentChart && csvData) {
        generateChartFromCSV();
    }
}

function onChartTypeChange() {
    updateCurrentInfo();
    if (currentChart && chartData) {
        const chartType = document.getElementById('chartType').value;
        createChart(chartData, chartType);
    }
}

function onSortOrderChange() {
    console.log('정렬 방식 변경');
    updateCurrentInfo();
    
    // 정렬 방식이 바뀌면 데이터 순서가 바뀌므로 슬라이더 업데이트
    updateDataRangeSliders();
    
    // 수동 선택 모드일 때 대학 목록 업데이트 (정렬이 바뀌므로)
    if (selectionMode === 'manual') {
        updateUniversityList();
    }
    
    if (currentChart && csvData) {
        generateChartFromCSV();
    }
}

function switchTab(tabName) {
    const tabs = document.querySelectorAll('.chart-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    event.target.classList.add('active');
    
    console.log('탭 전환:', tabName);
    
    if (tabName === 'table2') {
        updateChartWithAverageData();
    } else {
        if (csvData) {
            generateChartFromCSV();
        }
    }
}

function updateCurrentInfo() {
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = currentYear ? `${currentYear}년` : '-';
    }
    
    document.getElementById('currentStyp').textContent = document.getElementById('stypFilter').value;
    document.getElementById('currentFnd').textContent = document.getElementById('fndFilter').value;
    document.getElementById('currentRgn').textContent = document.getElementById('rgnFilter').value;
    document.getElementById('currentUsc').textContent = document.getElementById('uscFilter').value;
    document.getElementById('currentChartType').textContent = CHART_TYPE_NAMES[document.getElementById('chartType').value];
    document.getElementById('currentSortOrder').textContent = SORT_ORDER_NAMES[document.getElementById('sortOrder').value];
    document.getElementById('currentSelectionMode').textContent = 
        selectionMode === 'manual' ? '수동 선택' : '필터링 후 전체';
    
    // Y축 범위 정보 추가 (안전하게 처리)
    const yAxisModeElement = document.getElementById('yAxisMode');
    const yAxisInfoElement = document.getElementById('currentYAxisMode');
    if (yAxisModeElement && yAxisInfoElement) {
        const yAxisMode = yAxisModeElement.value || 'enhanced';
        yAxisInfoElement.textContent = Y_AXIS_MODE_NAMES[yAxisMode] || '향상된 표시';
    }
}

function updateDataCount(count) {
    document.getElementById('dataCount').textContent = `${count}개`;
}

function showLoading() {
    document.getElementById('chartLoading').style.display = 'flex';
    document.getElementById('chartPlaceholder').style.display = 'none';
}

function hideLoading() {
    document.getElementById('chartLoading').style.display = 'none';
}

function showError(message) {
    const placeholder = document.getElementById('chartPlaceholder');
    placeholder.innerHTML = `
        <div class="placeholder-content">
            <div class="placeholder-icon">⚠️</div>
            <h3>오류 발생</h3>
            <p>${message}</p>
            <p style="font-size: 12px; color: #666; margin-top: 10px;">
                파일 경로를 확인하세요: ../../resource/csv_files/예측데이터총합.csv
            </p>
        </div>
    `;
    placeholder.style.display = 'flex';
    hideLoading();
}

function exportChart() {
    if (!currentChart) {
        alert('내보낼 차트가 없습니다. 먼저 차트를 생성해주세요.');
        return;
    }
    
    try {
        const canvas = document.getElementById('mainChart');
        const url = canvas.toDataURL('image/png');
        
        const a = document.createElement('a');
        a.href = url;
        const year = currentYear || 'unknown';
        const filters = `${document.getElementById('stypFilter').value}_${document.getElementById('fndFilter').value}_${document.getElementById('rgnFilter').value}_${document.getElementById('uscFilter').value}`;
        const mode = selectionMode === 'manual' ? 'manual' : 'auto';
        a.download = `libra_environment_chart_${year}_${filters}_${mode}_${new Date().getTime()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        console.log('차트 내보내기 완료');
    } catch (error) {
        console.error('차트 내보내기 실패:', error);
        alert('차트 내보내기에 실패했습니다.');
    }
}

function saveAnalysis() {
    const currentConfig = {
        year: currentYear || 'unknown',
        styp: document.getElementById('stypFilter').value,
        fnd: document.getElementById('fndFilter').value,
        rgn: document.getElementById('rgnFilter').value,
        usc: document.getElementById('uscFilter').value,
        chartType: document.getElementById('chartType').value,
        sortOrder: document.getElementById('sortOrder').value,
        selectionMode: selectionMode,
        dataRange: {
            start: selectedDataRange.start,
            end: selectedDataRange.end
        },
        selectedUniversities: Array.from(selectedUniversities),
        yAxisMode: document.getElementById('yAxisMode').value,
        timestamp: new Date().toISOString()
    };
    
    const savedAnalyses = JSON.parse(localStorage.getItem('libra_environment_analyses') || '[]');
    savedAnalyses.push(currentConfig);
    localStorage.setItem('libra_environment_analyses', JSON.stringify(savedAnalyses));
    
    alert('현재 분석 설정이 즐겨찾기에 저장되었습니다.');
    console.log('분석 저장 완료:', currentConfig);
}

// 통계 정보 계산
function calculateStatistics(data) {
    if (!data || data.length === 0) return null;
    
    const scores = data.map(item => item.value).filter(val => !isNaN(val));
    
    if (scores.length === 0) return null;
    
    const sorted = [...scores].sort((a, b) => a - b);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const median = sorted.length % 2 === 0 
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];
    
    return {
        count: scores.length,
        mean: Math.round(mean * 100) / 100,
        median: Math.round(median * 100) / 100,
        min: Math.min(...scores),
        max: Math.max(...scores)
    };
}

// 페이지 초기화
function initializePage() {
    console.log('환경점수예측 분석 페이지 초기화');
    
    // 기본 CSV 데이터 로드
    loadCSVData();
    
    // 이벤트 리스너 등록
    setupEventListeners();
}

function setupEventListeners() {
    const panelSections = document.querySelectorAll('.panel-section');
    panelSections.forEach((section, index) => {
        section.style.animationDelay = `${index * 0.1}s`;
        section.style.animation = 'fadeInUp 0.6s ease-out both';
    });
}

// 필터 상태 저장/복원
function saveFilterState() {
    try {
        const filterState = {
            year: currentYear || 'unknown',
            styp: document.getElementById('stypFilter')?.value || '전체',
            fnd: document.getElementById('fndFilter')?.value || '전체',
            rgn: document.getElementById('rgnFilter')?.value || '전체',
            usc: document.getElementById('uscFilter')?.value || '전체',
            chartType: document.getElementById('chartType')?.value || 'bar',
            sortOrder: document.getElementById('sortOrder')?.value || 'rank_desc',
            selectionMode: selectionMode,
            dataRange: {
                start: selectedDataRange.start,
                end: selectedDataRange.end
            },
            selectedUniversities: Array.from(selectedUniversities),
            yAxisMode: document.getElementById('yAxisMode')?.value || 'enhanced',
            yAxisMin: document.getElementById('yAxisMin')?.value || '',
            yAxisMax: document.getElementById('yAxisMax')?.value || ''
        };
        
        localStorage.setItem('libra_environment_filter_state', JSON.stringify(filterState));
    } catch (error) {
        console.error('필터 상태 저장 실패:', error);
    }
}

function restoreFilterState() {
    const savedState = localStorage.getItem('libra_environment_filter_state');
    if (savedState) {
        try {
            const filterState = JSON.parse(savedState);
            
            // 연도는 사용 가능한 연도 중에서만 선택
            if (filterState.year && availableYears.includes(parseInt(filterState.year))) {
                currentYear = filterState.year;
                const yearSelect = document.getElementById('yearSelect');
                if (yearSelect) {
                    yearSelect.value = filterState.year;
                }
            }
            
            // 나머지 필터 상태 복원
            Object.keys(filterState).forEach(key => {
                if (key === 'year' || key === 'dataRange' || key === 'selectedUniversities' || key === 'selectionMode') return;
                
                const elementId = key === 'chartType' ? 'chartType' : 
                                key === 'sortOrder' ? 'sortOrder' : 
                                key === 'yAxisMode' ? 'yAxisMode' :
                                key === 'yAxisMin' ? 'yAxisMin' :
                                key === 'yAxisMax' ? 'yAxisMax' :
                                key + 'Filter';
                const element = document.getElementById(elementId);
                if (element && filterState[key] !== undefined) {
                    element.value = filterState[key];
                }
            });
            
            // 선택 모드 복원
            if (filterState.selectionMode) {
                selectionMode = filterState.selectionMode;
                setSelectionMode(selectionMode);
            }
            
            // 데이터 범위 복원
            if (filterState.dataRange) {
                selectedDataRange = filterState.dataRange;
            }
            
            // 선택된 대학 복원
            if (filterState.selectedUniversities) {
                selectedUniversities = new Set(filterState.selectedUniversities);
            }
            
            // Y축 모드에 따라 사용자 지정 입력 필드 표시/숨김
            if (filterState.yAxisMode && typeof onYAxisModeChange === 'function') {
                onYAxisModeChange();
            }
            
            console.log('필터 상태 복원 완료:', filterState);
        } catch (error) {
            console.error('필터 상태 복원 실패:', error);
        }
    }
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
window.addEventListener('load', function() {
    initializePage();
    
    // CSV 로드 완료 후 필터 상태 복원
    setTimeout(() => {
        restoreFilterState();
        updateCurrentInfo();
    }, 500);
});

document.addEventListener('DOMContentLoaded', function() {
    console.log('환경점수예측 분석 페이지 DOM 로드 완료');
    
    // DOM이 로드된 후에도 초기화 시도
    if (document.readyState === 'complete') {
        initializePage();
    }
});

// 페이지 떠날 때 필터 상태 저장
window.addEventListener('beforeunload', function() {
    saveFilterState();
    
    if (currentChart) {
        currentChart.destroy();
    }
    console.log('환경점수예측 분석 페이지를 떠납니다.');
});

// 디버깅용 함수
function debugInfo() {
    console.log('=== 디버깅 정보 ===');
    console.log('현재 연도:', currentYear);
    console.log('사용 가능한 연도:', availableYears);
    console.log('CSV 데이터:', csvData ? csvData.length + '행' : '없음');
    console.log('차트 데이터:', chartData ? chartData.length + '개' : '없음');
    console.log('현재 차트:', currentChart ? '있음' : '없음');
    console.log('선택 모드:', selectionMode);
    console.log('데이터 범위:', selectedDataRange);
    console.log('선택된 대학 수:', selectedUniversities.size);
    
    if (csvData && csvData.length > 0) {
        console.log('컬럼명:', Object.keys(csvData[0]));
        console.log('첫 번째 행:', csvData[0]);
        
        // 점수 컬럼들 확인
        const scoreColumns = Object.keys(csvData[0]).filter(key => key.match(/^SCR_EST_\d{4}$/));
        console.log('점수 컬럼들:', scoreColumns);
        
        // 현재 연도 점수 샘플 값들
        if (currentYear) {
            const currentScoreColumn = `SCR_EST_${currentYear}`;
            const scoreValues = csvData.slice(0, 5).map(row => row[currentScoreColumn]);
            console.log(`${currentScoreColumn} 샘플 값들:`, scoreValues);
        }
    }
    
    // 현재 필터 상태
    console.log('현재 필터 상태:', {
        year: currentYear,
        styp: document.getElementById('stypFilter')?.value,
        fnd: document.getElementById('fndFilter')?.value,
        rgn: document.getElementById('rgnFilter')?.value,
        usc: document.getElementById('uscFilter')?.value
    });
}

// 개발자 도구용 전역 함수 등록
window.debugInfo = debugInfo;
window.libra = {
    csvData,
    chartData,
    currentChart,
    currentYear,
    availableYears,
    selectionMode,
    selectedDataRange,
    selectedUniversities,
    generateChart,
    loadData: loadCSVData,
    debugInfo,
    // 추가 디버깅 함수들
    testFilters: function() {
        if (csvData) {
            console.log('전체 데이터 수:', csvData.length);
            console.log('필터 적용 후:', applyFilters().length);
        }
    },
    showCSVStructure: function() {
        if (csvData && csvData.length > 0) {
            console.log('CSV 구조 분석:');
            const firstRow = csvData[0];
            Object.keys(firstRow).forEach(key => {
                const sampleValues = csvData.slice(0, 3).map(row => row[key]);
                console.log(`${key}:`, sampleValues);
            });
        }
    },
    testYearColumn: function(year) {
        if (csvData && year) {
            const scoreColumn = `SCR_EST_${year}`;
            console.log(`${scoreColumn} 테스트:`);
            const validData = csvData.filter(row => {
                const score = row[scoreColumn];
                return score !== null && score !== undefined && score !== '' && !isNaN(parseFloat(score));
            });
            console.log(`유효한 데이터 수: ${validData.length}개`);
            if (validData.length > 0) {
                const scores = validData.map(row => parseFloat(row[scoreColumn]));
                console.log(`점수 범위: ${Math.min(...scores)} ~ ${Math.max(...scores)}`);
            }
        }
    },
    // 수동 선택 모드 테스트
    testManualMode: function() {
        console.log('수동 선택 모드 테스트');
        console.log('현재 모드:', selectionMode);
        console.log('선택된 대학 수:', selectedUniversities.size);
        console.log('선택된 대학들:', Array.from(selectedUniversities));
        
        const selector = document.getElementById('universitySelector');
        const listContainer = document.getElementById('universityList');
        console.log('selector 표시 상태:', selector ? selector.classList.contains('active') : 'selector 없음');
        console.log('listContainer 내용:', listContainer ? listContainer.children.length + '개 항목' : 'listContainer 없음');
        
        if (listContainer && listContainer.children.length === 0) {
            console.log('대학 목록이 비어있음 - updateUniversityList() 실행');
            updateUniversityList();
        }
    },
    // 수동으로 모드 변경 테스트
    setManualMode: function() {
        setSelectionMode('manual');
    },
    setAllMode: function() {
        setSelectionMode('all');
    }
};