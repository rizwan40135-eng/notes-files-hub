# Notes & Files Hub

Create a simple notes and file upload application using our existing backend API.

Use the environment variable:

VITE_API_BASE_URL

Do not hardcode the backend URL.

Do not use Supabase.
Do not add Supabase dependencies.
Do not connect directly to PostgreSQL or Amazon S3.
Do not include AWS credentials, database passwords, or backend secrets in frontend code.

Create one simple responsive page with:

- Backend health status.
- A form with title and description.
- A Save button.
- A list of saved notes.
- A file upload button.
- Loading, success, and error messages.

Use these API endpoints:

GET  ${VITE_API_BASE_URL}/health
GET  ${VITE_API_BASE_URL}/api/items
POST ${VITE_API_BASE_URL}/api/items
POST ${VITE_API_BASE_URL}/api/files/upload-url

For creating a note, send:

{
  "name": "note title",
  "description": "note description"
}

For file uploads:

1. Send the file name and content type to `/api/files/upload-url`.
2. Receive the signed upload URL.
3. Upload the file using HTTP PUT to that URL.
4. Show a successful upload message.
5. Never expose AWS credentials or database credentials.

Keep all API calls in a reusable service module. Use `VITE_API_BASE_URL` for every request. Preserve the existing project structure and make the application compatible with the existing Docker and Azure deployment pipeline.

The application must build successfully using the existing project build command.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d3b0e721-8065-4ac9-b130-4f68598640b7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
