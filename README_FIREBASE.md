# Firebase Setup Instructions

To run the application with Firebase, you need to configure your environment variables.

1. Create a file named `.env` in the root of the project.
2. Add the following lines, replacing the values with your Firebase project credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## First Steps

1. Run `npm run dev`.
2. The app will show the Login screen.
3. Create the first user in your Firebase Console -> Authentication -> Users.
4. Log in with that user. This user will be the administrator.

## Firestore

The application will automatically create the necessary collections (`tasks`, `team_members`, etc.) as you interact with it.
