### 디렉토리 구조

```

resource/  
│  
├── csv_files/  <- 로우파일 베이스 가공된 모든 csv 파일 저장경로  
│   │  
│   ├── csv_data/ <- csv 변환 데이터 & 크롤링 데이터 파일 저장경로  
│   │   │  
│   │   └── Num00~07.....csv <- 로우파일 및 크롤링 데이터 가공파일  
│   │  
│   └── 데이터.csv <- 전처리 과정 및 결과물  
│  
├── raw_files/  
│   │  
│   └── 기본통계_...xlsx <- 대학도서관 데이터  

```



### 테이블스페이스 자동 생성법  

sqlplus / as sysdba  

@D:\workspace\project\Project_Libra\1st_Project_MachineLearning\db\libra_setup.sql  



### 테이블 스페이스 접속 계정

ID : libra
PW : ksm0923