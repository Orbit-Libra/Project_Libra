# Model_Libra 프로젝트 패키지 구성

### 00. 디렉토리 구성 및 설명

```

ml_pipeline/
│
├── _Configs/                      # 설정파일 모음 폴더
│   ├── .env                       # 계정 및 패스 설정
│   ├── Num01_Config_RFR.json      # 모델 설정값1, 하이퍼파라미터 등 환경설정 값
│   └── Num02_Config_XGB.json      # 모델 설정값2, 하이퍼파라미터 등 환경설정 값
│
├── _Logs/                              # 로그파일 모음 폴더
│   │
│   ├── Tuner_Logs/                     # 기능성 모듈 패키지
│   │   │
│   │   ├── Num01_extraction.json
│   │   ├── Num01_Tuner_Log.json
│   │   └── Num02_Tuner_Log.json
│   │
│   ├── Num01_RFR_v1.0_Log.json
│   └── Num02_XGB_v1.0_Log.json
│
├── _Models/                            # 각 피클파일 저장소 폴더
│   ├── Num01_ClusterModel_v1.0.pkl
│   ├── Num01_ScalerModel_v1.0.pkl
│   ├── Num01_RFR_cluster_0_v1.0.pkl
│   ├── Num01_RFR_Full_v1.0.pkl
│   └── Num02_XGB_full_v1.0.pkl
│
├── core_utiles/                        # 공통 모듈 전용 폴더
│   ├── __init__.py
│   ├── config_loader.py                # .env 로드 모듈
│   ├── Mapper.py                       # 헤더, 대학명 매핑표 모듈
│   ├── OracleDBConnection.py           # 오라클DB 접속 모듈
│   ├── OracleSchemaBuilder.py          # 테이블 생성 시 데이터타입 보정 모듈
│   ├── OracleTableCreater.py           # 보정 후 테이블 생성 모듈
│   ├── Tool_HeaderConvorter.py         # 컬럼 한영 변환 툴
│   └── Tool_HeaderRemaker.py           # 컬럼 가독성 보완 툴
│
├── DataHandling/                       # 원본파일 CSV파일화 및 DB 업로드 패키지  
│   │  
│   ├── __init__.py  
│   ├── __main__.py                     # DataHandling 패키지 실행  
│   ├── CSVHeaderRenamer.py             # 모든 컬럼 헤더 변경 클래스  
│   ├── CSVToOracleUploader.py          # 테이블 생성 클래스  
│   ├── CWURCrawler.py                  # 대학 평가점수 크롤링 클래스  
│   ├── EnNameCollector.py              # 영문 대학명 리스트화 클래스  
│   ├── ExcelToCSVConverter_ver1.py     # CSV파일 변환 클래스 1  
│   ├── ExcelToCSVConverter_ver2.py     # CSV파일 변환 클래스 2  
│   ├── HeaderAbbreviationMapper.py     # 헤더 한글 영문 매핑 클래스  
│   ├── HeaderTermCollector.py          # 모든 csv파일 컬럼 별 헤더 수집 클래스  
│   ├── NameMapper.py                   # 영문 대학명 한국명으로 매핑 클래스  
│   └── RankedScoreExporter.py          # 연도 별 대학 평가점수 csv 파일 생성  
│  
├── DBHandling/                         # DB테이블 전처리 및 정규화 패키지  
│   │  
│   ├── __init__.py  
│   ├── __main__.py                     # DBHandling 패키지 실행  
│   ├── DataMergerAndExporter.py        # 병합 테이블 생성 클래스  
│   ├── FilteredScoreUploader.py        # 정규화 테이블 생성 클래스  
│   └── TableMergerUploader.py          # 데이터 병합 및 테이블 생성 클래스 
│
├── ModelCreator/                   # 머신러닝 모델 생성 패키지
│   ├── Utils/                      # 기능성 모듈 패키지
│   │   ├── __init__.py
│   │   ├── Evaluator.py            # 평가 지표 계산 모듈 (RMSE, MAE, R2)
│   │   ├── Exporter.py             # 피클 익스포트 모듈
│   │   └── Validator.py            # 데이터 유효성 검증 모듈
│   ├── __init__.py
│   ├── __main__.py                 # 패키지 실행
│   ├── Cleaner.py                  # 결측치/이상치 전처리
│   ├── Controller_Num01.py         # Num01모델용 전체 파이프라인 제어
│   ├── Controller_Num02.py         # Num01모델용 전체 파이프라인 제어
│   ├── Fetcher.py                  # 학습 데이터 추출
│   ├── Handler.py                  # 스케일링, 클러스터링 처리
│   ├── Logger.py                   # 로그 생성
│   ├── ModelLoader.py              # 모델 로딩
│   ├── Predictor.py                # 예측 수행
│   └── Trainer.py                  # 모델 학습 설정
│
├── Predictor/                      # 예측값 생성 패키지
│   ├── __init__.py
│   ├── __main__.py                 # 패키지 실행
│   ├── Controller.py               # 전체 파이프라인 제어
│   ├── PickleLoader.py             # 피클 로딩
│   ├── TableBuilder_Num01.py       # 예측점수 생성 - Num01모델용
│   └── TableBuilder_Num02.py       # 예측점수 생성 - Num02모델용
│
├── Tuner/                      # 모델 튜닝 패키지
│   │  
│   ├── __init__.py  
│   ├── __main__.py             # tuner 패키지 실행  
│   ├── configmanager.py        # 모델 패키지의 컨피그값 수정 클래스  
│   ├── rankevaluator.py        # 튜닝 사이클 별 점수 부여 클래스  
│   ├── searchspace.json        # 하이퍼 파라미터 튜닝 범위 설정값 파일  
│   ├── toprating.json          # 로그파일 중 상위 점수 모델 기록파일  
│   ├── tuner_log.json          # 튜닝 로그 기록파일  
│   ├── tunercontroller.py      # 튜너 패키지 파이프라인 클래스  
│   ├── tunerengine.py          # 튜닝 로직 클래스  
│   ├── tunerlogger.py          # 튜닝 사이클 로그에 기록 클래스  
│   ├── tunerlogranker.py       # 로그에 상위 점수 기록 로직 클래스  
│   └── tuningcyclerunner.py    # 튜닝 사이클 조정 클래스  
│
├── __init__.py
├── __main__.py           # 전체 실행
├── environment.yml       # 가상환경 세팅: conda env create -f environment.yml
├── README.md             # 설명글
└── requirements.txt      # 라이브러리 설치: pip install -r requirements.txt

```





### 01. 환경세팅

두가지 방법 중 택 1

1. environment.yml
" conda env create -f environment.yml " 아나콘다 가상환경 세팅 (모든 라이브러리 포함)

2. requirements.txt
" pip install -r requirements.txt "  직접 필요 라이브러리 설치

### 02. 패키지 경로 설정 및 DB 설정

1. .env 의 패키지 실행시 생성파일 경로 조절
2. Oracle DB 스페이스 지정 및 계정정보 생성

### 03. 최상단 메인코드 실행시의 실행로직

    "DataHandling",
    "DBHandling",
    "ML_RFR",
    "EstimationFlow",
    "ML_XGB",
    "EstimationFuture"