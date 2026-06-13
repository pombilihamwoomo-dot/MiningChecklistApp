# DEMO_SCRIPT
## Safety Checklist Application Demo
### Step 1: User Registration

1. Open the application.
2. Select **Register**.
3. Enter:

   * Full Name
   * Email Address
   * Password
   * Role (Worker or Supervisor)
4. Submit the registration form.
5. Demonstrate that the user profile is created and stored.

### Step 2: Worker Login

1. Login using a Worker account.
2. The application routes the user to the **Worker Dashboard**.
3. Display:

   * Worker name
   * Clock In / Clock Out controls
   * Previous checklist submissions
   * New Safety Check button

### Step 3: Start a Shift

1. Press **Clock In**.
2. Show that the shift timer starts running.
3. Explain that shift information is stored in Firestore and persists if the app is reopened.

### Step 4: Complete a Safety Checklist

1. Select **New Safety Check**.
2. Complete the checklist:

   * Safety Helmet
   * Dust Mask
   * Emergency Kit
3. Observe the progress bar updating as items are checked.
4. Leave one item unchecked to demonstrate the warning banner.
5. Add optional comments.
6. Submit the checklist.

### Step 5: Verify Submission

1. Return to the Worker Dashboard.
2. Show that the newly submitted checklist appears in the submission history.
3. Explain that the dashboard refreshes automatically when returning from the checklist screen.

### Step 6: End the Shift

1. Press **Clock Out**.
2. Confirm the clock-out action.
3. Show that the shift duration is recorded.

### Step 7: Supervisor Login

1. Log out of the Worker account.
2. Login using a Supervisor account.
3. The application routes the user to the **Supervisor Dashboard**.

### Step 8: Supervisor Dashboard Features

1. Display the summary statistics:

   * Total Submissions
   * All-Clear Count
   * Incomplete Count
   * Absent Worker Count
2. Show checklist submissions grouped by date.
3. Demonstrate how incomplete submissions are identified.
4. Demonstrate how absent workers are detected.

### Step 9: Logout

1. Select **Logout**.
2. Verify that the application returns to the Login screen.

## Technologies Demonstrated

* React Native with Expo
* Firebase Authentication
* Firebase Firestore
* React Navigation
* Expo Vector Icons (Ionicons)
