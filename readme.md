# Mercado Pago Integration - Salesforce Commerce Cloud

This project implements the Mercado Pago integration as a payment method for the Salesforce Commerce Cloud (SFCC) platform.

## 📋 Description

The `int_mercadopago` cartridge provides a complete integration of Mercado Pago as a payment gateway for SFCC stores, allowing secure and efficient payment processing.

## 🚀 Features

- Mercado Pago Integration
- Support for multiple payment methods
- Secure transaction processing
- Responsive and user-friendly interface
- Compatible with Salesforce Commerce Cloud

## 🛠️ Requirements

- Node.js (version specified in `.nvmrc` file)
- Salesforce Commerce Cloud
- Mercado Pago account with API credentials

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/mercadopago/payment-salesforce-plugin
```

2. Install dependencies:
```bash
npm install
```

3. Configure Mercado Pago credentials

## 🚀 Usage

### Available Scripts

- `npm run lint`: Runs code verification
- `npm run lint:fix`: Automatically fixes linting issues
- `npm run upload`: Uploads the cartridge
- `npm run test`: Runs unit tests
- `npm run uploadCartridge`: Specifically uploads the int_mercadopago cartridge
- `npm run watch`: Starts watch mode for development
- `npm run compile:js`: Compiles JavaScript files
- `npm run compile:scss`: Compiles SCSS files
- `npm run build`: Compiles all assets (JS and SCSS)

## 🧪 Testing

To run unit tests:

```bash
npm test
```

## 📦 Project Structure

```
.
├── cartridges/        # SFCC Cartridges
├── doc/              # Documentation
├── e2e/              # End-to-end tests
├── test/             # Unit tests
├── metadata/         # Metadata files
└── ...
```

## 📧 Support

Access the official Mercado Pago documentation for more information:
[BR](https://www.mercadopago.com.br/developers/pt/docs/salesforce-commerce-cloud/landing)
[AR](https://www.mercadopago.com.ar/developers/es/docs/salesforce-commerce-cloud/landing)
[CL](https://www.mercadopago.cl/developers/es/docs/salesforce-commerce-cloud/landing)
[CO](https://www.mercadopago.com.co/developers/es/docs/salesforce-commerce-cloud/landing)
[PE](https://www.mercadopago.com.pe/developers/es/docs/salesforce-commerce-cloud/landing)
[MX](https://www.mercadopago.com.mx/developers/es/docs/salesforce-commerce-cloud/landing)

## 🔄 Changelog

See the [CHANGELOG.md](CHANGELOG.md) file for information about changes in each version.
