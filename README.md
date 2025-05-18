# MERN Stack Boilerplate

A professional boilerplate for a MERN (MongoDB, Express, React, Node.js) stack project using JavaScript.

## Structure

- `client/` — React frontend
- `server/` — Express backend with MongoDB (Mongoose)

## Getting Started

### Backend
1. `cd server`
2. `npm install`
3. Create a `.env` file (see `.env.example`)
4. `npm run dev`

### Frontend
1. `cd client`
2. `npm install`
3. `npm start`

---

Feel free to expand this boilerplate for your needs!

🏠 Rental Platform – Feature Overview
📌 Navbar
Messages – Link to the user’s personal message page.

Room Owner

All Rentals – Page to manage all listed properties.

🔐 Authentication
Sign Up
Email

Password

Sign In
Secure login for registered users.

🏠 Homepage
Browse Rooms – General browsing functionality.

Search Bar – Search rooms by:

City

Area

Rooms Feed – Shows:

List of available rooms

Number of interested parties

💬 Messages Page
Displays all received messages.

Shows a badge if the message is from a room seeker.

🔎 Browse Page (Search Results)
Displays search results in the format:

bash
Copy
Edit
{number of rooms} {type} of {space m²}
Example: 3 rm. apartment of 90 m²
Includes:

Area, City

Filters:

Category: Apartment, Room, House, Townhouse

Price: Max value

Size: m²

Number of Rooms: Min & Max

Minimum Rental Period:

1–11 months

12–23 months

24+ months

Unlimited

Takeover Date

Lifestyle:

Pet-friendly

Senior-friendly

Students only

Sharable

Social housing

Facilities:

Parking

Elevator

Balcony

Electric Charging Station

Inventory:

Furnished

Dishwasher

Washing Machine

Dryer

📄 Room Info Page
Details:
Room Info:

Format: {number of rooms} {type} of {sq.m}

Full Address:

Example: Strandvangen, 2650 København, Hvidovre

Rental Details:

Monthly net rent

Utilities

Move-in price

CTA Button: Contact or Join Party

📞 Contact / Join Party
Clicking the contact/join button leads to:

Subscription Page (unpaid view)

Landlord Inbox Page (paid view – reveals phone number)

👥 Parties
Available Parties

View other users in the party

Join Party

Join an existing party to split costs or connect with co-renters

🏷️ Property Details (About Property)
Type: House, Apartment, etc.

Rooms

Size (m²)

Amenities:

Furnished

Pets Allowed

Senior Friendly

Balcony

Dishwasher

Electric Charging Station

Energy Rating (e.g. A)

Elevator

Parking

Washing Machine

Dryer

Students Only

Shareable

📋 Rental Details (About Rental)
Rental Period: e.g., 1–11 months

Monthly Net Rent

Utilities

Deposit

Prepaid Rent

Move-in Price

Available From

Creation Date

Listing ID

💳 Subscription Payment Page
Options:

24 hours limited access – 29 kr

4 weeks (Popular) – 349 kr (every 28 days)

2 months – 499 kr (every 62 days)

Payment Methods:

Visa, Mastercard, Dankort, Apple Pay, Google Pay

Cancel anytime online
