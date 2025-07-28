from flask import Flask, render_template
import os

# 현재 파일 기준으로 web 폴더 경로 설정
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEB_DIR = os.path.join(BASE_DIR, '../../web')

app = Flask(
    __name__,
    template_folder=os.path.join(WEB_DIR, 'templates'),
    static_folder=os.path.join(WEB_DIR, 'static')
)
# fetch()로 불러오는 중이라면 @app.route('/header') 등으로 라우팅해줘야 함
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/main')
def main():
    return render_template('main.html')

@app.route('/header')
def header():
    return render_template('header.html')

@app.route('/chartpage_num01')
def header():
    return render_template('chartpage_num01.html')

@app.route('/footer')
def footer():
    return render_template('footer.html')

if __name__ == '__main__':
    app.run(debug=True)
