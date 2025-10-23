# Holyrosa - Pharmacy Management System

A comprehensive pharmacy management system built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Dashboard**: Overview of inventory, sales, and key metrics
- **Medicine Management**: Complete CRUD operations for medicines
- **Delegation**: Store officers can delegate medicines to IPP/Dispensary
- **Sales**: Point-of-sale interface with real-time stock updates
- **Reports**: Date-range reports with CSV export
- **User Management**: Role-based access control (Superadmin, Admin, Store Officer, IPP, Dispensary)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI, Heroicons
- **Forms**: React Hook Form + Yup validation
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Mocking**: MSW (Mock Service Worker)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will start on [http://localhost:3000](http://localhost:3000)

Mock Service Worker will automatically intercept API requests and provide mock responses.

### Test Credentials

- **Superadmin**: superadmin@holyrosa / Password123!
- **Admin**: admin@holyrosa / Password123!
- **Store Officer**: storeofficer@holyrosa / Password123!
- **IPP**: ipp@holyrosa / Password123!
- **Dispensary**: dispensary@holyrosa / Password123!

### Testing

```bash
npm run test
```

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
holyrosa-frontend/
├─ app/              # Next.js App Router pages
├─ components/       # Reusable React components
├─ context/          # React Context providers
├─ hooks/            # Custom React hooks
├─ lib/              # API client and utilities
├─ utils/            # Helper functions
├─ types/            # TypeScript type definitions
├─ mocks/            # MSW mock handlers and data
└─ styles/           # Global styles
```

## Role-Based Access

- **Superadmin**: Full system access including user password reset
- **Admin**: User management (view only for passwords)
- **Store Officer**: Medicine management, delegation to IPP/Dispensary
- **IPP**: View delegated medicines, sales
- **Dispensary**: View delegated medicines, sales

## API Endpoints (Mocked)

All API endpoints are mocked using MSW for development:

- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Get current user
- `GET /api/stats` - Dashboard statistics
- `GET /api/medicines` - List medicines
- `POST /api/medicines` - Create medicine
- `PUT /api/medicines/:id` - Update medicine
- `DELETE /api/medicines/:id` - Delete medicine
- `POST /api/delegations` - Delegate medicine
- `GET /api/delegations` - List delegations
- `POST /api/sales` - Create sale
- `GET /api/sales` - List sales
- `GET /api/users` - List users
- `PUT /api/users/:id/password` - Reset user password (Superadmin only)

## License

MIT
