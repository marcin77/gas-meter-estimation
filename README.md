# ⛽ Gas Meter Estimation — MLR

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org)

**🇬🇧 [English version below](#english-version)**

---

## 🇵🇱 Wersja polska

### Opis

Aplikacja do szacowania odczytów gazomierza przy użyciu **Multiple Linear Regression (MLR)**. Pozwala wczytać dane z pliku CSV, wytrenować model regresji liniowej i porównać odczyty rzeczywiste z szacowanymi. Idealnie wspólpracuje dodatkiem eBUSd i Home Assistant.

Inspirowana Skryptem Python autorstwa [andr2000](https://github.com/andr2000/ufh-controller/blob/872a2783040d9da02c5a526eea54a5c14f791468/gas_meter/meter_readings.py) i artykulem [techniczny.wordpress.com](https://techniczny.wordpress.com/2018/04/08/pomiar-zuzycia-gazu-przez-raspberry-pi-i-ebus/) oraz przewodnikiem MLR [Bee Guan Teo](https://medium.com/ds-notes/multiple-linear-regression-with-scikit-learn-a-quickstart-guide-41a310bd8414).

![Gas Meter Estimation](assets/icons/icon-256.png)
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
| 🖥️ **Aplikacja desktopowa i WEB** | Windows, Linux lub przez przeglądarkę

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
npm run build
```

## Sposoby uruchomienia

# 1. Przeglądarka (najprostsze)
```bash
# Automatycznie otworzy przeglądarkę na http://localhost:8080.
python3 run_web.py
# lub
xdg-open dist/index.html
```
lub dwukrotnie kliknij plik dist/index.html w menedżerze plików

```
# Tryb dev Otworzy się na http://localhost:5173
npm run dev
```

# 2. Aplikacja desktopowa
```
npm run dist:linux    # dla Linux (AppImage)
npm run dist:win      # dla Windows (.exe)
npm run dist:mac      # dla macOS (.dmg)
```
**AppImage (Linux)**

Pobierz z Releases plik .AppImage:

**EXE (Windows)**

Pobierz z Releases plik .exe i uruchom.

**dmg (Apple)**

Pobierz z Releases plik .dmg i uruchom.

**Electron**
```
npm run electron
```


### Odczyt danych 
Powtarzaj te kroki przez kilka dni (przynajmniej przez tydzień, 2–5 razy dziennie), aby uzyskać wystarczającą ilość danych treningowych i testowych, dzięki którym model regresji liniowej będzie działał dokładnie. 

1. Podejdź do licznika gazu i zrób zdjęcie wartości. 
2. Przejdź do strony encji Home Assistant, znajdź encje dla czujników `PrEnergySumHc1` i `PrEnergySumHwc1` i zanotuj wartości najbliższe czasowi znacznika czasu zdjęcia zrobionego w kroku 1.
3. Załaduj dane przykładowe, dodaj/edytuj wiersze odpowiednimi danymi, moższ też usunąc te niepotrzebne lub utworzyć ręcznie plik `meter_readings.csv` i go importować.
4. jezeli masz juz odpowiednią ilośc danych kliknij 'Trenuj model'.
5. Następnie wartości `Intercept` i `Współczynik HC i HWC` skopiuj i wklej do odpowiednich zmiennych w szablonie sensor.

Odczytów należy dokonywać, gdy kocioł nie podgrzewa wody ani grzejników, ponieważ wartości `PrEnergySumHc1` i `PrEnergySumHwc1` rosną bardzo szybko.


### Wymagany format CSV

```csv
FIELD_VALID,FIELD_DATETIME,FIELD_HC,FIELD_HWC,FIELD_METER,FIELD_COMMENT
1,2024-01-15 08:00:00,100,50,1523.400,Odczyt styczeń
1,2024-02-15 08:00:00,250,110,1589.700,Odczyt luty
0,2024-03-15 08:00:00,300,130,9999.000,Błędny odczyt
```
| Kolumna | Typ | Opis |
|---------|-----|------|
| `FIELD_VALID` | `0/1` | Czy wartości wierszy są używane w obliczeniach modelu regresji liniowej, czy nie (1=tak, 0=nie) |
| `FIELD_DATETIME` | `tekst` | Data i czas odczytu |
| `FIELD_HC` | `liczba` | Wartość `PrEnergySumHc1` z kotła w momencie pobrania rzeczywistej wartości z gazomierza|
| `FIELD_HWC` | `liczba` | Wartość `PrEnergySumHwc1` z kotła w momencie pobrania rzeczywistej wartości z gazomierza |
| `FIELD_METER` | `liczba` | Rzeczywista wartość gazomierza |
| `FIELD_COMMENT` | `tekst` | Komentarz (opcjonalny) |


🇬🇧
## english version

### Description

A gas meter reading estimation application using **Multiple Linear Regression (MLR)**. Allows loading data from CSV file, training a linear regression model, and comparing actual readings with estimated ones. Works perfectly with the eBUSd and Home Assistant add-ons.

Inspired by the Python script from [andr2000](https://github.com/andr2000/ufh-controller/blob/872a2783040d9da02c5a526eea54a5c14f791468/gas_meter/meter_readings.py), the article on [techniczny.wordpress.com](https://techniczny.wordpress.com/2018/04/08/pomiar-zuzycia-gazu-przez-raspberry-pi-i-ebus/) and the MLR guide by [Bee Guan Teo](https://medium.com/ds-notes/multiple-linear-regression-with-scikit-learn-a-quickstart-guide-41a310bd8414).

![Gas Meter Estimation](assets/icons/icon-256.png)

### Features

| Feature | Description |
|---------|-------------|
| 📂 **Import/Export CSV** | Load and save data in CSV format |
| 📋 **Export JSON** | Export data to JSON format |
| ➕ **Add Rows** | Form for adding new readings |
| ✏️ **Edit Rows** | Inline editing of existing data |
| 🗑️ **Delete Rows** | Delete with confirmation |
| 🔄 **Toggle Valid (0/1)** | Rows with Valid=0 are excluded from the model |
| 🚀 **Train Model** | Linear regression with configurable parameters (test_size, random_state) |
| 📊 **Model Results** | Intercept, HC/HWC coefficients, R² (Training/Testing), MAE, RMSE |
| 📋 **Estimation Table** | Comparison of actual vs. estimated readings (color-coded errors: 🟢 < 1, 🟡 < 5, 🔴 ≥ 5) |
| 🧮 **Prediction** | Manual input of HC and HWC — calculates estimated reading |
| 📋 **Copy Coefficients** | Copy buttons for Intercept, HC, HWC with full precision |
| ☀️🌙 **Light/Dark Theme** | Toggle with persistence |
| 🇵🇱🇬🇧 **Language PL/EN** | Toggle with persistence |
| 🕐 **Last Data** | Automatically remembers and quickly loads data from previous session |
| 🖥️ **Desktop & WEB Application** | Windows, Linux, or via browser |

## 📸 Screenshots

| Data View | Model Results | Prediction |
|-----------|---------------|------------|
| ![Data](screenshots/data.png) | ![Results](screenshots/results.png) | ![Predict](screenshots/predict.png) |

## 🛠️ Installation

### Requirements
- Node.js 18+
- npm or yarn

### Installation Steps

```bash
# Clone the repository
git clone https://github.com/marcin77/gas-meter-estimation.git
cd gas-meter-estimation

# Install dependencies
npm install
npm run build
```

## How run

# 1. Browser (simplest)
```bash
# Automatically opens browser at http://localhost:8080.
python3 run_web.py
# or
xdg-open dist/index.html
```
Or double-click the dist/index.html file in your file manager

```
# Dev mode - Opens at http://localhost:5173
npm run dev
```

# 2. Desktop Application
```
npm run dist:linux    # for Linux (AppImage)
npm run dist:win      # for Windows (.exe)
npm run dist:mac      # for macOS (.dmg)
```
**AppImage (Linux)**

Download the .AppImage file from Releases:

**EXE (Windows)**

Download the .exe file from Releases and run.

**dmg (Apple)**

Download the .dmg file from Releases and run.

**Electron**
```
npm run electron
```

### Reading the Data
Repeat these steps for several days (at least a week, 2-5 times a day) to obtain enough training and test data for the linear regression model to perform accurately. 

1. Go to the gas meter and take a photo of the values.
2. Go to the Home Assistant entity page, find the entities for the `PrEnergySumHc1` and `PrEnergySumHwc1` sensors, and note the values ​​closest to the timestamp of the photo you took in step 1.
3. Load the sample data, add/edit rows with the appropriate data, or delete unnecessary ones or manually create a `meter_readings.csv` file and import it.
4. If you already have the appropriate amount of data, click 'Train model'.
5. Then copy and paste the `Intercept` and `HC and HWC Coefficient` values ​​into the appropriate variables in the sensor template.

You should take the readings when the boiler is not heating water or radiators as the `PrEnergySumHc1` and `PrEnergySumHwc1` values go up really quickly.

   
### Required CSV Format

```csv
FIELD_VALID,FIELD_DATETIME,FIELD_HC,FIELD_HWC,FIELD_METER,FIELD_COMMENT
1,2024-01-15 08:00:00,100,50,1523.400,Odczyt styczeń
1,2024-02-15 08:00:00,250,110,1589.700,Odczyt luty
0,2024-03-15 08:00:00,300,130,9999.000,Błędny odczyt
```
| Kolumna | Typ | Opis |
|---------|-----|------|
| `FIELD_VALID` | `0/1` | This value defines if the rows' values are used in linear regression model calculations or not (1=yes, 0=no) |
| `FIELD_DATETIME` | `tekst` | Reading date and time |
| `FIELD_HC` | `liczba` | Value of a `PrEnergySumHc1` from the boiler at the time when you captured the actual gas meter value |
| `FIELD_HWC` | `liczba` | Value of a `PrEnergySumHwc1` from the boiler at the time when you captured the actual gas meter value |
| `FIELD_METER` | `liczba` | Actual value of the gas meter |
| `FIELD_COMMENT` | `tekst` | Comment (optional) |



### Autorzy / Źródła / Authors / Sources
+ **marcin77** — GUI / aplikacja webowa / GUI / web application 
+ **andr2000** — oryginalny skrypt Python / original Python script
+ **techniczny** — pomiar zużycia gazu przez Raspberry Pi / measuring gas consumption by Raspberry Pi
+ **Bee Guan Teo** — przewodnik MLR / MLR guide
