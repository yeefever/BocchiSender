import requests
from bs4 import BeautifulSoup

#bs fail

url = 'https://www.pixiv.net/en/tags/ぼっち・ざ・ろっく%2000/artworks?s_mode=s_tag&ai_type=1' 
response = requests.get(url)
html = response.text
soup = BeautifulSoup(html, 'html.parser')

with open('stuff.html', 'w', encoding='utf-8') as file:
    file.write(str(soup))
    print("Saved")