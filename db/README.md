### 디렉토리 구조

```

db/  
│  
├── Libra_DB_delet_table.sql <- 테이블 초기화 쿼리문  
├── libra_DB.DBF <- Oracle 테이블 스페이스 (셋업 필요)  
└── libra_setup.sql <- 테이블스페이스 자동 생성 쿼리문  


```



### 테이블스페이스 자동 생성법  

sqlplus / as sysdba  

@D:\workspace\project\Project_Libra\1st_Project_MachineLearning\db\libra_setup.sql  



### 테이블 스페이스 접속 계정

ID : libra
PW : ksm0923