# ⛽ Gas Meter Estimation — MLR

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org)

**🇬🇧 [English version below](#-english-version)**

---

## 🇵🇱 Wersja polska

### Opis

Aplikacja do szacowania odczytów gazomierza przy użyciu **Multiple Linear Regression (MLR)**. Pozwala wczytać dane z pliku CSV, wytrenować model regresji liniowej i porównać odczyty rzeczywiste z szacowanymi.

Bazuje na skrypcie Python autorstwa [andr2000](https://github.com/andr2000/ufh-controller/blob/872a2783040d9da02c5a526eea54a5c14f791468/gas_meter/meter_readings.py) i artykule [techniczny.wordpress.com](https://techniczny.wordpress.com/2018/04/08/pomiar-zuzycia-gazu-przez-raspberry-pi-i-ebus/) oraz przewodniku MLR [Bee Guan Teo](https://medium.com/ds-notes/multiple-linear-regression-with-scikit-learn-a-quickstart-guide-41a310bd8414).

### Funkcje

| Funkcja | Opis |
|---------|------|
| 📂 **Import/Export CSV** | Wczytywanie i zapisywanie danych w formacie CSV |
| 📋 **Export JSON** | Eksport danych do formatu JSON |
| ➕ **Dodawanie wierszy** | Formularz do dodawania nowych odczytów |
| ✏️ **Edycja wierszy** | Edycja istniejących danych inline |
| 🗑️ **Usuwanie wierszy** | Usuwanie z potwierdzeniem |
| 🔄 **Toggle Valid (0/1)** | Wiersze z Valid=0 nie są brane pod uwagę w modelu |
| 🚀 **Trenowanie modelu** | Regresja liniowa z konfigurowalnymi parametrami (test_size, random_state) |
| 📊 **Wyniki modelu** | Intercept, współczynniki HC/HWC, R² (Training/Testing), MAE, RMSE |
| 📋 **Tabela estymacji** | Porównanie odczytów rzeczywistych z szacowanymi (błędy kolorowane: 🟢 < 1, 🟡 < 5, 🔴 ≥ 5) |
| 🧮 **Predykcja** | Ręczne wprowadzanie HC i HWC — obliczanie estymowanego odczytu |
| 📋 **Kopiowanie współczynników** | Przyciski Copy przy Intercept, HC, HWC z pełną precyzją |
| ☀️🌙 **Motyw jasny/ciemny** | Przełącznik z zapamiętywaniem |
| 🇵🇱🇬🇧 **Język PL/EN** | Przełącznik z zapamiętywaniem |
| 🕐 **Ostatnie dane** | Automatyczne zapamiętywanie i szybkie wczytanie danych z poprzedniej sesji |
| 🖥️ **Aplikacja desktopowa** - Windows, Linux lub przez przeglądarkę

### Wymagany format CSV

```csv
FIELD_VALID,FIELD_DATETIME,FIELD_HC,FIELD_HWC,FIELD_METER,FIELD_COMMENT
1,2024-01-15 08:00,100,50,1523.400,Odczyt styczeń
1,2024-02-15 08:00,250,110,1589.700,Odczyt luty
0,2024-03-15 08:00,300,130,9999.000,Błędny odczyt
Kolumna	Typ	Opis
FIELD_VALID	0/1	Czy wiersz jest prawidłowy (1=tak, 0=nie)
FIELD_DATETIME	tekst	Data i czas odczytu
FIELD_HC	liczba	Heat Counter — licznik ciepła
FIELD_HWC	liczba	Hot Water Counter — licznik ciepłej wody
FIELD_METER	liczba	Odczyt gazomierza
FIELD_COMMENT	tekst	Komentarz (opcjonalny)

Sposoby uruchomienia
1. Przeglądarka (najprostsze)
Otwórz dist/index.html bezpośrednio w przeglądarce:

Bash

firefox dist/index.html
# lub
xdg-open dist/index.html
# lub dwukrotnie kliknij plik w menedżerze plików
2. Serwer lokalny (Python)
Bash

python3 run_desktop.py
Automatycznie otworzy przeglądarkę na http://localhost:8080.

3. Dev server (z hot-reload)
Bash

npm install
npm run dev
Otworzy się na http://localhost:5173 — zmiany w kodzie natychmiast się odświeżają.

4. Build produkcyjny
Bash

npm run build
Wynik w dist/index.html — jeden plik HTML z całą aplikacją.

5. AppImage (Linux)
Pobierz z Releases plik .AppImage:

Bash

chmod +x GasMeterEstimation.AppImage
./GasMeterEstimation.AppImage
6. EXE (Windows)
Pobierz z Releases plik .exe i uruchom.

7. Electron
Bash

npm run electron
Skrót na pulpicie (Linux)
Bash

cat > ~/.local/share/applications/gas-meter.desktop << EOF
[Desktop Entry]
Name=Gas Meter Estimation
Comment=MLR Gas Meter Estimation
Exec=xdg-open /ścieżka/do/dist/index.html
Icon=utilities-system-monitor
Terminal=false
Type=Application
Categories=Utility;
EOF
Wymagania
Przeglądarka — do uruchomienia dist/index.html (Firefox, Chrome, Edge)
Python 3 — do run_desktop.py (opcjonalne)
Node.js 18+ — tylko do budowania ze źródeł (npm run build)
Struktura projektu
text

gas-meter-estimation/
├── dist/
│   └── index.html           # Gotowa aplikacja (jeden plik HTML)
├── src/
│   ├── App.tsx               # Główny komponent React
│   ├── linearRegression.ts   # Moduł regresji liniowej
│   ├── main.tsx              # Entry point
│   └── index.css             # Style Tailwind CSS
├── run_desktop.py            # Launcher — otwiera w przeglądarce
├── index.html                # Szablon HTML (Vite)
├── package.json              # Zależności npm
├── vite.config.ts            # Konfiguracja Vite
├── tailwind.config.js        # Konfiguracja Tailwind CSS
└── README.md                 # Ten plik
Technologie
React 18 — interfejs użytkownika
TypeScript — typowanie
Vite — bundler
Tailwind CSS — stylizacja
PapaParse — parsowanie CSV
Lucide Icons — ikony
vite-plugin-singlefile — budowanie do jednego pliku HTML
Licencja
MIT License — wolna licencja, możesz używać, modyfikować i dystrybuować.

Autorzy / Źródła
marcin77 — GUI / aplikacja webowa
andr2000 — oryginalny skrypt Python
techniczny — pomiar zużycia gazu przez Raspberry Pi
Bee Guan Teo — przewodnik MLR
Wsparcie / Zgłaszanie błędów
GitHub Issues



# ⛽ Gas Meter Estimation — MLR

Aplikacja do szacowania odczytów gazomierza z wykorzystaniem regresji liniowej wielorakiej (Multiple Linear Regression).

![Gas Meter Estimation](assets/icons/icon-256.png)

## 🚀 Funkcje

- 📊 **Regresja liniowa** - szacowanie odczytów na podstawie HC (heat counter) i HWC (hot water counter)
- 📁 **Import/Export CSV** - łatwe zarządzanie danymi
- 📈 **Wizualizacja wyników** - R², MAE, RMSE
- 🌙 **Tryb ciemny/jasny** - dostosowanie do preferencji
- 🌍 **Wielojęzyczność** - PL/EN
- 💾 **Zapamiętywanie ustawień** - localStorage / Electron storage
- 🖥️ **Aplikacja desktopowa** - Windows, Linux, macOS

## 📸 Zrzuty ekranu

| Widok danych | Wyniki modelu | Predykcja |
|--------------|---------------|-----------|
| ![Data](screenshots/data.png) | ![Results](screenshots/results.png) | ![Predict](screenshots/predict.png) |

## 🛠️ Instalacja

### Wymagania
- Node.js 18+
- npm lub yarn

### Kroki instalacji

```bash
# Sklonuj repozytorium
git clone https://github.com/marcin77/gas-meter-estimation.git
cd gas-meter-estimation

# Zainstaluj zależności
npm install

# Uruchom w trybie deweloperskim
npm run dev

# Zbuduj aplikację desktopową
npm run build
npm run dist:linux    # dla Linux (AppImage)
npm run dist:win      # dla Windows (.exe)
npm run dist:mac      # dla macOS (.dmg)
