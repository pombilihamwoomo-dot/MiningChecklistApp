# Demo Test Checklist

Use this checklist before recording or presenting MiningChecklistApp.

## Run The App

- Run `npm install` after cloning or pulling the branch.
- Start the Expo development server with `npm start` or `npx expo start`.
- Open the app in Expo Go, Android emulator, iOS simulator, or web mode if supported.
- Confirm Firebase configuration is available before testing login, registration, or checklist submission.

## Worker Flow

- Open the app successfully in Expo.
- Register or log in as a worker.
- Start a shift from the worker dashboard.
- Open the pre-shift safety checklist.
- Toggle all checklist items and submit a complete checklist.
- Submit one incomplete checklist to confirm the warning and incomplete status behavior.
- Confirm checklist history appears on the worker dashboard.

## Checklist Creation and Completion

- Confirm the checklist starts with all items unchecked.
- Toggle Safety Helmet, Dust Mask, and Emergency Kit one by one.
- Confirm the progress indicator updates as each item changes.
- Submit a completed checklist and confirm the success alert appears.
- Submit an incomplete checklist and confirm it remains visible as incomplete for review.

## Supervisor Flow

- Log in as a supervisor.
- Open the supervisor dashboard.
- Confirm checklist submissions are grouped by date.
- Confirm clear, incomplete, and absent statuses are visible.
- Capture a screenshot for portfolio evidence.

## Error and Edge Case Notes

- Try opening the checklist before starting a shift and confirm the app guides the worker properly.
- Confirm optional comments can be left blank.
- Add a short comment and confirm it appears in the submitted record.
- Test with a slow connection if possible and confirm loading indicators are understandable.

## Evidence To Capture

- Worker dashboard with an active shift.
- Checklist screen before submission.
- Checklist screen with all items confirmed.
- Supervisor dashboard showing submitted records.
- Incomplete checklist warning or incomplete status.
- Screenshot placeholder replacement files in `assets/screenshots`.
- Branch or pull request screenshot for contribution evidence.
