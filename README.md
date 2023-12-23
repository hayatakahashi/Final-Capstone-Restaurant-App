# Final Capstone - Restaurant Reservation App

**Link to the live application:**

[Live Application](https://restaurant-app-frontend-6288.onrender.com)

**Link to the backend server:**

[Backend Server](https://restaurant-app-backend-u2lv.onrender.com)

### Project Description: ###

The Restaurant Reservation App is a streamlined solution for restaurant managers to effectively oversee and manage reservations. It equips restaurant staff with the ability to view and organize reservations by date, seamlessly update reservation statuses, and assign guests to tables. The app features a comprehensive dashboard displaying a dynamic overview of both reservations and table statuses. Additionally, it empowers restaurant teams with tools to efficiently search for, create new reservations, and add new tables, thereby enhancing the overall management of dining operations.

<hr>

Dashboard View
  <br>
   
<img width="1470" alt="reservation-dashboard" src="images/screenshot/Screenshot 2023-12-22 at 9.06.23 PM.png" >
  <br>
<hr>
  

### Backend Architecture ###

The backend of our Restaurant Reservation App is built on RESTful API principles, with a structured approach to routing. Each route, notably /tables and /reservations, is supported by three core components to ensure streamlined functionality:

- **Router:** This component defines accessible routes and permissible HTTP methods. An in-built error handler effectively mitigates unauthorized method requests.
  
- **Controller:** Here, functions responsible for processing requests to the database reside. It includes validation middleware to filter out user input errors, upholding the restaurant's operational policies. Any rule violations by users are reflected in the user interface.
  
- **Service:** This layer leverages Knex for executing database queries, utilizing comprehensive CRUDL (Create, Read, Update, Delete, List) operations.

### Technologies Used: ###

**Frontend:**

- React.js
- CSS

**Backend:**

- Express
- Node.js
- PostgreSQL

### Getting Started with Installation: ###

To begin, fork and clone the repository to your local environment.

1. Execute `npm install` to install all necessary dependencies.
2. Use `npm run start:dev` to initiate the server in development mode.

**Testing the Application:**

- For comprehensive tests, run `npm test`.
- To test only the backend, use `npm run test:backend`.
- For frontend-specific tests, execute `npm run test:frontend`.
