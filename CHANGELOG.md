# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-03-08

### Added
- Update checker — automatic new version detection via GitHub Releases API
- Update notification banner with download links
- Update dialog with version info and downloadable assets
- New gas meter icon in header and About modal
- Help modal with detailed usage instructions
- About modal with version, authors, license and support links
- Support links: Buy Me a Coffee, Ko-fi, PayPal
- Auto-fill current date/time when adding new row

### Changed
- Improved SVG icon orientation and positioning
- Enhanced readability in both light and dark themes
- Better contrast ratios across all UI elements

### Fixed
- Icon clipping at container edges
- Header element alignment
- Port release issue in run_desktop.py (Ctrl+C now properly frees port)
- CSV header validation on import

## [1.0.1] - 2026-03-05

### Added
- Light/Dark theme toggle with localStorage persistence
- Language switcher (Polish/English) with persistence
- Copy buttons for Intercept, HC, HWC coefficients with full precision
- Last data recall — quick reload from previous session
- Desktop launcher script (run_desktop.py)
- Data table pagination (20 rows per page)
- JSON export support
- Electron builds (AppImage, EXE, DMG)

### Fixed
- localStorage issue in AppImage builds
- Error color coding in estimation table

## [1.0.0] - 2026-03-01

### Added
- Initial stable release
- CSV Import/Export with drag & drop support
- Add, edit, delete data rows
- Valid toggle (0/1) — exclude rows from model training
- Multiple Linear Regression model (configurable test_size, random_state)
- Model results: Intercept, HC/HWC coefficients, R² (Training/Testing), MAE, RMSE
- Estimation table — actual vs estimated readings comparison
- Manual prediction — enter HC + HWC to calculate estimated reading
- Built-in sample data for quick testing
- Single HTML file build (vite-plugin-singlefile)

### Technical
- React 18 + TypeScript + Vite + Tailwind CSS
- PapaParse for CSV parsing
- Lucide Icons
- Linear regression implementation in JavaScript (normal equation method)