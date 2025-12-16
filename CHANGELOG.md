# Changelog

## [25.6.1] - 2025-12-16

### Fixed
- Update unit price calculation in preference to use SFCC api.

## [25.6.0] - 2025-07-29

### Added
- Add new payment method to MLC - FINTOC

## [25.5.3] - 2025-07-16

### Added
- Do not show installments taxes for MLA if not received from API

## [25.5.2] - 2025-07-10

### Added
- Show installments taxes for MLA

## [25.5.1] - 2025-06-11

### Fix
Added translation keys for MLB

### Updated
- Updated Readme file
- Replaces metrics calls from directly calling Melidata to calling Core Monitor.

## [25.5.0] - 2025-05-19

### Updated
- Updated the Mercado Pago branding across all checkouts, admin panel, and success pages.
- Updated of document form for offline media, pix and credit card
- Improving error message for the buyer when card_token_id is invalid

### Added
- Added Payer address in payment payload if payment type is "bolbradesco"
- Added default expiration value for payment for PIX
- Added default expiration value for payment for methods off

### Fix
- Fix of sending document type in methods off
- Fix validation of document fields
- Fix QR code for PIX in congrats screen

## [25.4.1] - 2025-02-11

### Fix
- Added error handling when updating order details in the notification flow
- Fixed ChoPro text on the Place Order screen

### Added
- Added tests end to end

## [24.4.0] - 2024-10-03

### Added
- Add tokenization of saved cards
- Changed card saving flow
- Added installments when paying with saved cards
- Removal of links and buttons to add cards in the customer area

## [24.3.2] - 2024-09-23

- Rebranding of Mercado Credits
- Adjustment of Checkout Pro's layout 

## [24.3.1] - 2024-07-04

- Correction in the rendering of checkout pro content by country
- Lint corrections and removal of unused code/files

## [24.3.0] - 2024-06-10

### Added
- Add payment with methods Off

## [24.2.1] - 2024-04-08

### Added
- Correction in payment with 3DS

## [24.2.0] - 2024-03-18

### Added
- Added error messages (remedies) to payers and sellers
- Added new iframe for payment with 3DS


## [24.1.0] - 2024-01-23

### Added
- Added information about interest on installments

