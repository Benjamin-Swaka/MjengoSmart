# 🏗️ MjengoSmart

### **An Integrated Geospatial Information System for Construction Resource Optimization and Labor Management**

![Python](https://img.shields.io/badge/Python-Django-blue)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PostGIS-336791)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Overview

**MjengoSmart** is a full-stack GIS-enabled web platform developed as a final-year university project to transform the construction supply chain in Kenya. The platform connects homeowners, contractors, hardware suppliers, and skilled construction workers through a centralized digital marketplace powered by geospatial technologies.

Unlike traditional marketplaces, MjengoSmart integrates **location intelligence**, **construction material estimation**, **real-time supplier discovery**, **verified labor management**, and **delivery tracking** into one unified platform.

The system addresses the challenges of fragmented construction procurement by providing transparent pricing, verified service providers, optimized logistics, and intelligent decision-making tools.

---

# Project Title

**MjengoSmart: An Integrated Geospatial Information System for Construction Resource Optimization and Labor Management**

---

# Problem Statement

The construction industry in Kenya continues to face several operational challenges, particularly among small-scale developers, homeowners, and independent contractors.

Current construction procurement processes are largely manual and involve:

* Visiting multiple hardware stores to compare prices
* Limited visibility of nearby suppliers
* Lack of real-time material availability
* Difficulty finding verified skilled labor
* Poor transparency in pricing
* No standardized reputation system for fundis
* Inefficient logistics and delivery coordination

Existing e-commerce platforms do not address the unique logistical and workforce management requirements of the construction sector.

MjengoSmart was developed to solve these challenges through an integrated geospatial information system.

---

# Main Objective

To design and develop an integrated web-based platform that optimizes construction resource sourcing, delivery coordination, and labor management using geospatial technologies.

---

# Specific Objectives

* Develop a construction material estimation module.
* Build a GIS-powered supplier marketplace.
* Compare supplier prices and material availability.
* Implement location-based supplier discovery.
* Develop a reputation-based directory for skilled workers.
* Support milestone-based labor management.
* Enable online ordering and booking.
* Improve transparency within the construction supply chain.

---

# Key Features

## 🗺️ GIS Supplier Marketplace

* Interactive map displaying suppliers
* Nearby supplier search
* Distance calculations
* Location-based recommendations
* Supplier profiles

---

## 🧱 Construction Material Marketplace

* Browse construction materials
* Material categories
* Inventory management
* Real-time pricing
* Supplier comparison
* Stock availability

---

## 📐 Material Estimation Module

Users can estimate required construction materials based on project specifications.

Examples include:

* Cement estimation
* Sand estimation
* Ballast estimation
* Steel reinforcement estimation
* Roofing materials
* Bricks and blocks

The estimation module helps reduce wastage and improve budgeting.

---

## 👷 Skilled Labor Directory

The platform includes a verified labor marketplace featuring:

* Masons
* Electricians
* Plumbers
* Painters
* Welders
* Carpenters
* General Fundis

Each worker profile includes:

* Experience
* Daily rates
* Ratings
* Reviews
* Portfolio
* Availability
* Location

---

## ⭐ Reputation System

Workers and suppliers can receive:

* Customer ratings
* Reviews
* Reputation scores
* Verification status

This helps clients make informed hiring decisions.

---

## 📦 Order Management

Clients can:

* Order materials
* Track order status
* View purchase history
* Manage deliveries
* Monitor order progress

---

## 📅 Worker Booking System

Clients can:

* Book workers
* Select project dates
* Negotiate rates
* Track booking status
* Manage milestones

---

## 🔔 Notification System

Real-time notifications for:

* Orders
* Bookings
* Reviews
* Delivery updates
* System announcements

---

## 🔐 Authentication & Authorization

* JWT Authentication
* Role-based access control

Supported roles include:

* Client
* Supplier
* Worker
* Administrator

---

## 📊 User Dashboard

Personalized dashboards provide:

* Orders
* Revenue statistics
* Bookings
* Notifications
* Analytics
* Supplier inventory
* Worker activities

---

# Technology Stack

## Frontend

* React 19
* TypeScript
* Vite
* Tailwind CSS
* React Router
* Axios
* React Leaflet

---

## Backend

* Python
* Django
* Django REST Framework
* GeoDjango
* Gunicorn

---

## Database

* PostgreSQL
* PostGIS

---

## Mapping & GIS

* Leaflet.js
* React Leaflet
* OpenStreetMap
* GeoDjango Spatial Queries

---

## Authentication

* JWT
* Simple JWT

---

## APIs

* OpenStreetMap
* Leaflet
* M-Pesa STK Push *(planned integration)*
* Google Maps Distance Matrix *(optional future enhancement)*

---

# System Architecture

```
React Frontend
       │
       ▼
REST API (Django REST Framework)
       │
       ▼
GeoDjango Business Logic
       │
       ▼
PostgreSQL + PostGIS
       │
       ▼
Spatial Queries & GIS Analysis
```

---

# Project Structure

```
MjengoSmart
│
├── backend
│   ├── users
│   ├── suppliers
│   ├── materials
│   ├── orders
│   ├── reviews
│   ├── notifications
│   ├── mjengosmart
│   ├── manage.py
│   └── requirements.txt
│
├── frontend
│   ├── src
│   ├── public
│   ├── package.json
│   └── vite.config.ts
│
├── README.md
└── docker-compose.yml
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/mjengosmart.git

cd mjengosmart
```

---

## Backend Setup

```bash
cd backend

python -m venv venv

source venv/bin/activate
```

Windows

```bash
venv\Scripts\activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

Run migrations

```bash
python manage.py migrate
```

Create superuser

```bash
python manage.py createsuperuser
```

Start server

```bash
python manage.py runserver
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

# Future Enhancements

* AI-powered material recommendation engine
* Construction cost prediction
* Supplier demand forecasting
* Delivery route optimization
* Mobile application
* Real-time driver tracking
* AI labor recommendation
* Digital contracts
* Escrow payment system
* IoT inventory integration

---

# Academic Significance

This project demonstrates practical implementation of:

* Geographic Information Systems (GIS)
* Full-Stack Web Development
* REST API Development
* Spatial Database Design
* System Engineering
* Software Architecture
* Database Management
* Human Computer Interaction
* Construction Informatics

---

# Sustainable Development Goals (SDGs)

MjengoSmart contributes to:

* SDG 8 – Decent Work and Economic Growth
* SDG 9 – Industry, Innovation and Infrastructure
* SDG 11 – Sustainable Cities and Communities

It also aligns with Kenya's Affordable Housing Programme by improving access to construction resources, reducing procurement costs, and empowering local suppliers and skilled workers through digital transformation.

---

# Contributors

**Benjamin Swaka**

Bachelor of Science in Information Communication Technology

Final Year Project

Jaramogi Oginga Odinga University of Science and Technology (JOOUST)

---

# License

This project is developed for academic purposes.

© 2026 Benjamin Swaka. All Rights Reserved.
